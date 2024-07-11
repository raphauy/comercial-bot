"use client"

import { Button } from "@/components/ui/button"
import { OrderDAO } from "@/services/order-services"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowBigRight, ArrowUpDown, Check } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { DeleteOrderDialog, OrderDialog } from "./order-dialogs"
import { completeWithZeros } from "@/lib/utils"
import { es } from "date-fns/locale"


export const columns: ColumnDef<OrderDAO>[] = [
  
  {
    accessorKey: "orderNumber",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Número
            <ArrowUpDown className="w-4 h-4 ml-1" />
          </Button>
    )},
    cell: ({ row }) => {
      const data= row.original
      return (
        <p>#{completeWithZeros(data.orderNumber)} - {data.comClient.name}</p>
      )
    },
  },

  {
    accessorKey: "status",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Estado
            <ArrowUpDown className="w-4 h-4 ml-1" />
          </Button>
    )},
  },


  {
    accessorKey: "items",
    header: ({ column }) => {
        return (<p>Items</p>)
    },
    cell: ({ row }) => {
      const data= row.original
      return (
        <div className="">
          {data.orderItems.map((item) => (
            <div key={item.id} className="flex gap-2 border-b">
              <div className="flex-shrink-0">
                <ArrowBigRight className="w-5 h-5" />
              </div>
              <div className="flex-1 text-sm">
                <p>{item.code}: {item.name}</p>
                <p>{item.quantity} x {item.price} {item.currency}</p>
              </div>
            </div>
          ))}
          {data.note && <p className="mt-4 text-sm font-bold">Nota: {data.note}</p>}
        </div>
      )
    },
  },

  {
    id: "actions",
    cell: ({ row }) => {
      const data= row.original

      const deleteDescription= `Do you want to delete Order ${data.id}?`
 
      return (
        <div>
          <div className="flex items-center justify-end gap-2">
            <OrderDialog id={data.id} />
            <DeleteOrderDialog description={deleteDescription} id={data.id} />
          </div>
          <p>{format(data.updatedAt, "yyyy-MM-dd", { locale: es})}</p>
          <p className="mr-1 text-end">{format(data.updatedAt, "HH:mm", { locale: es})}</p>
        </div>

      )
    },
  },
]


