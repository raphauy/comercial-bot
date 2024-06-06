"use server"
  
import { revalidatePath } from "next/cache"
import { LeadDAO, LeadFormValues, createLead, updateLead, getFullLeadDAO, deleteLead } from "@/services/lead-services"


export async function getLeadDAOAction(id: string): Promise<LeadDAO | null> {
    return getFullLeadDAO(id)
}

export async function createOrUpdateLeadAction(id: string | null, data: LeadFormValues): Promise<LeadDAO | null> {       
    let updated= null
    if (id) {
        updated= await updateLead(id, data)
    } else {
        updated= await createLead(data)
    }     

    revalidatePath("/[slug]/leads")

    return updated as LeadDAO
}

export async function deleteLeadAction(id: string): Promise<LeadDAO | null> {    
    const deleted= await deleteLead(id)

    revalidatePath("/[slug]/leads")

    return deleted as LeadDAO
}

