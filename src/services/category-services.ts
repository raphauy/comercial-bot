import * as z from "zod"
import { prisma } from "@/lib/db"
import { getClientBySlug } from "./clientService"

export type CategoryDAO = {
	id: string
	name: string
  clientId: string
  createdAt: Date
  updatedAt: Date
}

export const categorySchema = z.object({
	name: z.string().min(1, "name is required."),
  clientId: z.string().min(1, "clientId is required."),
})

export type CategoryFormValues = z.infer<typeof categorySchema>


export async function getCategorysDAO() {
  const found = await prisma.category.findMany({
    orderBy: {
      id: 'asc'
    },
  })
  return found as CategoryDAO[]
}

export async function getCategoryDAO(id: string) {
  const found = await prisma.category.findUnique({
    where: {
      id
    },
  })
  return found as CategoryDAO
}

export async function getCategoryDAOByName(name: string, clientId: string) {
  const found = await prisma.category.findFirst({
    where: {
      clientId,
      name
    },
  })
  return found as CategoryDAO
}
    
export async function createCategory(data: CategoryFormValues) {
  console.log("data", data)
  
  const created = await prisma.category.create({
    data
  })
  return created
}

export async function updateCategory(id: string, data: CategoryFormValues) {
  const updated = await prisma.category.update({
    where: {
      id
    },
    data
  })
  return updated
}

export async function deleteCategory(id: string) {
  const deleted = await prisma.category.delete({
    where: {
      id
    },
  })
  return deleted
}


export async function getFullCategorysDAO(slug: string) {
  const client = await getClientBySlug(slug)
  if (!client) {
    throw new Error("client not found")
  }
  const found = await prisma.category.findMany({
    where: {
      clientId: client.id,
    },
    orderBy: {
      name: 'asc'
    }    
  })
  return found as CategoryDAO[]
}
  
export async function getFullCategoryDAO(id: string) {
  const found = await prisma.category.findUnique({
    where: {
      id
    },
    include: {
		}
  })
  return found as CategoryDAO
}
    

export async function getCategoriesOfComClient(clientId: string, comClientId: string) {
  const found = await prisma.category.findMany({
    where: {
      clientId,
      products: {
        some: {
          sells: {
            some: {
              comClientId
            }
          }
        }
      }
    },
    orderBy: {
      name: 'asc'
    }    
  })
  return found as CategoryDAO[]
}