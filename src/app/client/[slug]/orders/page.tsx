import { getFullOrdersDAO } from "@/services/order-services"
import { OrderDialog } from "./order-dialogs"
import { DataTable } from "./order-table"
import { columns } from "./order-columns"

export default async function OrderPage() {
  
  const data= await getFullOrdersDAO()

  return (
    <div className="w-full">      

      <div className="mx-auto my-2 text-center">
        <p className="text-3xl font-bold">Ordenes</p>
      </div>

      <div className="container p-3 py-4 mx-auto bg-white border rounded-md text-muted-foreground dark:text-white dark:bg-black">
        <DataTable columns={columns} data={data} subject="Order"/>      
      </div>
    </div>
  )
}
  
