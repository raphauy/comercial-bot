import { getFullOrderItemsDAO } from "@/services/orderitem-services"
import { OrderItemDialog } from "./orderitem-dialogs"
import { DataTable } from "./orderitem-table"
import { columns } from "./orderitem-columns"

export default async function OrderItemPage() {
  
  const data= await getFullOrderItemsDAO()

  return (
    <div className="w-full">      

      <div className="flex justify-end mx-auto my-2">
        <OrderItemDialog />
      </div>

      <div className="container p-3 py-4 mx-auto bg-white border rounded-md text-muted-foreground dark:text-white dark:bg-black">
        <DataTable columns={columns} data={data} subject="OrderItem"/>      
      </div>
    </div>
  )
}
  
