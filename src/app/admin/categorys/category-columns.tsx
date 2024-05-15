"use client"

import { Button } from "@/components/ui/button"
import { CategoryDAO } from "@/services/category-services"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { DeleteCategoryDialog, CategoryDialog } from "./category-dialogs"
import { es } from "date-fns/locale"


export const columns: ColumnDef<CategoryDAO>[] = [
  
  {
    accessorKey: "name",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Name
            <ArrowUpDown className="w-4 h-4 ml-1" />
          </Button>
    )},
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

      const deleteDescription= `Do you want to delete Category ${data.id}?`
 
      return (
        <div className="flex items-center justify-end gap-2">

          <CategoryDialog id={data.id} />
          <DeleteCategoryDialog description={deleteDescription} id={data.id} />
        </div>

      )
    },
  },
]


