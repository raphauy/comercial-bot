import * as z from "zod"
import { prisma } from "@/lib/db"
import { ComClientDAO, getComClientDAO } from "./comclient-services"
import { OrderStatus, PaymentMethod } from "@prisma/client"
import { OrderItemDAO, OrderItemFormValues } from "./orderitem-services"
import { getProductByCode } from "./functions"
import { getFullProductDAOByCode } from "./product-services"
import { completeWithZeros } from "@/lib/utils"

export type OrderDAO = {
	id: string
	orderNumber: number
	status: OrderStatus
	email: string | undefined
	name: string | undefined
	address: string | undefined
	city: string | undefined
	phone: string
	paymentMethod: PaymentMethod | undefined
	createdAt: Date
	updatedAt: Date
	comClient: ComClientDAO
	comClientId: string
  orderItems: OrderItemDAO[]
	note: string | undefined
}

export const orderSchema = z.object({
	orderNumber: z.number({required_error: "orderNumber is required."}),
	
	email: z.string().optional(),
	name: z.string().optional(),
	address: z.string().optional(),
	city: z.string().optional(),
	phone: z.string().min(1, "phone is required."),
	
	comClientId: z.string().min(1, "comClientId is required."),
	note: z.string().optional(),
})

export type OrderFormValues = z.infer<typeof orderSchema>


export async function getOrdersDAO() {
  const found = await prisma.order.findMany({
    orderBy: {
      id: 'asc'
    },
  })
  return found as OrderDAO[]
}

export async function getOrderDAO(id: string) {
  const found = await prisma.order.findUnique({
    where: {
      id
    },
  })
  return found as OrderDAO
}
    
export async function createOrder(data: OrderFormValues) {
  // TODO: implement createOrder
  const created = await prisma.order.create({
    data
  })
  return created
}

export async function updateOrder(id: string, data: OrderFormValues) {
  const updated = await prisma.order.update({
    where: {
      id
    },
    data
  })
  return updated
}

export async function deleteOrder(id: string) {
  const deleted = await prisma.order.delete({
    where: {
      id
    },
  })
  return deleted
}


export async function getFullOrdersDAO() {
  const found = await prisma.order.findMany({
    orderBy: {
      id: 'asc'
    },
    include: {
			comClient: true,
      orderItems: {
        include: {
          product: true,
        },
      }
		}
  })
  return found as OrderDAO[]
}
  
export async function getFullOrderDAO(id: string) {
  const found = await prisma.order.findUnique({
    where: {
      id
    },
    include: {
			comClient: true,
      orderItems: true,      
		}
  })
  return found as OrderDAO
}

type ItemResponse = {
  id: string
  code: string
  name: string
  quantity: number
  price: number
  currency: string
}
type OrderResponse = {
  orderId: string
  orderNumber: string
  status: string
  items: ItemResponse[]
}

export async function addItemToOrderImpl(clientId: string, orderId: string, comClientId: string, productCode: string, quantity: number) {
  // Validación de parámetros
  if (!clientId || !comClientId || !productCode || quantity <= 0) {
    throw new Error("Parámetros inválidos")
  }

  // Obtener el producto
  const product = await getFullProductDAOByCode(clientId, productCode)
  if (!product) {
    throw new Error(`Producto no encontrado: ${productCode}`)
  }
  
  // Obtener el comClient
  const comClient = await getComClientDAO(comClientId)
  if (!comClient) {
    throw new Error(`ComClient no encontrado: ${comClientId}`)
  }

  const orderNumber = await getLastOrderNumber(clientId) + 1

  let order
  if (orderId === "new") {
    // Crear nueva orden
    order = await prisma.order.create({
      data: {
        orderNumber,
        comClientId: comClientId,
        phone: comClient.telefono as string,
        status: OrderStatus.Ordering,
      }
    })
    if (!order) {
      throw new Error("Error al crear la orden")
    }
  } else {
    // Buscar orden existente
    order = await prisma.order.findUnique({
      where: {
        id: orderId
      },
    })
    if (!order) {
      throw new Error(`No se encontró una orden con id ${orderId}`)
    }
  }

  // Actualizar orden con el nuevo item
  const updatedOrder = await prisma.order.update({
    where: {
      id: order.id
    },
    data: {
      orderItems: {
        create: {
          productId: product.id,
          code: product.code,
          name: product.name,
          quantity: quantity,
          price: product.precioUSD,
        }
      }
    },
    include: {
      orderItems: true,
    },
  })

  if (!updatedOrder) {
    throw new Error("Error al actualizar la orden")
  }

  const res: OrderResponse = {
    orderId: updatedOrder.id,
    orderNumber: "#"+completeWithZeros(updatedOrder.orderNumber),
    status: updatedOrder.status,
    items: updatedOrder.orderItems.map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name as string,
      quantity: item.quantity,
      price: item.price as number,
      currency: item.currency as string,
    })),
  }

  return res
}


