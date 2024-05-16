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
import { getFullProductDAOByCode, getFullProductDAOByRanking } from "./product-services";

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

