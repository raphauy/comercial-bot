import { getFullLeadsDAO } from "@/services/lead-services"
import { LeadDialog } from "./lead-dialogs"
import { DataTable } from "./lead-table"
import { columns } from "./lead-columns"
import { getClientBySlug } from "@/services/clientService"

type Props = {
  params: {
    slug: string
  }
}
export default async function LeadPage({ params }: Props) {
  const slug= params.slug
  const client= await getClientBySlug(slug)
  if (!client) return <div>Client not found</div>
  
  const data= await getFullLeadsDAO(client.id)

  return (
    <div className="w-full">      

      <p className="my-8 text-3xl font-bold text-center">Leads</p>

      <div className="container p-3 py-4 mx-auto bg-white border rounded-md text-muted-foreground dark:text-white dark:bg-black">
        <DataTable columns={columns} data={data} subject="Lead"/>      
      </div>
    </div>
  )
}
  
