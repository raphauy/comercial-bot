import * as z from "zod"
import { prisma } from "@/lib/db"
import { ComClientDAO, getComClientDAO } from "./comclient-services"
import { OrderStatus, PaymentMethod } from "@prisma/client"
import { OrderItemDAO, OrderItemFormValues, createOrderItem, updateOrderItem } from "./orderitem-services"
import { FunctionCallProduct, getProductByCode } from "./functions"
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
  deliveryDate: string | undefined
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


export async function getFullOrdersDAO(slug: string) {
  const found = await prisma.order.findMany({
    where: {
      comClient: {
        client: {
          slug
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
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
  clientCode?: string
  status: string
  note: string | null
  deliveryDate: string | null
  date: string
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

  let order
  if (orderId === "new") {
    const amountOfOrdersOrdering= await getAmountOfOrdersOrdering(comClientId)
    if (amountOfOrdersOrdering > 0) {
      throw new Error("El cliente ya tiene un pedido en estado 'Ordering'. Se debe confirmar o cancelar el pedido antes de crear uno nuevo.")
    }
    // Crear nueva orden
    const orderNumber = await getLastOrderNumber(clientId) + 1
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

  const productDAO = await getFullProductDAOByCode(clientId, productCode);
  if (!productDAO) {
    throw new Error(`Producto no encontrado: ${productCode}`);
  }

  const data = {
    orderId: order.id,
    productId: productDAO.id,
    code: productDAO.code,
    name: productDAO.name,
    quantity: Number(quantity),
    price: productDAO.precioUSD,
    currency: productDAO.currency,
    externalId: productDAO.externalId,
  };

  const orderItem = await prisma.orderItem.findFirst({
    where: {
      orderId: order.id,
      code: productDAO.code,
    },
  });

  if (!orderItem) {
    await createOrderItem(data);
  } else {
    await updateOrderItem(orderItem.id, {
      ...data,
      quantity: orderItem.quantity + data.quantity,
    })
  }

  const updatedOrder = await prisma.order.findUnique({
    where: {
      id: order.id
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
    note: updatedOrder.note,
    deliveryDate: updatedOrder.deliveryDate,
    date: updatedOrder.updatedAt.toLocaleString("es-UY", {timeZone: "America/Montevideo"}),
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

export async function getAmountOfOrdersOrdering(comClientId: string) {
  const found = await prisma.order.count({
    where: {
      comClient: {
        id: comClientId
      },
      status: OrderStatus.Ordering
    }
  })
  return found
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

export async function confirmOrderImpl(orderId: string, note?: string, deliveryDate?: string) {
  if (!note) {
    note = ""
  }
  if (!deliveryDate) {
    deliveryDate = ""
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
      note,
      deliveryDate,
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
    note: updated.note,
    deliveryDate: updated.deliveryDate,
    date: updated.updatedAt.toLocaleString("es-UY", {timeZone: "America/Montevideo"}),
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
    note: updated.note,
    deliveryDate: updated.deliveryDate,
    date: updated.updatedAt.toLocaleString("es-UY", {timeZone: "America/Montevideo"}),
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
    note: updatedOrder.note,
    deliveryDate: updatedOrder.deliveryDate,
    date: updatedOrder.updatedAt.toLocaleString("es-UY", {timeZone: "America/Montevideo"}),
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
    note: updatedOrder.note,
    deliveryDate: updatedOrder.deliveryDate,
    date: updatedOrder.updatedAt.toLocaleString("es-UY", {timeZone: "America/Montevideo"}),
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

export async function addBulkItemsToOrderImpl(clientId: string, orderId: string, comClientId: string, products: FunctionCallProduct[]) {
  console.log("addBulkItemsToOrderImpl");

  if (!clientId || !orderId || !comClientId || !products || products.length === 0) {
    throw new Error("Parámetros incorrectos, clientId, orderId, comClientId y products son obligatorios y products no puede estar vacío");
  }

  const comClient = await getComClientDAO(comClientId);
  if (!comClient) {
    throw new Error(`ComClient no encontrado: ${comClientId}`);
  }

  let order;
  if (orderId === "new") {
    // Crear nueva orden
    const orderNumber = await getLastOrderNumber(clientId) + 1;
    order = await prisma.order.create({
      data: {
        orderNumber,
        comClientId: comClientId,
        phone: comClient.telefono as string,
        status: OrderStatus.Ordering,
      }
    });
    if (!order) {
      throw new Error("Error al crear la orden");
    }
  } else {
    // Buscar orden existente
    order = await prisma.order.findUnique({
      where: {
        id: orderId
      },
    });
    if (!order) {
      throw new Error(`No se encontró una orden con id ${orderId}`);
    }
  }

  // Iterar sobre los productos y crear o actualizar items de la orden
  for (const product of products) {
    const productDAO = await getFullProductDAOByCode(clientId, product.productCode);
    if (!productDAO) {
      throw new Error(`Producto no encontrado: ${product.productCode}`);
    }

    const data = {
      orderId: order.id,
      productId: productDAO.id,
      code: productDAO.code,
      name: productDAO.name,
      quantity: Number(product.quantity),
      price: productDAO.precioUSD,
      currency: productDAO.currency,
      externalId: productDAO.externalId,
    };

    const orderItem = await prisma.orderItem.findFirst({
      where: {
        orderId: order.id,
        code: productDAO.code,
      },
    });

    if (!orderItem) {
      await createOrderItem(data);
    } else {
      await updateOrderItem(orderItem.id, {
        ...data,
        quantity: orderItem.quantity + data.quantity,
      });
    }
  }

  const updatedOrder = await prisma.order.findUnique({
    where: {
      id: order.id
    },
    include: {
      orderItems: true,
    }
  });

  if (!updatedOrder) {
    throw new Error("Error al actualizar la orden");
  }

  const res: OrderResponse = {
    orderId: updatedOrder.id,
    orderNumber: "#" + completeWithZeros(updatedOrder.orderNumber),
    status: updatedOrder.status,
    note: updatedOrder.note,
    deliveryDate: updatedOrder.deliveryDate,
    date: updatedOrder.updatedAt.toLocaleString("es-UY", {timeZone: "America/Montevideo"}),
    items: updatedOrder.orderItems.map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name as string,
      quantity: item.quantity,
      price: item.price as number,
      currency: item.currency as string,
    })),
  };

  return res;
}

export async function getOrderByPhone(clientId: string, phone: string) {
  const order = await prisma.order.findFirst({
    where: {
      comClient: {
        client: {
          id: clientId
        },
        telefono: {
          contains: phone,
          mode: 'insensitive'
        }
      },
      status: OrderStatus.Confirmed,
      updatedAt: {
        gte: new Date(Date.now() - (24 * 60 * 60 * 1000)),
      }
    },
    orderBy: {
      updatedAt: 'desc'
    },
    include: {
      orderItems: true,
      comClient: true,
    }
  })

  if (!order) {
    return null
  }

  const res: OrderResponse = {
    orderId: order.id,
    orderNumber: "#" + completeWithZeros(order.orderNumber),
    clientCode: order.comClient.code,
    status: order.status,
    note: order.note,
    deliveryDate: order.deliveryDate,
    date: order.updatedAt.toLocaleString("es-UY", {timeZone: "America/Montevideo"}),
   items: order.orderItems.map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name as string,
      quantity: item.quantity,
      price: item.price as number,
      currency: item.currency as string,
      externalId: item.externalId,
    })),
  }

  return res

}