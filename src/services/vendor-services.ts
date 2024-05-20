import * as z from "zod"
import { prisma } from "@/lib/db"
import { getClientByComClientId } from "./clientService"

export type VendorDAO = {
	id: string
	name: string
  comClientId: string
  createdAt: Date
  updatedAt: Date
}

export const vendorSchema = z.object({
  comClientId: z.string().min(1, "comClientId is required."),
	name: z.string().min(1, "name is required."),
})

export type VendorFormValues = z.infer<typeof vendorSchema>


export async function getVendorsDAO() {
  const found = await prisma.vendor.findMany({
    orderBy: {
      id: 'asc'
    },
  })
  return found as VendorDAO[]
}

export async function getVendorDAO(id: string) {
  const found = await prisma.vendor.findUnique({
    where: {
      id
    },
  })
  return found as VendorDAO
}
    
export async function createOrUpdateVendor(data: VendorFormValues) {
  const client= await getClientByComClientId(data.comClientId)
  if (!client) throw new Error('No se encontró un cliente con el comClientId')
  
  console.log("Searching for vendor with name and comClientId", data.name, data.comClientId)
  
  let vendor= await prisma.vendor.findFirst({
    where: {
      comClient: {
        client: {
          id: client.id
        }
      },
      name: data.name,
    },
  })
  console.log("vendor", vendor)
  

  if (!vendor) {
    console.log("Creating vendor")
    
    vendor = await prisma.vendor.create({
      data: {
        comClientId: data.comClientId,
        name: data.name,
      },
    })
  }

  return vendor as VendorDAO
}


export async function deleteVendor(id: string) {
  const deleted = await prisma.vendor.delete({
    where: {
      id
    },
  })
  return deleted
}


export async function getFullVendorsDAO(slug: string) {
  const found = await prisma.vendor.findMany({
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
  })
  return found as VendorDAO[]
}
  
export async function getFullVendorDAO(id: string) {
  const found = await prisma.vendor.findUnique({
    where: {
      id
    },
  })
  return found as VendorDAO
}

export async function getFullVendorDAOByNameAndComclientId(name: string, comClientId: string) {
  const found = await prisma.vendor.findFirst({
    where: {
      name,
      comClientId
    },
  })
  return found as VendorDAO
}