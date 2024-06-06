import * as z from "zod"
import { prisma } from "@/lib/db"

export type LeadDAO = {
	id: string
	name: string
	companyName: string | undefined
	rutOrCI: string
	phone: string
	address: string
	createdAt: Date
	updatedAt: Date
	conversationId: string
}

export const leadSchema = z.object({
	name: z.string().min(1, "name is required."),
	companyName: z.string().optional(),
	rutOrCI: z.string().min(1, "rutOrCI is required."),
	phone: z.string().min(1, "phone is required."),
	address: z.string().min(1, "address is required."),
	conversationId: z.string().min(1, "conversationId is required."),
})

export type LeadFormValues = z.infer<typeof leadSchema>


export async function getLeadsDAO() {
  const found = await prisma.lead.findMany({
    orderBy: {
      id: 'asc'
    },
  })
  return found as LeadDAO[]
}

export async function getLeadDAO(id: string) {
  const found = await prisma.lead.findUnique({
    where: {
      id
    },
  })
  return found as LeadDAO
}

export async function getLeadByPhoneDAO(clientId: string, phone: string) {
  const found = await prisma.lead.findFirst({
    where: {
      conversation: {
        clientId,
        phone
      }
    },
  })
  return found as LeadDAO
}
    
export async function createLead(data: LeadFormValues) {
  // TODO: implement createLead
  const created = await prisma.lead.create({
    data
  })
  return created
}

export async function updateLead(id: string, data: LeadFormValues) {
  const updated = await prisma.lead.update({
    where: {
      id
    },
    data
  })
  return updated
}

export async function deleteLead(id: string) {
  const deleted = await prisma.lead.delete({
    where: {
      id
    },
  })
  return deleted
}


export async function getFullLeadsDAO(clientId: string) {
  const found = await prisma.lead.findMany({
    where: {
      conversation: {
        clientId
      }
    },
    orderBy: {
      id: 'asc'
    },
    include: {
			conversation: true,
		}
  })
  return found as LeadDAO[]
}
  
export async function getFullLeadDAO(id: string) {
  const found = await prisma.lead.findUnique({
    where: {
      id
    },
    include: {
			conversation: true,
		}
  })
  return found as LeadDAO
}
    
export async function getLeadIdByConversationId(conversationId: string) {
  const found = await prisma.lead.findUnique({
    where: {
      conversationId
    },
  })
  return found?.id
}