import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createOrUpdateProduct } from "@/services/product-services";
import { ComClientFormValues, createOrUpdateComClient } from "@/services/comclient-services";


export async function POST(request: Request, { params }: { params: { clientId: string } }) {

    try {
        const authorization = request.headers.get("authorization")
        if (!authorization) return NextResponse.json({ error: "authorization is required" }, { status: 400 })
        const apiToken= authorization.replace("Bearer ", "")
        if (!apiToken) return NextResponse.json({ error: "apiToken is required" }, { status: 400 })
        if (apiToken !== process.env.API_TOKEN) return NextResponse.json({ error: "Bad apiToken" }, { status: 400 })
        
        const clientId = params.clientId
        if (!clientId) return NextResponse.json({ error: "clientId not found" }, { status: 400 })

        const json= await request.json()
        console.log("json: ", json)

        const code= json.code
        if (!code) return NextResponse.json({ error: "code is required" }, { status: 400 })

        const name= json.name || ""
        const razonSocial= json.razonSocial
        const departamento= json.departamento
        const localidad= json.localidad
        const direccion= json.direccion
        const telefono= json.telefono
        const rutOrCI= json.rutOrCI
        const status= json.status || "ACTIVE"

        if (status !== "ACTIVE" && status !== "INACTIVE") return NextResponse.json({ error: "status is invalid, should be ACTIVE or INACTIVE" }, { status: 400 })

        const dataClient: ComClientFormValues = {
            clientId,
            code,
            name,
            razonSocial,
            departamento,
            localidad,
            direccion,
            telefono,
            rutOrCI,
            status
        };
        console.log(dataClient)

        const created= await createOrUpdateComClient(dataClient)

        revalidatePath("/client/[slug]/clientes", 'page') 
        
        return NextResponse.json( { "data": created }, { status: 200 })

    } catch (error) {
        console.log("error: ", error)
        return NextResponse.json({ error: "" + error as string }, { status: 500 })        
    }
   
}
