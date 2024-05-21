"use client"

import { Button } from "@/components/ui/button"
import { SellDAO } from "@/services/sell-services"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { DeleteSellDialog, SellDialog } from "./sell-dialogs"
import { ComClientDAO } from "@/services/comclient-services"
import { es } from "date-fns/locale"
import { VendorDAO } from "@/services/vendor-services"
import { ProductDAO } from "@/services/product-services"
import Link from "next/link"
import ProductBox from "./product-box"
import ClientBox from "./client-box"


export const columns: ColumnDef<SellDAO>[] = [
  
  {
    accessorKey: "externalId",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Id (Ranking)
            <ArrowUpDown className="w-4 h-4 ml-1" />
          </Button>
    )},
    cell: ({ row }) => {
      const data= row.original
      return (
        <div className="w-12">
          <p className="font-bold text-right">{data.externalId}</p>
        </div>
      )
    },
  },

  {
    accessorKey: "product",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Producto
            <ArrowUpDown className="w-4 h-4 ml-1" />
          </Button>
    )},
    cell: ({ row }) => {
      const data= row.original
      return (
        <ProductBox data={data.product} />
      )
    },
    filterFn: (row, id, value) => {
      const product: ProductDAO= row.original.product
      const filter= product.name.toLowerCase().includes(value.toLowerCase()) || product.code.toLowerCase().includes(value.toLowerCase())
      return filter
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
        <ClientBox data={data} />
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
    accessorKey: "vendor",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Vendedor
            <ArrowUpDown className="w-4 h-4 ml-1" />
          </Button>
    )},
    cell: ({ row }) => {
      const data= row.original
      return (
        <p>{data.vendor.name}</p>
      )
    },
    filterFn: (row, id, value) => {
      const vendor: VendorDAO= row.getValue(id)

      return value.includes(vendor.name)
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
        return null
    },
    cell: ({ row }) => {
      const data= row.original
      return null
    },
  },

  {
    accessorKey: "UpdatedAt",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Actualizado
            <ArrowUpDown className="w-4 h-4 ml-1" />
          </Button>
    )},
		cell: ({ row }) => {
      const data= row.original
      return (<p>{formatDistanceToNow(data.updatedAt, {locale: es})}</p>) 
    }
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


