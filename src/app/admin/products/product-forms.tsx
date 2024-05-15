"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "@/components/ui/use-toast"
import { useEffect, useState } from "react"
import { deleteProductAction, createOrUpdateProductAction, getProductDAOAction, deleteAllProductsByClientAction } from "./product-actions"
import { productSchema, ProductFormValues } from '@/services/product-services'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Loader } from "lucide-react"

type Props= {
  id: string
  closeDialog: () => void
}

export function ProductForm({ id, closeDialog }: Props) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {},
    mode: "onChange",
  })
  const [loading, setLoading] = useState(false)

  const onSubmit = async (data: ProductFormValues) => {
    setLoading(true)
    try {
      await createOrUpdateProductAction(data)
      toast({ title: id ? "Actualizar producto" : "Crear producto" })
      closeDialog()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getProductDAOAction(id).then((data) => {
      if (data) {
        form.setValue("clientId", data.clientId)
        form.setValue("externalId", data.externalId)
        form.setValue("code", data.code)
        form.setValue("name", data.name)
        form.setValue("stock", data.stock)
        form.setValue("pedidoEnOrigen", data.pedidoEnOrigen)
        form.setValue("precioUSD", data.precioUSD)
        form.setValue("categoryName", data.categoryName)
      }
    })
  }, [form, id])

  return (
    <div className="p-4 bg-white rounded-md">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          
          <FormField
            control={form.control}
            name="externalId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ExternalId</FormLabel>
                <FormControl>
                  <Input placeholder="Product's externalId" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
      
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code</FormLabel>
                <FormControl>
                  <Input placeholder="Product's code" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
      
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Product's name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
      
          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock</FormLabel>
                <FormControl>
                  <Input placeholder="Product's stock" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
      
          <FormField
            control={form.control}
            name="pedidoEnOrigen"
            render={({ field }) => (
              <FormItem>
                <FormLabel>PedidoEnOrigen</FormLabel>
                <FormControl>
                  <Input placeholder="Product's pedidoEnOrigen" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
      
          <FormField
            control={form.control}
            name="precioUSD"
            render={({ field }) => (
              <FormItem>
                <FormLabel>PrecioUSD</FormLabel>
                <FormControl>
                  <Input placeholder="Product's precioUSD" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
      
        <div className="flex justify-end">
            <Button onClick={() => closeDialog()} type="button" variant={"secondary"} className="w-32">Cancel</Button>
            <Button type="submit" className="w-32 ml-2">
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : <p>Save</p>}
            </Button>
          </div>
        </form>
      </Form>
    </div>     
  )
}

export function DeleteProductForm({ id, closeDialog }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!id) return
    setLoading(true)
    deleteProductAction(id)
    .then(() => {
      toast({title: "Product deleted" })
    })
    .catch((error) => {
      toast({title: "Error", description: error.message, variant: "destructive"})
    })
    .finally(() => {
      setLoading(false)
      closeDialog && closeDialog()
    })
  }
  
  return (
    <div>
      <Button onClick={() => closeDialog && closeDialog()} type="button" variant={"secondary"} className="w-32">Cancel</Button>
      <Button onClick={handleDelete} variant="destructive" className="w-32 gap-1 ml-2">
        { loading && <Loader className="w-4 h-4 animate-spin" /> }
        Delete  
      </Button>
    </div>
  )
}

type DeleteAllProps= {
  clientId: string
  closeDialog: () => void
}

export function DeleteAllProductsForm({ clientId, closeDialog }: DeleteAllProps) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    deleteAllProductsByClientAction(clientId)
    .then(() => {
      toast({title: "Productos borrados" })
    })
    .catch((error) => {
      toast({title: "Error", description: error.message, variant: "destructive"})
    })
    .finally(() => {
      setLoading(false)
      closeDialog && closeDialog()
    })
  }
  
  return (
    <div>
      <Button onClick={() => closeDialog && closeDialog()} type="button" variant={"secondary"} className="w-32">Cancel</Button>
      <Button onClick={handleDelete} variant="destructive" className="gap-1 ml-2">
        { loading && <Loader className="w-4 h-4 animate-spin" /> }
        Borrar todos los productos  
      </Button>
    </div>
  )
}