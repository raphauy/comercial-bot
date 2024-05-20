import { prisma } from "@/lib/db"
import * as z from "zod"
import { ComClientDAO, ComClientFormValues, createComClient, getFullComClientDAOByCode } from "./comclient-services"
import { ProductDAO, getFullProductDAOByExternalId } from "./product-services"
import { VendorDAO, createOrUpdateVendor } from "./vendor-services"

export type SellDAO = {
	id: string
	externalId: string
	quantity: number
	currency: string
	comClient: ComClientDAO
	comClientId: string
	product: ProductDAO
	productId: string
	vendor: VendorDAO
	vendorId: string
  createdAt: Date
  updatedAt: Date
}

export const sellSchema = z.object({
  clientId: z.string().min(1, "clientId is required."),
  comClientCode: z.string().min(1, "comClientCode is required."),
	currency: z.string().min(1, "currency is required."),
	comClientName: z.string().min(1, "comClientName is required."),
	vendorName: z.string().min(1, "vendorName is required."),
	externalId: z.string().min(1, "externalId is required."),
	quantity: z.number({required_error: "quantity is required."}),
  departamento: z.string().optional(),
  localidad: z.string().optional(),
  direccion: z.string().optional(),
  telefono: z.string().optional(),
})

export type SellFormValues = z.infer<typeof sellSchema>


export async function getSellsDAO() {
  const found = await prisma.sell.findMany({
    orderBy: {
      id: 'asc'
    },
  })
  return found as SellDAO[]
}

export async function getSellDAO(id: string) {
  const found = await prisma.sell.findUnique({
    where: {
      id
    },
  })
  return found as SellDAO
}
    
export async function createOrUpdateSell(data: SellFormValues) {
  console.log("data: ", data)
  
  // get comClient by code, if not found, create it
  let comClientId
  const comClient= await getFullComClientDAOByCode(data.comClientCode, data.clientId)
  if (!comClient) {
    const newComClientForm: ComClientFormValues = {
      clientId: data.clientId,
      code: data.comClientCode,
      name: data.comClientName,
      departamento: data.departamento,
      localidad: data.localidad,
      direccion: data.direccion,
      telefono: data.telefono,
    }
    const comClient= await createComClient(newComClientForm)
    comClientId = comClient.id
  } else {
    comClientId = comClient.id
  }

  // get product by externalId, if not found throw error
  const product = await getFullProductDAOByExternalId(data.externalId, data.clientId)
  if (!product) {
    throw new Error("product not found")
  }

  const vendor = await createOrUpdateVendor({name: data.vendorName})

  const sell= await prisma.sell.upsert({
    where: {
      comClientId_currency_productId_vendorId: {
        comClientId,
        currency: data.currency,
        productId: product.id,
        vendorId: vendor.id,
      },
    },
    create: {
      externalId: product.externalId,
      quantity: data.quantity,
      currency: data.currency,
      comClientId,
      productId: product.id,
      vendorId: vendor.id,
    },
    update: {
      quantity: data.quantity,
      currency: data.currency,
      comClientId,
      productId: product.id,
      vendorId: vendor.id,
    }
  })

  // connect vendor to comClient, but first check if vendor is already connected to comClient
  const comClientVendor = await prisma.comClientVendor.findFirst({
    where: {
      comClient: {
        id: comClientId,
      },
      vendor: {
        id: vendor.id,
      },
    },
  })
  if (!comClientVendor) {
    await prisma.comClientVendor.create({
      data: {
        comClientId,
        vendorId: vendor.id,
      }
    })
  }

  console.log("sell upsert")

  return sell as SellDAO
}

export async function deleteSell(id: string) {
  const deleted = await prisma.sell.delete({
    where: {
      id
    },
  })
  return deleted
}


export async function getFullSellsDAO(slug: string) {
  const found = await prisma.sell.findMany({
    where: {
      comClient: {
        client: {
          slug
        }
      }
    },
    orderBy: {
      id: 'asc'
    },
    include: {
			comClient: true,
			product: {
				include: {  
          category: true,
        }
      },
			vendor: true,
		}
  })
  const res: SellDAO[] = found.map((sell) => {
    return {
      ...sell,
      product: {
        ...sell.product,
        categoryName: sell.product.category.name,
      },
      comClient: {
        ...sell.comClient,
        departamento: sell.comClient.departamento || "",
        localidad: sell.comClient.localidad || "",
        direccion: sell.comClient.direccion || "",
        telefono: sell.comClient.telefono || "",
      },
    }
  })
  return res
}
  
export async function getFullSellDAO(id: string) {
  const found = await prisma.sell.findUnique({
    where: {
      id
    },
    include: {
			comClient: true,
			product: true,
			vendor: true,
		}
  })
  return found
}
    