import { Client } from "@prisma/client";
import OpenAI from "openai";
import { ChatCompletionCreateParams, ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { CompletionInitResponse, notifyAgentes, notifyLead, notifyPedido, processFunctionCall } from "./functions";
import { getFullModelDAO } from "./model-services";

const MAX_RECURSIONS = 10;

export async function completionInit(client: Client, functions: ChatCompletionCreateParams.Function[], messages: ChatCompletionMessageParam[], recursionCount: number = 0, modelName?: string): Promise<CompletionInitResponse | null> {

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
    

    const stepResponse = await completionInit(client, functions, messages, recursionCount + 1, modelName)
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


