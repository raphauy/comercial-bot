import * as z from "zod"
import { prisma } from "@/lib/db"
import { ChatCompletionCreateParams } from "openai/resources/index.mjs"
import { Client } from "@prisma/client"
import { getDocumentsDAOByClient } from "./document-services"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { getActiveConversation } from "./conversationService"
import { getFunctionsOfClient } from "./clientService"
import { getComClientDAOByPhone } from "./comclient-services"

export type FunctionDAO = {
	id: string
	name: string
	description: string | null
	definition: string | null
	createdAt: Date
	updatedAt: Date
}

export const functionSchema = z.object({
	name: z.string({required_error: "name is required."}),
	description: z.string().optional(),
	definition: z.string().optional(),	
})

export type FunctionFormValues = z.infer<typeof functionSchema>


export async function getFunctionsDAO() {
  const found = await prisma.function.findMany({
    orderBy: {
      id: 'asc'
    },
  })
  return found as FunctionDAO[]
}

export async function getFunctionDAO(id: string) {
  const found = await prisma.function.findUnique({
    where: {
      id
    },
  })
  return found as FunctionDAO
}
    
export async function createFunction(data: FunctionFormValues) {
  const created = await prisma.function.create({
    data
  })
  return created
}

export async function updateFunction(id: string, data: FunctionFormValues) {
  const updated = await prisma.function.update({
    where: {
      id
    },
    data
  })
  return updated
}

export async function deleteFunction(id: string) {
  const deleted = await prisma.function.delete({
    where: {
      id
    },
  })
  return deleted
}

export async function getFunctionsDefinitions(clientId: string): Promise<ChatCompletionCreateParams.Function[]> {
  const found = await prisma.clientFunction.findMany({
    where: {
      clientId
    },
  })

  const functions= await prisma.function.findMany({
    where: {
      id: {
        in: found.map((f) => f.functionId)
      }
    }
  })

  try {
    const res= functions.map((f) => {
      return f.definition ? JSON.parse(f.definition) : null
    })
  
    return res
      
  } catch (error) {
    throw new Error("Error al parsear las definiciones de las funciones.")    
  }
}

export async function getClientsOfFunctionByName(name: string): Promise<Client[]> {
  const found = await prisma.clientFunction.findMany({
    where: {
      function: {
        name
      }
    },
    include: {
      client: true
    }
  })

  return found.map((f) => f.client)
}

export async function getContext(clientId: string, phone: string) {

  const functioins= await getFunctionsOfClient(clientId)
  const functionsNames= functioins.map((f) => f.name)

  let contextString= "Hablas correctamente el español, incluyendo el uso adecuado de tildes y eñes.\nPor favor, utiliza solo caracteres compatibles con UTF-8 y adecuados para el idioma español.\n"

  if (functionsNames.includes("insertLead") || functionsNames.includes("echoRegister")) {
    const conversation= await getActiveConversation(phone, clientId)
    if (conversation) {
      contextString+= "\nconversationId: " + conversation.id + "\n"
    }
  }

  if (functionsNames.includes("getDateOfNow")) {
    contextString+= "\n**** Fecha y hora ****\n"
    const hoy= format(new Date(), "EEEE, dd/MM/yyyy HH:mm:ss", {locale: es})
    contextString+= `Hoy es ${hoy}.\n`
  }

  if (functionsNames.includes("getDocument")) {
    const documents= await getDocumentsDAOByClient(clientId)
    contextString+= "\n**** Documentos ****\n"
    contextString+= "Documentos que pueden ser relevantes para elaborar una respuesta:\n"
    documents.map((doc) => {
      contextString += `
      {
        docId: "${doc.id}",
        docName: "${doc.name}",
        docDescription: "${doc.description}",
        docURL: "${doc.url}",
        sectionsCount: ${doc.sectionsCount}
      },`
    })

  }

  if (functionsNames.includes("insertLead")) {
    const comClient= await getComClientDAOByPhone(clientId, phone)
    contextString+= "\n**** Datos del usuario ****\n"
    contextString+= `Phone: ${phone}\n`
    if (!comClient) {
      contextString+= "No se encontró ningún cliente con el número de teléfono: " + phone + ".\n"
      contextString+= "El usuario es un potencial lead. Invitarlo a registrarse y utilizar la función insertLead.\n"
    } else {
      contextString+= `El usuario es un cliente, estos son sus datos:\n`
      contextString+= `{
        nombre: ${comClient.name},
        codigo: ${comClient.code},
        departamento: ${comClient.departamento},
        localidad: ${comClient.localidad},
        direccion: ${comClient.direccion},
        telefono: ${comClient.telefono}
      }\n`
      contextString+= `Saludar al cliente por su nombre: ${comClient.name}.\n`
    }

    contextString+= "\n***************************\n"
  }


  return contextString
}
