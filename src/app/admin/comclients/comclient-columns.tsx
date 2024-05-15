"use client"

import { Button } from "@/components/ui/button"
import { ComClientDAO } from "@/services/comclient-services"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Phone } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { DeleteComClientDialog, ComClientDialog } from "./comclient-dialogs"
import { es } from "date-fns/locale"


export const columns: ColumnDef<ComClientDAO>[] = [
  
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
    accessorKey: "departamento",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Localidad
            <ArrowUpDown className="w-4 h-4 ml-1" />
          </Button>
    )},
    cell: ({ row }) => {
      const data= row.original
      return (
        <div>
          <p>{data.localidad}</p>
          <p>{data.departamento}</p>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },

  {
    accessorKey: "localidad",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Localidad
            <ArrowUpDown className="w-4 h-4 ml-1" />
          </Button>
    )},
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },

  {
    accessorKey: "direccion",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Direccion
            <ArrowUpDown className="w-4 h-4 ml-1" />
          </Button>
    )},
    cell: ({ row }) => {
      const data= row.original
      return (
        <div>
          <p>{data.direccion}</p>
          <div className="flex items-center gap-2">
            <Phone className="w-3 h-3" />
            <p>{data.telefono}</p>
          </div>
        </div>
      )
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

      const deleteDescription= `Do you want to delete ComClient ${data.id}?`
 
      return (
        <div className="flex items-center justify-end gap-2">

          <ComClientDialog id={data.id} />
          <DeleteComClientDialog description={deleteDescription} id={data.id} />
        </div>

      )
    },
  },
]


