import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createOrUpdateSell } from "@/services/sell-services";


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

        const comClientCode= json.clientCode
        if (!comClientCode) return NextResponse.json({ error: "clientCode is required" }, { status: 400 })
        const externalId= json.externalId
        if (!externalId) return NextResponse.json({ error: "externalId is required" }, { status: 400 })

        const currency= json.currency
        const comClientName= json.clientName
        const vendorName= json.vendorName
        const quantity= json.quantity
        const departamento= json.departamento
        const localidad= json.localidad
        const direccion= json.direccion
        const telefono= json.telefono

        const dataSell = {
            clientId,
            comClientCode,
            currency,
            vendorName,
            comClientName,
            externalId,
            quantity,
            departamento,
            localidad,
            direccion,
            telefono,
        };
        const updated= await createOrUpdateSell(dataSell)

        revalidatePath("/client/[slug]/sells", 'page') 
        
        return NextResponse.json( { "data": updated }, { status: 200 })

    } catch (error) {
        return NextResponse.json({ error: "error: " + error}, { status: 502 })        
    }
   
}
