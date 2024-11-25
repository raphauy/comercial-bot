import { Client, ComClient, ComClientStatus, OrderStatus } from "@prisma/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import OpenAI from "openai";
import { ChatCompletionCreateParams, ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { getFunctionsOfClient } from "./clientService";
import { getComClientsDAOByPhone } from "./comclient-services";
import { getActiveConversation, saveFunction } from "./conversationService";
import { getDocumentsDAOByClient } from "./document-services";
import { CompletionInitResponse, notifyAgentes, notifyLead, notifyPedido, processFunctionCall } from "./functions";
import { getFullModelDAO } from "./model-services";
import { getTodayOrdersDAOByComClient } from "./order-services";
import { completeWithZeros } from "@/lib/utils";

const MAX_RECURSIONS = 10;

export async function completionInit(phone: string, client: Client, functions: ChatCompletionCreateParams.Function[], messages: ChatCompletionMessageParam[], recursionCount: number = 0, modelName?: string): Promise<CompletionInitResponse | null> {

  if (recursionCount > MAX_RECURSIONS) {
    throw new Error("Max recursion limit reached");
  }

  if (!client.modelId) throw new Error("Client modelId not found")

  const model= await getFullModelDAO(client.modelId)
  const provider= model.provider

  modelName= modelName || model.name
  
  const openai = new OpenAI({
    apiKey: provider.apiKey,
    baseURL: provider.baseUrl,
  })

  let completionResponse= null
  let agentes= false
  let leads= false
  let pedidos= false

  let baseArgs = {
    model: modelName,
    temperature: 0.1,
    messages
  }  

  const args = functions.length > 0 ? { ...baseArgs, functions: functions, function_call: "auto" } : baseArgs  

  const initialResponse = await openai.chat.completions.create(args as any);

  const usage= initialResponse.usage
  console.log("\tusage:")
  let promptTokens= usage ? usage.prompt_tokens : 0
  let completionTokens= usage ? usage.completion_tokens : 0
  console.log("\t\tpromptTokens: ", promptTokens)
  console.log("\t\tcompletionTokens: ", completionTokens)  

  let wantsToUseFunction = initialResponse.choices[0].finish_reason == "function_call"

  let assistantResponse: string | null = ""

  if (wantsToUseFunction) {
    console.log("\twantsToUseFunction!")

    const functionCall= initialResponse.choices[0].message.function_call
    if (!functionCall) throw new Error("No function_call message")

    const name= functionCall.name
    let args = JSON.parse(functionCall.arguments || "{}")      

    const content= await processFunctionCall(client.id, name, args)

    messages.push(initialResponse.choices[0].message)
    messages.push({
      role: "function",
      name, 
      content,
    })
    agentes= notifyAgentes(name)
    leads= notifyLead(name)
    pedidos= notifyPedido(name)
    console.log("******* notificarPedido: " + pedidos)
    
    const completion= { function_call: { name, arguments: JSON.stringify(args) } }
    await saveFunction(phone, JSON.stringify(completion), client.id)

    const stepResponse = await completionInit(phone, client, functions, messages, recursionCount + 1, modelName)
    if (!stepResponse) return null

    return {
      assistantResponse: stepResponse.assistantResponse,
      promptTokens: stepResponse.promptTokens + promptTokens,
      completionTokens: stepResponse.completionTokens + completionTokens,
      agentes: stepResponse.agentes || agentes,
      leads: stepResponse.leads || leads,
      pedidos: stepResponse.pedidos || pedidos
    }

  } else {
    console.log("\tsimple response!")
    console.log("\t", initialResponse.choices[0].message.content)
    assistantResponse = initialResponse.choices[0].message.content
    completionResponse= { assistantResponse, promptTokens, completionTokens, agentes, leads, pedidos }
    return completionResponse
  }
}



export async function getContext(clientId: string, phone: string) {

  const functioins= await getFunctionsOfClient(clientId)
  const functionsNames= functioins.map((f) => f.name)

  let contextString= "Hablas correctamente el español, incluyendo el uso adecuado de tildes y eñes.\nPor favor, utiliza solo caracteres compatibles con UTF-8 y adecuados para el idioma español.\n"

  const conversation= await getActiveConversation(phone, clientId)
  if (conversation) {
    contextString+= "\nconversationId: " + conversation.id + "\n"
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

  const comClients= await getComClientsDAOByPhone(clientId, phone)
  contextString+= "\n**** Datos del usuario ****\n"
  contextString+= await getComClientsString(phone, comClients)

  contextString+= "\n***************************\n"

  if (functionsNames.includes("insertLead")) {
    if (comClients.length === 0 || !comClients.some((comClient) => comClient.status === ComClientStatus.ACTIVE)) {
      contextString+= "El usuario es un potencial lead. Invitarlo a registrarse y utilizar la función insertLead.\n"
    }
  }

  if (functionsNames.includes("addItemToOrder")) {
    // contextString+= "Recuerda que solo se crean pedidos nuevos si el usuario no tiene pedidos Ordering.\n"
  }


  return contextString
}


async function getComClientsString(phone: string, comClients: ComClient[]) {
  let contextString= `Phone: ${phone}\n`

  if (comClients.length === 0) {
    contextString+= "No se encontró ningún cliente con el número de teléfono: " + phone + ".\n"
    return contextString
  }

  if (comClients.length === 1 && comClients[0].status === ComClientStatus.ACTIVE) {
    contextString+= `Saludar al usuario indicando que los pedidos son para: ${comClients[0].name}.\n`
  } else if (comClients.length > 1 && comClients.some((comClient) => comClient.status === ComClientStatus.ACTIVE)) {
    contextString+= "El usuario está autorizado a hacer pedidos para más de un cliente. \n" 
    contextString+= "Cuando el usuario quiera hacer un pedido, debes preguntar por el cliente al que desea hacer el pedido.\n"
    contextString+= "Clientes activos:\n"
  } else {
    contextString+= "El usuario no está asociado a ningún cliente activo.\n"
    return contextString
  }

  let index= 1
  for (const comClient of comClients) {
    contextString+= `-------\n`
    contextString+= `${index})\n`
    index++
    contextString+= `{
      comClientName: "${comClient.name}",
      comClientId: "${comClient.id}",
}\n`
    let orderingOrderId= null
    const pendingOrders= await getTodayOrdersDAOByComClient(comClient.id)
    if (pendingOrders.length > 0) {
      contextString+= `El cliente ${comClient.name} tiene los siguientes pedidos:\n`
      pendingOrders.map((order) => {
        if (order.status === OrderStatus.Ordering) {
          orderingOrderId= order.id
        }
        contextString+= `{
          orderId: "${order.id}",
          orderNumber: "#${completeWithZeros(order.orderNumber)}",
          status: "${order.status}",
          items:`
        contextString+= "[\n"
        order.orderItems.map((item) => {
          contextString+= `{
            codigo: "${item.code}",
            nombre: "${item.name}",
            precio: ${item.price},
            cantidad: ${item.quantity}
          },\n`
        })
        contextString+= "],\n"
        contextString+= "},\n"
      })
    }
    if (orderingOrderId) {
      contextString+= `El usuario tiene un pedido en estado 'Ordering'. Antes de continuar debes preguntarle si quiere confirmar o cancelar el pedido existente.\n`      
      contextString+= `Opcionalmente, el usuario puede continuar agregando productos al pedido abierto (Ordering).Para añadir productos al pedido, utiliza el identificador del pedido(orderId): ${orderingOrderId}\n`
      contextString+= `No se puede crear un nuevo pedido si el usuario tiene un pedido en estado 'Ordering'.\n`
      contextString+= `Antes de preguntar por la confirmación del pedido, debes agregar los productos al pedido abierto (Ordering) si el usuario lo desea.\n`  
    }
  }

  return contextString
}