"use client"

import { Button } from "@/components/ui/button"
import { SellDAO } from "@/services/sell-services"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { format } from "date-fns"
import { DeleteSellDialog, SellDialog } from "./sell-dialogs"
import { ComClientDAO } from "@/services/comclient-services"


export const columns: ColumnDef<SellDAO>[] = [
  
  {
    accessorKey: "externalId",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            ProdId (Ranking)
            <ArrowUpDown className="w-4 h-4 ml-1" />
          </Button>
    )},
    cell: ({ row }) => {
      const data= row.original
      return (
        <div className="w-16">
          <p className="font-bold text-right">{data.externalId}</p>
        </div>
      )
    },
  },

  {
    accessorKey: "comClient",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Cliente
            <ArrowUpDown className="w-4 h-4 ml-1" />
          </Button>
    )},
    cell: ({ row }) => {
      const data= row.original
      return (
        <div>
          <p className="font-bold">{data.comClient.name}</p>
          <p>{data.comClient.code}-{data.currency}</p>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      const client: ComClientDAO= row.original.comClient
      const filter= 
        client.code.toLowerCase().includes(value.toLowerCase()) ||
        client.name.toLowerCase().includes(value.toLowerCase())
        
      return filter
    },
  },

  {
    accessorKey: "quantity",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Cantidad
            <ArrowUpDown className="w-4 h-4 ml-1" />
          </Button>
    )},
    cell: ({ row }) => {
      const data= row.original
      return (
        <div className="w-12">
          <p className="font-bold text-right">{data.quantity}</p>
        </div>
      )
    },
  },

  {
    accessorKey: "currency",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Moneda
            <ArrowUpDown className="w-4 h-4 ml-1" />
          </Button>
    )},
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const data= row.original

      const deleteDescription= `Do you want to delete Sell ${data.id}?`
 
      return (
        <div className="flex items-center justify-end gap-2">

          {/* <SellDialog id={data.id} /> */}
          <DeleteSellDialog description={deleteDescription} id={data.id} />
        </div>

      )
    },
  },
]


