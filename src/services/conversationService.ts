import { prisma } from "@/lib/db";

import { BillingData, CompleteData } from "@/app/admin/billing/actions";
import { ChatCompletion } from "groq-sdk/resources/chat/completions.mjs";
import { ChatCompletionMessageParam, ChatCompletionSystemMessageParam, ChatCompletionUserMessageParam } from "openai/resources/index.mjs";
import { completionInit, getContext } from "./function-call-services";
import { getFunctionsDefinitions } from "./function-services";
import { getDocument } from "./functions";
import { googleCompletionInit } from "./google-function-call-services";
import { groqCompletionInit } from "./groq-function-call-services";
import { getFullModelDAO, getFullModelDAOByName } from "./model-services";
import { sendWapMessage } from "./osomService";


export default async function getConversations() {

  const found = await prisma.conversation.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      client: true
    }
  })

  return found;
}

// if clientId = "ALL" then return all conversations
export async function getConversationsOfClient(clientId: string) {
  const where= clientId === "ALL" ? {} : {
    clientId
  }

  const found = await prisma.conversation.findMany({
    where,
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      client: true,
      messages: true
    }
  })

  // const found = await prisma.conversation.findMany({
  //   where: {
  //     clientId
  //   },
  //   orderBy: {
  //     createdAt: 'desc',
  //   },
  //   include: {
  //     client: true,
  //     messages: true
  //   }
  // })

  return found;
}


