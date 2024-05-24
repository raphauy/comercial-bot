import DeleteAllProductsButton from "@/app/admin/products/delete-all-products-button"
import { columns } from "@/app/admin/products/product-columns"
import { DeleteAllProductsDialog, ProductDialog } from "@/app/admin/products/product-dialogs"
import { DataTable } from "@/app/admin/products/product-table"
import { getClientBySlug } from "@/services/clientService"
import { getFullProductsDAO } from "@/services/product-services"

type Props = {
    params: {
      slug: string
    }
}
export default async function ProductPage({ params }: Props) {
  
    const slug = params.slug
    const client= await getClientBySlug(slug)
    if (!client) return <div>Cliente no encontrado</div>
    
    const data= await getFullProductsDAO(slug)
    const categories= data.map((product) => product.categoryName)
    const uniqueCategories= Array.from(new Set(categories))

    return (
        <div className="w-full mt-4 space-y-8">      
            <h1 className="text-3xl font-bold text-center">Productos</h1>

            <div className="container p-3 py-4 mx-auto bg-white border rounded-md dark:bg-black text-muted-foreground dark:text-white">
                <DataTable columns={columns} data={data} subject="Producto" categories={uniqueCategories}/>
            </div>

            <div className="flex justify-end mx-auto my-2">
                <DeleteAllProductsDialog clientId={client.id} />
            </div>
        </div>
    )
}
  
