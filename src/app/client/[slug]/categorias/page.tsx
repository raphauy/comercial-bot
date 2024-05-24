import { columns } from "@/app/admin/categorys/category-columns"
import { CategoryDialog } from "@/app/admin/categorys/category-dialogs"
import { DataTable } from "@/app/admin/categorys/category-table"
import { getFullCategorysDAO } from "@/services/category-services"

type Props = {
  params: {
    slug: string
  }
}
export default async function CategoryPage({ params }: Props) {
  
  const slug = params.slug
  const data= await getFullCategorysDAO(slug)

  return (
    <div className="w-full mt-4 space-y-8">      
      <h1 className="text-3xl font-bold text-center">Categorías</h1>

      <div className="container p-3 py-4 mx-auto bg-white border rounded-md dark:bg-black text-muted-foreground dark:text-white">
        <DataTable columns={columns} data={data} subject="Category"/>       
      </div>
    </div>
  )
}
  
