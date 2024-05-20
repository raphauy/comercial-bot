"use server"
  
import { revalidatePath } from "next/cache"
import { ComClientDAO, ComClientFormValues, createComClient, updateComClient, getFullComClientDAO, deleteComClient, deleteAllComClientsByClient } from "@/services/comclient-services"


export async function getComClientDAOAction(id: string): Promise<ComClientDAO | null> {
    return getFullComClientDAO(id)
}

export async function createOrUpdateComClientAction(id: string | null, data: ComClientFormValues): Promise<ComClientDAO | null> {       
    let updated= null
    if (id) {
        updated= await updateComClient(id, data)
    } else {
        updated= await createComClient(data)
    }     

    revalidatePath("/admin/comclients")

    return updated as ComClientDAO
}

export async function deleteComClientAction(id: string): Promise<ComClientDAO | null> {    
    const deleted= await deleteComClient(id)

    revalidatePath("/admin/comclients")

    return deleted as ComClientDAO
}

export async function deleteAllComClientsByClientAction(clientId: string): Promise<boolean> {
    const ok= await deleteAllComClientsByClient(clientId)

    revalidatePath("/admin/comclients")

    return ok
}