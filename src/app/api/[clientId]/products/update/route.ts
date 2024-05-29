import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createOrUpdateProduct } from "@/services/product-services";


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

        const externalId= json.externalId
        if (!externalId) return NextResponse.json({ error: "externalId is required" }, { status: 400 })

        const code= json.code
        const name= json.name
        const stock= json.stock
        const pedidoEnOrigen= json.pedidoEnOrigen
        const precioUSD= json.precioUSD
        const categoryName= json.categoryName

        const dataProduct = {
            clientId,
            externalId,
            code,
            name,
            stock,
            pedidoEnOrigen,
            precioUSD,
            categoryName,
        };
        console.log(dataProduct)

        const created= await createOrUpdateProduct(dataProduct)    

        revalidatePath("/client/[slug]/productos", 'page') 
        
        return NextResponse.json( { "data": created }, { status: 200 })

    } catch (error) {
        console.log("error: ", error)
        return NextResponse.json({ error: "error: " + error}, { status: 502 })        
    }
   
}
