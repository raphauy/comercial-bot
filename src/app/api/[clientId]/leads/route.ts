import { getLeadByPhoneDAO, getLeadDAO } from "@/services/lead-services";
import { getNarvaezEntry } from "@/services/narvaez-services";
import { getSummitEntry } from "@/services/summit-services";
import { format } from "date-fns";
import { NextResponse } from "next/server";


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
        const message= json.message
        console.log("json: ", json)
        console.log("message: ", message)

        const phone = message.phone
        if (!phone) {
            return NextResponse.json({ error: "phone is required" }, { status: 400 })
        }

        console.log("[leads API] phone: ", phone)

        const leadsEntry = await getLeadByPhoneDAO(clientId, phone)
        console.log("[leads API] leadEntry: ", leadsEntry)

        if (!leadsEntry) {
            return NextResponse.json({ data: "Lead Entry not found" }, { status: 200 })
        }

        const fecha= leadsEntry.updatedAt.toLocaleString("es-UY", {timeZone: "America/Montevideo"})

        const data: LeadEntryResponse = {
            data: {
                phone,
                nombre: leadsEntry.name,
                empresa: leadsEntry.companyName,
                rutOrCI: leadsEntry.rutOrCI,
                direccion: leadsEntry.address,
                fecha,
            }
        }

        return NextResponse.json( data, { status: 200 })

    } catch (error) {
        return NextResponse.json({ error: "" + error as string }, { status: 500 })        
    }
   
}


type LeadEntryResponse = {
    data:{
        phone: string,
        nombre: string | null,
        empresa: string | undefined,
        rutOrCI: string | null,
        direccion: string | null,
        fecha: string,
    }
}