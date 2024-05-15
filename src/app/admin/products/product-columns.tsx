"use client"

import { Button } from "@/components/ui/button"
import { ProductDAO } from "@/services/product-services"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { format } from "date-fns"
import { DeleteProductDialog, ProductDialog } from "./product-dialogs"
import { formatCurrency } from "@/lib/utils"


export const columns: ColumnDef<ProductDAO>[] = [
  
  {
    accessorKey: "externalId",
    header: ({ column }) => {
      return (
        <Button variant="ghost" className="pl-0 dark:text-white min-w-[170px]"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Producto (Ranking)
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
    accessorKey: "code",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Código
            <ArrowUpDown className="w-4 h-4 ml-1" />
          </Button>
    )},
  },

  {
    accessorKey: "name",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Nombre
            <ArrowUpDown className="w-4 h-4 ml-1" />
          </Button>
    )},
  },

  {
    accessorKey: "stock",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Stock
            <ArrowUpDown className="w-4 h-4 ml-1" />
          </Button>
    )},
    cell: ({ row }) => {
      const data= row.original
      return (
        <p className="mr-10 text-right">{data.stock}</p>
      )
    },
  },

  {
    accessorKey: "pedidoEnOrigen",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Origen
            <ArrowUpDown className="w-4 h-4 ml-1" />
          </Button>
    )},
    cell: ({ row }) => {
      const data= row.original
      return (
        <p className="mr-10 text-right">{data.pedidoEnOrigen}</p>
      )
    },
  },

  {
    accessorKey: "precioUSD",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Precio
            <ArrowUpDown className="w-4 h-4 ml-1" />
          </Button>
    )},
    cell: ({ row }) => {
      const data= row.original
      return (
        <p className="mr-5 text-right">{formatCurrency(data.precioUSD)}</p>
      )
    },
  },

  {
    accessorKey: "categoryName",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Categoría
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

      const deleteDescription= `Quieres eliminar el producto ${data.name}?`
 
      return (
        <div className="flex items-center justify-end gap-2">

          <ProductDialog id={data.id} />
          <DeleteProductDialog description={deleteDescription} id={data.id} />
        </div>

      )
    },
  },
]


