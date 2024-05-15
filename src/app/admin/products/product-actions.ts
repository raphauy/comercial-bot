"use server"
  
import { revalidatePath } from "next/cache"
import { ProductDAO, ProductFormValues, getFullProductDAO, deleteProduct, deleteAllProductsByClient, createOrUpdateProduct } from "@/services/product-services"


export async function getProductDAOAction(id: string): Promise<ProductDAO | null> {
    return getFullProductDAO(id)
}

export async function createOrUpdateProductAction(data: ProductFormValues): Promise<ProductDAO | null> {       
    const updated= await createOrUpdateProduct(data)

    revalidatePath("/client/[slug]/productos", "page")

    return updated as ProductDAO
}

export async function deleteProductAction(id: string): Promise<ProductDAO | null> {    
    const deleted= await deleteProduct(id)

    revalidatePath("/client/[slug]/productos", "page")

    return deleted as ProductDAO
}

export async function deleteAllProductsByClientAction(clientId: string): Promise<boolean> {
    const ok= await deleteAllProductsByClient(clientId)

    revalidatePath("/client/[slug]/productos", "page")

    return ok
}


