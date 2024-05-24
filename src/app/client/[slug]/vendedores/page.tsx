import { columns } from "@/app/admin/vendors/vendor-columns"
import { DataTable } from "@/app/admin/vendors/vendor-table"
import { getFullVendorsDAO } from "@/services/vendor-services"

type Props = {
  params: {
    slug: string
  }
}
export default async function VendorPage({ params }: Props) {

  
  const data= await getFullVendorsDAO(params.slug)

  return (
    <div className="w-full mt-4 space-y-8">      
      <h1 className="text-3xl font-bold text-center">Vendedores</h1>

      <div className="container p-3 py-4 mx-auto bg-white border rounded-md dark:bg-black text-muted-foreground dark:text-white">
        <DataTable columns={columns} data={data} subject="Vendor" />
      </div>
    </div>
  )
}
  