// an active conversation is one that has a message in the last x minutes
export async function getActiveConversation(phone: string, clientId: string) {

  const minutes= 60
    
  const found = await prisma.conversation.findFirst({
    where: {
      phone,
      clientId,
      closed: false,
      messages: {
        some: {
          createdAt: {
            gte: new Date(Date.now() - minutes * 60 * 1000)
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      client: true
    }
  })

  return found;
}

export async function getActiveMessages(phone: string, clientId: string) {

  const activeConversation= await getActiveConversation(phone, clientId)
  if (!activeConversation) return null

  const messages= await prisma.message.findMany({
    where: {
      conversationId: activeConversation.id
    },
    orderBy: {
      createdAt: 'asc',
    }
  })

  return messages
}

export async function getConversation(id: string) {

  const found = await prisma.conversation.findUnique({
    where: {
      id
    },
    include: {
      client: true,
      messages:  {
        orderBy: {
          createdAt: 'asc',
        },
      }
    },
  })

  return found
}

export async function getLastConversation(slug: string) {
    
    const found = await prisma.conversation.findFirst({
      where: {
        client: {
          slug
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        client: true,
        messages:  {
          orderBy: {
            createdAt: 'asc',
          },
        }
      },
    })
  
    return found  
}

// find an active conversation or create a new one to connect the messages
export async function messageArrived(phone: string, text: string, clientId: string, role: string, gptData: string, promptTokens?: number, completionTokens?: number) {

  if (!clientId) throw new Error("clientId is required")

  console.log("phone: ", phone)
  console.log("clientId: ", clientId)  

  const activeConversation= await getActiveConversation(phone, clientId)
  if (activeConversation) {
    const message= await createMessage(activeConversation.id, role, text, gptData, promptTokens, completionTokens)
    return message    
  } else {
    const created= await prisma.conversation.create({
      data: {
        phone,
        clientId,
      }
    })
    const message= await createMessage(created.id, role, text, gptData, promptTokens, completionTokens)
    return message   
  }
}


export async function processMessage(id: string, modelName?: string) {
  const message= await prisma.message.findUnique({
    where: {
      id
    },
    include: {
      conversation: {
        include: {
          messages: {
            orderBy: {
              createdAt: 'asc',
            },
          },
          client: true
        }
      }
    }
  })
  if (!message) throw new Error("Message not found")

  const conversation= message.conversation

  const client= conversation.client

  //const messages= getGPTMessages(conversation.messages as ChatCompletionMessageParam[])
  if (!client.prompt) throw new Error("Client prompt not found")
  const input= message.content

  const contextString= await getContext(client.id, conversation.phone)

  const systemMessage= getSystemMessage(client.prompt, contextString)

  const filteredMessages= conversation.messages.filter((message) => message.role !== "system")
  const messages: ChatCompletionMessageParam[]= getGPTMessages(filteredMessages as ChatCompletionUserOrSystem[], systemMessage)
  // replace role function by system
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].role === "function" || messages[i].role === "tool") {
      messages[i].role = "system"
    }
  }

  const created= await messageArrived(conversation.phone, systemMessage.content, client.id, "system", "")
  //await setSectionsToMessage(created.id, contextResponse.sectionsIds)

  console.log("messages.count: " + messages.length)

  //TODO
  const functions= await getFunctionsDefinitions(client.id)

//  const completionResponse= await completionInit(client,functions, messages as ChatCompletion.Choice.Message[], modelName)
  if (!client.modelId) throw new Error("Client modelId not found")

  let completionResponse= null

  let model= modelName && await getFullModelDAOByName(modelName)
  if (!model) {
    model= await getFullModelDAO(client.modelId)
  }
  const providerName= model.providerName

  if (providerName === "OpenAI") {
    completionResponse= await completionInit(conversation.phone, client, functions, messages, 0, modelName)
  } else if (providerName === "Google") {
    completionResponse= await googleCompletionInit(client,functions, messages, systemMessage.content, modelName)
  } else if (providerName === "Groq") {
    completionResponse= await groqCompletionInit(client,functions, messages as ChatCompletion.Choice.Message[], modelName)
  }
  if (completionResponse === null) {
    console.log("completionInit returned null")
    return
  }
  
  let assistantResponse= completionResponse.assistantResponse
  const gptData= null
  const notificarAgente= completionResponse.agentes
  const notificarLead= completionResponse.leads
  const notificarPedido= completionResponse.pedidos
  const promptTokens= completionResponse.promptTokens
  const completionTokens= completionResponse.completionTokens

  if (assistantResponse) {
    const gptDataString= JSON.stringify(gptData)
    if (assistantResponse.includes("notifyHuman")) {
      assistantResponse= "Un agente se comunicará contigo a la brevedad"
    }
    // replace all characters ` with '
    assistantResponse= assistantResponse.replace(/`/g, "'")
    await messageArrived(conversation.phone, assistantResponse, conversation.clientId, "assistant", gptDataString, promptTokens, completionTokens)

    console.log("notificarAgente: " + notificarAgente)    
    sendWapMessage(conversation.phone, assistantResponse, notificarAgente, notificarLead, notificarPedido, conversation.clientId)
  }

  // if (assistantResponse) {
  //   console.log("notificarAgente: " + notificarAgente)
    
  //   sendWapMessage(conversation.phone, assistantResponse, notificarAgente, conversation.clientId)
  // } else {
  //   console.log("assistantResponse is null")
  // }   
  
  
}

type ChatCompletionUserOrSystem= ChatCompletionUserMessageParam | ChatCompletionSystemMessageParam

//function getGPTMessages(messages: (ChatCompletionUserMessageParam | ChatCompletionSystemMessageParam)[], clientPrompt: string) {
function getGPTMessages(messages: ChatCompletionUserOrSystem[], systemPrompt: ChatCompletionSystemMessageParam) {


  // const gptMessages: ChatCompletionMessageParam[]= [systemPrompt]
  const gptMessages: ChatCompletionUserOrSystem[]= [systemPrompt]
  for (const message of messages) {
    let content= message.content
    if (Array.isArray(content)) {
      content= content.join("\n")
    } else if (content === null) {
      content= ""
    }

    gptMessages.push({
      role: message.role,
      content
    })
  }
  return gptMessages
}


export function getSystemMessage(prompt: string, contextContent: string): ChatCompletionSystemMessageParam {
  const content= prompt + "\n" + contextContent

  const systemMessage: ChatCompletionMessageParam= {
    role: "system",
    content
  }
  return systemMessage
  
}


function createMessage(conversationId: string, role: string, content: string, gptData?: string, promptTokens?: number, completionTokens?: number) {
  const created= prisma.message.create({
    data: {
      role,
      content,
      gptData,
      conversationId,      
      promptTokens,
      completionTokens,
    }
  })

  return created
}
  


export async function updateConversation(id: string, role: string, content: string) {

  const newMessage= await prisma.message.create({
    data: {
      role,
      content,
      conversationId: id,
    }
  })
  
  const updated= await prisma.conversation.update({
    where: {
      id
    },
    data: {
      messages: {
        connect: {
          id: newMessage.id
        }
      }
    }
    })

  return updated
}

export async function setSearch(id: string, operacion: string, tipo: string, presupuesto: string, zona: string) {

  const updated= await prisma.conversation.update({
    where: {
      id
    },
    data: {
      operacion,
      tipo,
      presupuesto,
      zona,
    }
    })

  return updated
}


export async function deleteConversation(id: string) {
  
  const deleted= await prisma.conversation.delete({
    where: {
      id
    },
  })

  return deleted
}

export async function getBillingData(from: Date, to: Date, clientId?: string): Promise<CompleteData> {  

  const messages= await prisma.message.findMany({
    where: {
      createdAt: {
        gte: from,
        lte: to
      },
      conversation: {
        clientId: clientId
      }
    },
    include: {
      conversation: {
        include: {
          client: {
            include: {
              model: true
            }
          }
        }
      }
    }
  })

  const billingData: BillingData[]= []

  const clientMap: {[key: string]: BillingData}= {}

  for (const message of messages) {    
    const clientName= message.conversation.client.name
    const model= message.conversation.client.model
    const modelName= model?.name || ""
    const promptTokensCost= model?.inputPrice || 0
    const completionTokensCost= model?.outputPrice || 0
    const promptTokens= message.promptTokens ? message.promptTokens : 0
    const completionTokens= message.completionTokens ? message.completionTokens : 0

    if (!clientMap[clientName]) {
      clientMap[clientName]= {
        clientName,
        modelName,
        promptTokensCost,
        completionTokensCost,
        promptTokens,
        completionTokens,
        clientPricePerPromptToken: message.conversation.client.promptTokensPrice,
        clientPricePerCompletionToken: message.conversation.client.completionTokensPrice,
      }
    } else {
      clientMap[clientName].promptTokens+= promptTokens
      clientMap[clientName].completionTokens+= completionTokens
    }
  }

  let totalCost= 0

  for (const key in clientMap) {
    billingData.push(clientMap[key])
    totalCost+= (clientMap[key].promptTokens / 1000000 * clientMap[key].promptTokensCost) + (clientMap[key].completionTokens / 1000000 * clientMap[key].completionTokensCost)
  }

  // sort billingData by promptTokens
  billingData.sort((a, b) => {
    return b.promptTokens - a.promptTokens
  })

  const res: CompleteData= {
    totalCost,
    billingData
  }
  
  return res
}

export async function getMessagesCountOfActiveConversation(phone: string, clientId: string) {
  const activeConversation= await getActiveConversation(phone, clientId)
  if (!activeConversation) return 0

  const messages= await prisma.message.count({
    where: {
      conversationId: activeConversation.id
    }
  })

  return messages
}

export async function closeConversation(conversationId: string) {
  const updated= await prisma.conversation.update({
    where: {
      id: conversationId
    },
    data: {
      closed: true
    },
    include: {
      client: true
    }
  })

  return updated
}

export async function saveFunction(phone: string, completion: string, clientId: string) {
  console.log("function call")

  // Buscar el inicio y el final del JSON dentro de completion
  const functionCallStart = completion.indexOf('{"function_call":')
  if (functionCallStart === -1) {
    console.error("No se encontró 'function_call' en completion.")
    return
  }

  const functionCallEnd = completion.lastIndexOf('}') + 1 // Buscar el último '}' para cerrar el JSON
  if (functionCallEnd <= functionCallStart) {
    console.error("No se pudo determinar el final del 'function_call' JSON.")
    return
  }

  // Extraer y parsear solo el JSON de function_call
  const completionObj = JSON.parse(completion.substring(functionCallStart, functionCallEnd))
  const { name, arguments: args } = completionObj.function_call

  let text = `Llamando a la función ${name}, datos: ${args}`

  let gptData
  if (name === "getDocument" || name === "getSection") {
    const document = await getDocument(JSON.parse(args).docId)
    if (typeof document !== "string") {
      gptData = {
        functionName: name,
        docId: document.docId,
        docName: document.docName,
      }
    }
  } else if (name !== "getDateOfNow" && name !== "registrarPedido" && name !== "reservarSummit" && name !== "echoRegister" && name !== "completarFrase" && name !== "reservarServicio") {
    const copyArgs = { ...JSON.parse(args) }
    delete copyArgs.conversationId

    gptData = {
      functionName: name,
      args: copyArgs
    }
  }
  const messageStored = await messageArrived(phone, text, clientId, "function", gptData ? JSON.stringify(gptData) : "", 0, 0)
  if (messageStored) console.log("function message stored")
}
