"use client"

import { useEffect, useState } from "react"
import SimpleCopyHook from "./simple-copy-hook"
import { useSearchParams } from "next/navigation"

interface Props {
    basePath: string
}

export default function LeadYPedidoHook({ basePath }: Props) {

    const [clientId, setClientId]= useState("") 

    const searchParams= useSearchParams()
    useEffect(() => {
        const clientId= searchParams.get("clientId") || ""
        setClientId(clientId)
        
    }, [searchParams])

    if (!clientId) return null

    return (
        <div className="w-full p-4 mt-2 border rounded-lg">
            <p className="text-2xl font-bold">Leads y Pedidos</p>
            <SimpleCopyHook name="getLead" path={`${basePath}/api/${clientId}/leads`} />
            <SimpleCopyHook name="getPedido" path={`${basePath}/api/${clientId}/pedidos`} />
        </div>
    )
}
