import * as z from "zod"
import { prisma } from "@/lib/db"
import { CategoryDAO, CategoryFormValues, createCategory, getCategoryDAO, getCategoryDAOByName } from "./category-services"
import { getClient, getClientBySlug } from "./clientService"

export type ProductDAO = {
	id: string
	externalId: string
	code: string
	name: string
	stock: number
	pedidoEnOrigen: number
	precioUSD: number
	category: CategoryDAO
	categoryId: string
  categoryName: string
  clientId: string  
  createdAt: Date
  updatedAt: Date
}

export const productSchema = z.object({
	externalId: z.string().min(1, "externalId is required."),
	code: z.string().min(1, "code is required."),
	name: z.string().min(1, "name is required."),
	stock: z.number({required_error: "stock is required."}),
	pedidoEnOrigen: z.number({required_error: "pedidoEnOrigen is required."}),
	precioUSD: z.number({required_error: "precioUSD is required."}),
	categoryName: z.string().min(1, "categoryId is required."),
  clientId: z.string().min(1, "clientSlug is required."),
})

export type ProductFormValues = z.infer<typeof productSchema>


export async function getProductsDAO() {
  const found = await prisma.product.findMany({
    orderBy: {
      id: 'asc'
    },
  })
  return found as ProductDAO[]
}

export async function getProductDAO(id: string) {
  const found = await prisma.product.findUnique({
    where: {
      id
    },
  })
  return found as ProductDAO
}
    
export async function createOrUpdateProduct(data: ProductFormValues) {
  const categoryName= data.categoryName
  const client= await getClient(data.clientId)
  if (!client) {
    throw new Error("client not found")
  }
  let category = await getCategoryDAOByName(categoryName, client.id)
  if (!category) {
    const categoryForm: CategoryFormValues = {
      name: categoryName, 
      clientId: client.id
    }
    const createdCategory = await createCategory(categoryForm)
    category = createdCategory
  }
  const dataWithCategory = {
    externalId: data.externalId,
    code: data.code,
    name: data.name,
    stock: data.stock,
    pedidoEnOrigen: data.pedidoEnOrigen,
    precioUSD: data.precioUSD,
    categoryId: category.id,
    clientId: client.id
  }

  const created = await prisma.product.upsert({
    where: {
      clientId_externalId: {
        clientId: client.id,
        externalId: data.externalId
      }
    },
    create: dataWithCategory,
    update: dataWithCategory,
  })
  return created  
}


export async function deleteProduct(id: string) {
  const deleted = await prisma.product.delete({
    where: {
      id
    },
  })
  return deleted
}

export async function deleteAllProductsByClient(clientId: string) {
  try {
    await prisma.product.deleteMany({
      where: {
        clientId
      },
    })
    return true
  
  } catch (error) {
    console.log(error)
    return false
  }
}


export async function getFullProductsDAO(slug: string) {
  const client = await getClientBySlug(slug)
  if (!client) {
    throw new Error("client not found")
  }
  const found = await prisma.product.findMany({
    where: {
      clientId: client.id
    },
    orderBy: {
      externalId: 'asc'
    },
    include: {
			category: true,
		}
  })
  const res: ProductDAO[] = found.map((product) => {
    return {
      ...product,
      categoryName: product.category.name,
    }
  })
  return res
}
  
export async function getFullProductDAO(id: string): Promise<ProductDAO> {
  const found = await prisma.product.findUnique({
    where: {
      id
    },
    include: {
			category: true,
		}
  })
  if (!found) {
    throw new Error("product not found")
  }
  const res: ProductDAO = {
    ...found,
    categoryName: found.category.name,
  }
  return res
}
    
export async function getFullProductDAOByExternalId(externalId: string, clientId: string) {
  const found = await prisma.product.findUnique({
    where: {
      clientId_externalId: {
        clientId,
        externalId
      }
    },
    include: {
			category: true,
		}
  })
  if (!found) {
    throw new Error("product not found")
  }
  const res: ProductDAO = {
    ...found,
    categoryName: found.category.name,
  }
  return res
}