"use server"
  
import { revalidatePath } from "next/cache"
import { SellDAO, SellFormValues,  getFullSellDAO, deleteSell, createOrUpdateSell } from "@/services/sell-services"


export async function getSellDAOAction(id: string): Promise<SellDAO | null> {
    // @ts-ignore
    return getFullSellDAO(id)
}

export async function createOrUpdateSellAction(data: SellFormValues): Promise<SellDAO | null> {
    const updated= await createOrUpdateSell(data)

    revalidatePath("/admin/sells")

    return updated
}

export async function deleteSellAction(id: string): Promise<SellDAO | null> {    
    const deleted= await deleteSell(id)

    revalidatePath("/admin/sells")

    return deleted as SellDAO
}