export async function getLastOrderNumber(clientId: string) {
  const found = await prisma.order.findFirst({
    where: {
      comClient: {
        client: {
          id: clientId
        }
      }
    },
    orderBy: {
      orderNumber: 'desc'
    },
    select: {
      orderNumber: true
    }
  })
  if (!found) 
    return 0

  return found.orderNumber
}

export async function getTodayOrdersDAOByComClient(comClientId: string) {
  const orders = await prisma.order.findMany({
    where: {
      comClientId,
      createdAt: {
        gte: new Date(Date.now() - (24 * 60 * 60 * 1000)),
      }
    },
    include: {
      orderItems: true,
    },
  })
  return orders as OrderDAO[]
}

export async function confirmOrderImpl(orderId: string, note?: string) {
  if (!note) {
    note = ""
  }
  const order = await prisma.order.findUnique({
    where: {
      id: orderId
    },
  })
  if (!order) {
    throw new Error(`No se encontró una orden con id ${orderId}`)
  }

  const updated= await prisma.order.update({
    where: {
      id: orderId
    },
    data: {
      status: OrderStatus.Confirmed,
      note: note,
    },
    include: {
      orderItems: true,
    }
  })

  if (!updated) {
    throw new Error("Error al actualizar la orden")
  }

  const res: OrderResponse = {
    orderId: updated.id,
    orderNumber: "#"+completeWithZeros(updated.orderNumber),
    status: updated.status,
    items: updated.orderItems.map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name as string,
      quantity: item.quantity,
      price: item.price as number,
      currency: item.currency as string,
    })),
  }

  return res
}

export async function cancelOrderImpl(orderId: string, note?: string) {
  if (!note) {
    note = ""
  }
  const order = await prisma.order.findUnique({
    where: {
      id: orderId
    },
  })
  if (!order) {
    throw new Error(`No se encontró una orden con id ${orderId}`)
  }

  const updated = await prisma.order.update({
    where: {
      id: orderId
    },
    data: {
      status: OrderStatus.Canceled,
      note: note,
    },
    include: {
      orderItems: true,
    }
  })

  if (!updated) {
    throw new Error("Error al actualizar la orden")
  }

  const res: OrderResponse = {
    orderId: updated.id,
    orderNumber: "#"+completeWithZeros(updated.orderNumber),
    status: updated.status,
    items: updated.orderItems.map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name as string,
      quantity: item.quantity,
      price: item.price as number,
      currency: item.currency as string,
    })),
  }

  return res
}

export async function removeItemFromOrderImpl(orderId: string, productCode: string) {
  const order = await prisma.order.findUnique({
    where: {
      id: orderId
    },
  })
  if (!order) {
    throw new Error(`No se encontró una orden con id ${orderId}`)
  }

  const deleted = await prisma.orderItem.deleteMany({
    where: {
      orderId: orderId,
      code: productCode
    }
  })

  if (!deleted) {
    throw new Error("Error al eliminar el item de la orden")
  }

  const updatedOrder= await prisma.order.findUnique({
    where: {
      id: orderId
    },
    include: {
      orderItems: true,
    }
  })

  if (!updatedOrder) {
    throw new Error("Error al actualizar la orden")
  }

  const res: OrderResponse = {
    orderId: updatedOrder.id,
    orderNumber: "#"+completeWithZeros(updatedOrder.orderNumber),
    status: updatedOrder.status,
    items: updatedOrder.orderItems.map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name as string,
      quantity: item.quantity,
      price: item.price as number,
      currency: item.currency as string,
    })),
  } 

  return res
}

export async function changeQuantityOfItemInOrderImpl(orderId: string, productCode: string, quantity: number) {
  const order = await prisma.order.findUnique({
    where: {
      id: orderId
    },
  })
  if (!order) {
    throw new Error(`No se encontró una orden con id ${orderId}`)
  }

  const updatedOrder= await prisma.order.update({
    where: {
      id: orderId
    },
    data: {
      orderItems: {
        updateMany: {
          data: {
            quantity: quantity
          },
          where: {
            orderId: orderId,
            code: productCode
          }
        }
      }
    },
    include: {
      orderItems: true,
    }
  })

  if (!updatedOrder) {
    throw new Error("Error al actualizar la orden")
  }

  const res: OrderResponse = {
    orderId: updatedOrder.id,
    orderNumber: "#"+completeWithZeros(updatedOrder.orderNumber),
    status: updatedOrder.status,
    items: updatedOrder.orderItems.map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name as string,
      quantity: item.quantity,
      price: item.price as number,
      currency: item.currency as string,
    })),
  } 

  return res
}