"use server"
  
import { revalidatePath } from "next/cache"
import { VendorDAO, VendorFormValues, getFullVendorDAO, deleteVendor, createOrUpdateVendor } from "@/services/vendor-services"


export async function getVendorDAOAction(id: string): Promise<VendorDAO | null> {
    return getFullVendorDAO(id)
}

export async function createOrUpdateVendorAction(id: string | null, data: VendorFormValues): Promise<VendorDAO | null> {       
    const updated= createOrUpdateVendor(data)

    revalidatePath("/admin/vendors")

    return updated
}

export async function deleteVendorAction(id: string): Promise<VendorDAO | null> {    
    const deleted= await deleteVendor(id)

    revalidatePath("/admin/vendors")

    return deleted as VendorDAO
}

