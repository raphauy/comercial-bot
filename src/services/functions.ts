import { decodeAndCorrectText } from "@/lib/utils";
import { getValue, setValue } from "./config-services";
import { getDocumentDAO } from "./document-services";
import { NarvaezFormValues, createOrUpdateNarvaez } from "./narvaez-services";
import { sendWapMessage } from "./osomService";
import { getSectionOfDocument } from "./section-services";
import { SummitFormValues, createSummit } from "./summit-services";
import { getConversation, messageArrived } from "./conversationService";
import { CarServiceFormValues, createCarService } from "./carservice-services";
import { revalidatePath } from "next/cache";
import { getFullProductDAOByCategoryName, getFullProductDAOByCode, getFullProductDAOByRanking, productSimilaritySearch } from "./product-services";
import { clientSimilaritySearch, getBuyersOfProductByCategoryImpl, getBuyersOfProductByCodeImpl, getBuyersOfProductByRankingImpl, getComClientDAOByCode, getFullComClientsDAOByVendor } from "./comclient-services";

export type CompletionInitResponse = {
  assistantResponse: string | null
  promptTokens: number
  completionTokens: number
  agentes: boolean  
}

export type DocumentResult = {
  docId: string
  docName: string
  docURL: string | null
  description: string | null
  content: string | null
}

export type SectionResult = {
  docId: string
  docName: string
  secuence: string
  content: string | null
}

export type TrimantProductResult = {
	numeroRanking: string
	codigo: string
	nombre: string
	stock: number
	pedidoEnOrigen: number
	precioUSD: number
  familia: string
}

export async function getDateOfNow(){
  // return the current date and time in Montevideo time zone
  const res= new Date().toLocaleString("es-UY", {timeZone: "America/Montevideo"})
  console.log("getDateOfNow: " + res)
  return res
}

export async function notifyHuman(clientId: string){
  console.log("notifyHuman")
  return "dile al usuario que un agente se va a comunicar con él, saluda y finaliza la conversación. No ofrezcas más ayuda, saluda y listo."
}

export async function getSection(docId: string, secuence: string): Promise<SectionResult | string> {
  const section= await getSectionOfDocument(docId, parseInt(secuence))
  if (!section) return "Section not found"
  console.log(`\tgetSection: doc: ${section.document.name}, secuence: ${secuence}`)

  return {
    docId: section.documentId,
    docName: section.document.name,
    secuence: secuence,
    content: section.text ?? null,
  }
}

export async function getDocument(id: string): Promise<DocumentResult | string> {
  const document= await getDocumentDAO(id)
  if (!document) return "Document not found"
  console.log(`\tgetDocument: doc: ${document.name}`)

  return {
    docId: document.id,
    docName: document.name,
    docURL: document.url ?? null,
    description: document.description ?? null,
    content: document.textContent ?? null,
  }
}

export async function echoRegister(clientId: string, conversationId: string, text: string | undefined){
  console.log("echoRegister")
  console.log(`\tconversationId: ${conversationId}`)
  console.log(`\ttexto: ${text}`)

  if (text) {
    const data: SummitFormValues = {
      conversationId,
      resumenConversacion: text,
    }
    let created= null

    try {
      created= await createSummit(data)    
      return "Echo registrado. Dile al usuario que su texto ya está registrado en el sistema"
    } catch (error) {
      return "Error al registrar, pregunta al usuario si quiere que tu reintentes"
    }
  
  } else console.log("text not found")

  return "Mensaje enviado"

}

export async function completarFrase(clientId: string, conversationId: string, texto: string | undefined){
  console.log("completarFrase")
  console.log(`\tconversationId: ${conversationId}`)
  console.log(`\ttexto: ${texto}`)

  if (texto) {
    const data: SummitFormValues = {
      conversationId,
      resumenConversacion: texto,
    }
    let created= null

    try {
      created= await createSummit(data)    
      return "Frase completada"
    } catch (error) {
      return "Error al completar la frase, pregunta al usuario si quiere que tu reintentes"
    }
  
  } else console.log("texto not found")

  return "Mensaje enviado"

}

export async function getProductsByName(clientId: string, name: string) {
  console.log("getProductsByName")
  console.log(`\tname: ${name}`)
  
  const result= await productSimilaritySearch(clientId, name)
  if (!result || result.length === 0) return "No se encontraron productos"

  console.log(`\tgetProductsByName: ${result.length} productos encontrados`)
  // log name and distance of each product
  result.forEach((product) => {
    console.log(`\t\t${product.nombre} - ${product.vectorDistance}`)
  })
  

  return result
}
export async function getProductByCode(clientId: string, code: string) {
  console.log("getProductByCode")
  console.log(`\tcode: ${code}`)
  
  const product= await getFullProductDAOByCode(clientId, code)
  if (!product) return "Producto no encontrado"

  console.log(`\tgetProductByCode: product: ${product.name}`)

  const res: TrimantProductResult = {
    numeroRanking: product.externalId,
    codigo: product.code,
    nombre: product.name,
    stock: product.stock,
    pedidoEnOrigen: product.pedidoEnOrigen,
    precioUSD: product.precioUSD,
    familia: product.categoryName
  }

  return res
}

export async function getProductByRanking(clientId: string, ranking: string) {
  console.log("getProductByRanking")
  console.log(`\tranking: ${ranking}`)
  
  const product= await getFullProductDAOByRanking(clientId, ranking)
  if (!product) return "Producto no encontrado"

  console.log(`\tgetProductByRanking: product: ${product.name}`)

  const res: TrimantProductResult = {
    numeroRanking: product.externalId,
    codigo: product.code,
    nombre: product.name,
    stock: product.stock,
    pedidoEnOrigen: product.pedidoEnOrigen,
    precioUSD: product.precioUSD,
    familia: product.categoryName
  }

  return res
}

