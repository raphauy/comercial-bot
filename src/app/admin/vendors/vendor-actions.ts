"use server"
  
import { revalidatePath } from "next/cache"
import { VendorDAO, VendorFormValues, createVendor, updateVendor, getFullVendorDAO, deleteVendor } from "@/services/vendor-services"


export async function getVendorDAOAction(id: string): Promise<VendorDAO | null> {
    return getFullVendorDAO(id)
}

export async function createOrUpdateVendorAction(id: string | null, data: VendorFormValues): Promise<VendorDAO | null> {       
    let updated= null
    if (id) {
        updated= await updateVendor(id, data)
    } else {
        updated= await createVendor(data)
    }     

    revalidatePath("/admin/vendors")

    return updated as VendorDAO
}

export async function deleteVendorAction(id: string): Promise<VendorDAO | null> {    
    const deleted= await deleteVendor(id)

    revalidatePath("/admin/vendors")

    return deleted as VendorDAO
}

