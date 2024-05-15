import * as z from "zod"
import { prisma } from "@/lib/db"

export type ComClientDAO = {
	id: string
	code: string
	name: string
	departamento: string | undefined
	localidad: string | undefined
	direccion: string | undefined
	telefono: string | undefined
	clientId: string
}

export const comClientSchema = z.object({
	code: z.string().min(1, "code is required."),
	name: z.string().min(1, "name is required."),
	departamento: z.string().optional(),
	localidad: z.string().optional(),
	direccion: z.string().optional(),
	telefono: z.string().optional(),
	clientId: z.string().min(1, "clientId is required."),
})

export type ComClientFormValues = z.infer<typeof comClientSchema>


export async function getComClientsDAO() {
  const found = await prisma.comClient.findMany({
    orderBy: {
      id: 'asc'
    },
  })
  return found as ComClientDAO[]
}

export async function getComClientDAO(id: string) {
  const found = await prisma.comClient.findUnique({
    where: {
      id
    },
  })
  return found as ComClientDAO
}
    
export async function createComClient(data: ComClientFormValues) {
  // TODO: implement createComClient
  const created = await prisma.comClient.create({
    data
  })
  return created
}

export async function updateComClient(id: string, data: ComClientFormValues) {
  const updated = await prisma.comClient.update({
    where: {
      id
    },
    data
  })
  return updated
}

export async function deleteComClient(id: string) {
  const deleted = await prisma.comClient.delete({
    where: {
      id
    },
  })
  return deleted
}


export async function getFullComClientsDAO(slug: string) {
  const found = await prisma.comClient.findMany({
    where: {
      client: {
        slug
      }
    },
    orderBy: {
      id: 'asc'
    },
    include: {
			client: true,
		}
  })
  return found as ComClientDAO[]
}
  
export async function getFullComClientDAO(id: string) {
  const found = await prisma.comClient.findUnique({
    where: {
      id
    },
    include: {
			client: true,
		}
  })
  return found as ComClientDAO
}
    
export async function getFullComClientDAOByCode(code: string, clientId: string) {
  const found = await prisma.comClient.findUnique({
    where: {
      clientId_code: {
        code,
        clientId
      }
    },
    include: {
			client: true,
		}
  })
  return found as ComClientDAO
}