export async function getProductsByCategoryName(clientId: string, categoryName: string) {
  console.log("getProductsByCategoryName")
  console.log(`\tcategoryName: ${categoryName}`)
  
  const result= await getFullProductDAOByCategoryName(clientId, categoryName)
  if (!result || result.length === 0) return "No se encontraron productos"

  console.log(`\tgetProductsByCategoryName: ${result.length} productos encontrados`)
  result.forEach((product) => {
    console.log(`\t\t${product.name}`)
  })  

  return result
}

type ClientResult = {
	code: string
	name: string
	departamento: string | undefined
	localidad: string | undefined
	direccion: string | undefined
	telefono: string | undefined
}

export async function getClientByCode(clientId: string, code: string) {
  console.log("getClientByCode")
  console.log(`\tcode: ${code}`)
  
  const client= await getComClientDAOByCode(clientId, code)
  if (!client) return "Cliente no encontrado"

  console.log(`\tgetClientByCode: client: ${client.name}`)

  const res: ClientResult = {
    code: client.code,
    name: client.name,
    departamento: client.departamento ?? "",
    localidad: client.localidad ?? "",
    direccion: client.direccion ?? "",
    telefono: client.telefono ?? ""
  }

  return res
}

export async function getClientsByName(clientId: string, name: string) {
  console.log("getClientsByName")
  console.log(`\tname: ${name}`)
  
  const result= await clientSimilaritySearch(clientId, name)
  if (!result || result.length === 0) return "No se encontraron clientes"

  console.log(`\tgetClientsByName: ${result.length} clientes encontrados`)
  // log name and distance of each client
  result.forEach((client) => {
    console.log(`\t\t${client.name} - ${client.vectorDistance}`)
  })

  return result
}

export async function getClientsOfVendor(clientId: string, vendorName: string) {
  console.log("getClientsOfVendor")
  console.log(`\tvendorName: ${vendorName}`)
  
  const result= await getFullComClientsDAOByVendor(clientId, vendorName)
  if (!result || result.length === 0) return "No se encontraron clientes de este vendedor"

  console.log(`\tgetClientsOfVendor: ${result.length} clientes encontrados`)
  

  return result
}

export async function getBuyersOfProductByCode(clientId: string, code: string) {
  console.log("getBuyersOfProductByCode")
  console.log(`\tproductCode: ${code}`)
  
  const result= await getBuyersOfProductByCodeImpl(clientId, code)
  if (!result || result.length === 0) return "No se encontraron clientes"

  console.log(`\tgetBuyersOfProductByCode: ${result.length} clientes encontrados`)  

  return result
}

export async function getBuyersOfProductByRanking(clientId: string, ranking: string) {
  console.log("getBuyersOfProductByRanking")
  console.log(`\tranking: ${ranking}`)
  
  const result= await getBuyersOfProductByRankingImpl(clientId, ranking)
  if (!result || result.length === 0) return "No se encontraron clientes"

  console.log(`\tgetBuyersOfProductByRanking: ${result.length} clientes encontrados`)  

  return result
}

export async function getBuyersOfProductByCategory(clientId: string, categoryName: string) {
  console.log("getBuyersOfProductByCategory")
  console.log(`\tcategoryName: ${categoryName}`)
  
  const result= await getBuyersOfProductByCategoryImpl(clientId, categoryName)
  if (!result || result.length === 0) return "No se encontraron clientes"

  console.log(`\tgetBuyersOfProductByCategory: ${result.length} clientes encontrados`)  

  return result
}

export async function processFunctionCall(clientId: string, name: string, args: any) {
  console.log("function_call: ", name, args)

  let content= null

  switch (name) {
    case "getDateOfNow":
      content = await getDateOfNow()
      break

    case "notifyHuman":
      content = await notifyHuman(clientId)
      break

    case "getDocument":
      content= await getDocument(args.docId)
      break

    case "getSection":
      content= await getSection(args.docId, args.secuence)
      break
    case "echoRegister":
      content= echoRegister(clientId, 
        args.conversationId, 
        decodeAndCorrectText(args.text)
      )
      break
    case "completarFrase":
      content= completarFrase(clientId, 
        args.conversationId, 
        decodeAndCorrectText(args.texto)        
      )
      break

    case "getProductByCode":
      content= await getProductByCode(clientId, args.code)
      break

    case "getProductByRanking":
      content= await getProductByRanking(clientId, args.ranking)
      break

    case "getProductsByCategoryName":
      content= await getProductsByCategoryName(clientId, args.categoryName)
      break

    case "getProductsByName":
      content= await getProductsByName(clientId, args.name)
      break

    case "getClientByCode":
      content= await getClientByCode(clientId, args.code)
      break

    case "getClientsByName":
      content= await getClientsByName(clientId, args.name)
      break

    case "getClientsOfVendor":
      content= await getClientsOfVendor(clientId, args.vendorName)
      break

    case "getBuyersOfProductByCode":
      content= await getBuyersOfProductByCode(clientId, args.code)
      break

    case "getBuyersOfProductByRanking":
      content= await getBuyersOfProductByRanking(clientId, args.ranking)
      break
    
    case "getBuyersOfProductByCategory":
      content= await getBuyersOfProductByCategory(clientId, args.categoryName)
      break
  
    default:
      break
  }

  if (content !== null) {      
    return JSON.stringify(content)
  } else {
    return "function call not found"
  }
}

export function getAgentes(name: string): boolean {
  let res= false
  switch (name) {
    case "notifyHuman":
      res= true
      break
    default:
      break
  }
  return res
}

