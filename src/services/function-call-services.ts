import { Client, ComClientStatus } from "@prisma/client";
import OpenAI from "openai";
import { ChatCompletionCreateParams, ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { CompletionInitResponse, notifyAgentes, notifyLead, notifyPedido, processFunctionCall } from "./functions";
import { getFullModelDAO } from "./model-services";
import { getActiveConversation, saveFunction } from "./conversationService";
import { getFunctionsOfClient } from "./clientService";
import { format } from "date-fns";
import { getDocumentsDAOByClient } from "./document-services";
import { getComClientDAOByPhone } from "./comclient-services";
import { getTodayOrdersDAOByComClient } from "./order-services";
import { completeWithZeros } from "@/lib/utils";
import { es } from "date-fns/locale";

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

  const comClient= await getComClientDAOByPhone(clientId, phone)
  contextString+= "\n**** Datos del usuario ****\n"
  contextString+= `Phone: ${phone}\n`
  if (!comClient || comClient.status === ComClientStatus.INACTIVE) {
    contextString+= "No se encontró ningún cliente con el número de teléfono: " + phone + ".\n"
  } else {
    contextString+= `El usuario es un cliente (comClient), estos son sus datos:\n`
    contextString+= `{
      comClientId: "${comClient.id}",
      nombre: ${comClient.name},
      codigo: ${comClient.code},
      departamento: ${comClient.departamento},
      localidad: ${comClient.localidad},
      direccion: ${comClient.direccion},
      telefono: ${comClient.telefono}
    }\n`
    contextString+= `Saludar al cliente por su nombre: ${comClient.name}.\n`
    const pendingOrders= await getTodayOrdersDAOByComClient(comClient.id)
    if (pendingOrders.length > 0) {
      contextString+= `El usuario tine los siguientes pedidos:\n`
      pendingOrders.map((order) => {
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
  }

  contextString+= "\n***************************\n"

  if (functionsNames.includes("insertLead")) {
    if (!comClient) {
      contextString+= "El usuario es un potencial lead. Invitarlo a registrarse y utilizar la función insertLead.\n"
    }
  }

  if (functionsNames.includes("addItemToOrder")) {
    // contextString+= "Recuerda que solo se crean pedidos nuevos si el usuario no tiene pedidos Ordering.\n"
  }


  return contextString
}
