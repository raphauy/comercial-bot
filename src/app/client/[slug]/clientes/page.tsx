import { columns } from "@/app/admin/comclients/comclient-columns"
import { DataTable } from "@/app/admin/comclients/comclient-table"
import { getFullComClientsDAO } from "@/services/comclient-services"

type Props = {
  params: {
    slug: string
  }
}

export default async function ComClientPage({ params }: Props) {
  
  const slug = params.slug
  
  const data= await getFullComClientsDAO(slug)
  const departamentos= data.map((client) => client.departamento ?? "")
  const departamentosUnique= Array.from(new Set(departamentos))
  const localidades= data.map((client) => client.localidad ?? "")
  const localidadesUnique= Array.from(new Set(localidades))


  return (
    <div className="w-full mt-4 space-y-8">      
    <h1 className="text-3xl font-bold text-center">Clientes</h1>

      <div className="container p-3 py-4 mx-auto bg-white border rounded-md text-muted-foreground dark:text-white">
        <DataTable columns={columns} data={data} subject="Clientes" columnsOff={["localidad"]} departmentos={departamentosUnique} localidades={localidadesUnique}/>
      </div>
    </div>
  )
}
  
