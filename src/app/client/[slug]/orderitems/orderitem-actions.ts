"use server"
  
import { OrderItemDAO, OrderItemFormValues, createOrderItem, updateOrderItem, getFullOrderItemDAO, deleteOrderItem } from "@/services/orderitem-services"
import { revalidatePath } from "next/cache"

export async function getOrderItemDAOAction(id: string): Promise<OrderItemDAO | null> {
    return getFullOrderItemDAO(id)
}

export async function createOrUpdateOrderItemAction(id: string | null, data: OrderItemFormValues): Promise<OrderItemDAO | null> {       
    let updated= null
    if (id) {
        updated= await updateOrderItem(id, data)
    } else {
        updated= await createOrderItem(data)
    }     

    revalidatePath("/[slug]/orderitems")

    return updated as OrderItemDAO
}

export async function deleteOrderItemAction(id: string): Promise<OrderItemDAO | null> {    
    const deleted= await deleteOrderItem(id)

    revalidatePath("/[slug]/orderitems")

    return deleted as OrderItemDAO
}

