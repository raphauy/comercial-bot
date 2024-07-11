import { decodeAndCorrectText } from "@/lib/utils";
import { clientSimilaritySearch, getBuyersOfProductByCategoryImpl, getBuyersOfProductByCodeImpl, getBuyersOfProductByRankingImpl, getClientsByDepartamentoImpl, getClientsByLocalidadImpl, getComClientDAOByCode, getFullComClientsDAOByVendor, getTopBuyersByDepartamentoAndVendorImpl, getTopBuyersByDepartamentoImpl, getTopBuyersImpl } from "./comclient-services";
import { getDocumentDAO } from "./document-services";
import { LeadFormValues, createLead } from "./lead-services";
import { addBulkItemsToOrderImpl, addItemToOrderImpl, cancelOrderImpl, changeQuantityOfItemInOrderImpl, confirmOrderImpl, removeItemFromOrderImpl } from "./order-services";
import { getFullProductDAOByCategoryName, getFullProductDAOByCode, getFullProductDAOByRanking, getProductsRecomendationsForClientImpl, productSimilaritySearch } from "./product-services";
import { getSectionOfDocument } from "./section-services";
import { SummitFormValues, createSummit } from "./summit-services";

export type CompletionInitResponse = {
  assistantResponse: string | null
  promptTokens: number
  completionTokens: number
  agentes: boolean  
  leads: boolean
  pedidos: boolean
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

export async function getClientsByDepartamento(clientId: string, departamento: string) {
  console.log("getClientsByDepartamento")
  console.log(`\tdepartamento: ${departamento}`)
  
  const result= await getClientsByDepartamentoImpl(clientId, departamento)
  if (!result || result.length === 0) return "No se encontraron clientes"

  console.log(`\tgetClientsByDepartamento: ${result.length} clientes encontrados`)  

  return result
}

export async function getClientsByLocalidad(clientId: string, localidad: string) {
  console.log("getClientsByLocalidad")
  console.log(`\tlocalidad: ${localidad}`)
  
  const result= await getClientsByLocalidadImpl(clientId, localidad)
  if (!result || result.length === 0) return "No se encontraron clientes"

  console.log(`\tgetClientsByLocalidad: ${result.length} clientes encontrados`)  

  return result
}

export async function getProductsRecomendationsForClient(clientId: string, clientName: string) {
  console.log("getProductsRecomendationsForClient")
  console.log(`\tclientName: ${clientName}`)
  
  try {
    const result= await getProductsRecomendationsForClientImpl(clientId, clientName)
    if (!result || result.length === 0) return "No se encontraron productos"

    console.log(`\tgetProductsRecomendationsForClient: ${result.length} productos encontrados`)  
  
    return result

    } catch (error) {    
      if (error instanceof Error) {
        return error.message
      }
      return 'Ocurrió un error inesperado'
    }
}

export async function getTopBuyers(clientId: string) {
  const result = await getTopBuyersImpl(clientId, 10)
  if (!result || result.length === 0) return "No se encontraron clientes"

  console.log(`\tgetTopBuyers: ${result.length} clientes encontrados`)  
  return result
}

export async function getTopBuyersByDepartamento(clientId: string, departamento: string) {
  const result = await getTopBuyersByDepartamentoImpl(clientId, departamento, 10)
  if (!result || result.length === 0) return "No se encontraron clientes"

  console.log(`\tgetTopBuyersByDepartamento: ${result.length} clientes encontrados`)  
  return result
}

export async function getTopBuyersByDepartamentoAndVendor(clientId: string, departamento: string, vendorName: string) {
  const result = await getTopBuyersByDepartamentoAndVendorImpl(clientId, departamento, vendorName, 10)
  if (!result || result.length === 0) return "No se encontraron clientes"

  console.log(`\tgetTopBuyersByDepartamentoAndVendor: ${result.length} clientes encontrados`)  
  return result
}

export async function insertLead(clientId: string, conversationId: string, name: string, companyName: string, rutOrCI: string, phone: string, address: string) {
  console.log("insertLead")
  console.log(`\tname: ${name}`)
  console.log(`\tconversationId: ${conversationId}`)
  console.log(`\tcompanyName: ${companyName}`)
  console.log(`\trutOrCI: ${rutOrCI}`)
  console.log(`\tphone: ${phone}`)
  console.log(`\taddress: ${address}`)

  if (!name || !rutOrCI || !phone || !address || !conversationId) {
    return "Error al insertar, name, rutOrCI, phone, address y conversationId son obligatorios"
  }

  const leadForm: LeadFormValues = {
    name,
    companyName,
    rutOrCI,
    phone,
    address,
    conversationId: conversationId,
  }

  const created= await createLead(leadForm)
  if (!created) return "Hubo un error al insertar el lead"

  return "Lead insertado correctamente"
}

export async function addItemToOrder(clientId: string, orderId: string, comClientId: string, productCode: string, quantity: string) {
  console.log("addItemToOrder")
  console.log(`\torderId: ${orderId}`)
  console.log(`\tcomClientId: ${comClientId}`)
  console.log(`\tproductCode: ${productCode}`)
  console.log(`\tquantity: ${quantity}`)

  if (!orderId || !comClientId || !productCode || !quantity) {
    return "Parámetros incorrectos, orderId, comClientId, productCode y quantity son obligatorios"
  }

  try {
    const order= await addItemToOrderImpl(clientId, orderId, comClientId, productCode, Number(quantity))
    if (!order) return "Error al agregar el producto a la orden"
  
    console.log("orden actualizada")
    console.log(JSON.stringify(order))  
  
    return JSON.stringify(order)
      
  } catch (error) {
    console.log("Error al agregar el producto a la orden")
    console.log(error)
    return "Error al agregar el producto a la orden"
    
  }
}

export async function confirmOrder(clientId: string, orderId: string, note: string) {
  console.log("confirmOrder")
  console.log(`\torderId: ${orderId}`)
  console.log(`\tnote: ${note}`)

  if (!orderId) {
    return "Parámetros incorrectos, orderId y note son obligatorios"
  }

  try {
    const order= await confirmOrderImpl(orderId, note)
    if (!order) return "Error al confirmar la orden"
  
    console.log("orden actualizada")
    console.log(JSON.stringify(order))  
  
    return JSON.stringify(order)
      
  } catch (error) {
    console.log("Error al confirmar la orden")
    console.log(error)
    return "Error al confirmar la orden"    
  }
}

export async function cancelOrder(clientId: string, orderId: string, note: string) {
  console.log("cancelOrder")
  console.log(`\torderId: ${orderId}`)
  console.log(`\tnote: ${note}`)

  if (!orderId || !note) {
    return "Parámetros incorrectos, orderId y note son obligatorios"
  }

  try {
    const order= await cancelOrderImpl(orderId, note)
    if (!order) return "Error al cancelar la orden"
  
    console.log("orden actualizada")
    console.log(JSON.stringify(order))  
  
    return JSON.stringify(order)
      
  } catch (error) {
    console.log("Error al cancelar la orden")
    console.log(error)
    return "Error al cancelar la orden"    
  }
}

export async function removeItemFromOrder(clientId: string, orderId: string, productCode: string) {
  console.log("removeItemFromOrder")
  console.log(`\torderId: ${orderId}`)
  console.log(`\tproductCode: ${productCode}`)

  if (!orderId || !productCode) {
    return "Parámetros incorrectos, orderId y productCode son obligatorios"
  }

  try {
    const order= await removeItemFromOrderImpl(orderId, productCode)
    if (!order) return "Error al eliminar el item de la orden"
  
    console.log("orden actualizada")
    console.log(JSON.stringify(order))  
  
    return JSON.stringify(order)
      
  } catch (error) {
    console.log("Error al eliminar el item de la orden")
    console.log(error)
    return "Error al eliminar el item de la orden"    
  }
}

export async function changeQuantityOfItemInOrder(clientId: string, orderId: string, productCode: string, quantity: string) {
  console.log("changeQuantityOfItemInOrder")
  console.log(`\torderId: ${orderId}`)
  console.log(`\tproductCode: ${productCode}`)
  console.log(`\tquantity: ${quantity}`)

  if (!orderId || !productCode || !Number(quantity)) {
    return "Parámetros incorrectos, orderId, productCode y quantity son obligatorios"
  }

  try {
    const order= await changeQuantityOfItemInOrderImpl(orderId, productCode, Number(quantity))
    if (!order) return "Error al cambiar la cantidad del item de la orden"
  
    console.log("orden actualizada")
    console.log(JSON.stringify(order))  
  
    return JSON.stringify(order)
      
  } catch (error) {
    console.log("Error al cambiar la cantidad del item de la orden")
    console.log(error)
    return "Error al cambiar la cantidad del item de la orden"    
  }
}

export type FunctionCallProduct = {
  productCode: string
  quantity: string
}
export async function addBulkItemsToOrder(clientId: string, orderId: string, comClientId: string, products: FunctionCallProduct[]) {
  console.log("addBulkItemsToOrder")
  console.log(`\torderId: ${orderId}`)
  console.log(`\tcomClientId: ${comClientId}`)
  console.log(`\tproducts: ${products}`)

  if (!orderId || !comClientId || !products) {
    return "Parámetros incorrectos, orderId, comClientId y products son obligatorios"
  }

  try {
    const order= await addBulkItemsToOrderImpl(clientId, orderId, comClientId, products)
    if (!order) return "Error al agregar los productos a la orden"
  
    console.log("orden actualizada")
    console.log(JSON.stringify(order))  
  
    return JSON.stringify(order)      
  } catch (error) {
    console.log("Error al agregar los productos a la orden")
    console.log(error)
    return "Error al agregar los productos a la orden"
  }
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
      content= echoRegister(clientId, args.conversationId, decodeAndCorrectText(args.text))
      break

    case "completarFrase":
      content= completarFrase(clientId, args.conversationId, decodeAndCorrectText(args.texto))
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

    case "getClientsByDepartamento":
      content= await getClientsByDepartamento(clientId, args.departamento)
      break

    case "getClientsByLocalidad":
      content= await getClientsByLocalidad(clientId, args.localidad)
      break

    case "getProductsRecomendationsForClient":
      content= await getProductsRecomendationsForClient(clientId, args.clientName)
      break

    case "getTopBuyers":
      content= await getTopBuyers(clientId)
      break

    case "getTopBuyersByDepartamento":
      content= await getTopBuyersByDepartamento(clientId, args.departamento)
      break

    case "getTopBuyersByDepartamentoAndVendor":
      content= await getTopBuyersByDepartamentoAndVendor(clientId, args.departamento, args.vendorName)
      break

    case "insertLead":
      content= await insertLead(clientId, args.conversationId, args.name, args.companyName, args.rutOrCI, args.phone, args.address)
      break

    case "addItemToOrder":
      content= await addItemToOrder(clientId, args.orderId, args.comClientId, args.productCode, args.quantity)
      break

    case "confirmOrder":
      content= await confirmOrder(clientId, args.orderId, args.note)
      break

    case "cancelOrder":
      content= await cancelOrder(clientId, args.orderId, args.note)
      break

    case "removeItemFromOrder":
      content= await removeItemFromOrder(clientId, args.orderId, args.productCode)
      break

    case "changeQuantityOfItemInOrder":
      content= await changeQuantityOfItemInOrder(clientId, args.orderId, args.productCode, args.quantity)
      break

    case "addBulkItemsToOrder":
      content= await addBulkItemsToOrder(clientId, args.orderId, args.comClientId, args.products)
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

export function notifyAgentes(name: string): boolean {
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

export function notifyLead(name: string): boolean {
  let res= false
  switch (name) {
    case "insertLead":
      res= true
      break
    default:
      break
  }
  return res
}

export function notifyPedido(name: string): boolean {
  let res= false
  switch (name) {
    case "confirmOrder":
      res= true
      break
    default:
      break
  }
  return res
}