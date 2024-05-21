"use client"

import { ComClientDAO } from "@/services/comclient-services"
import { ProductDAO } from "@/services/product-services"
import { SellDAO } from "@/services/sell-services"
import Link from "next/link"
import { useParams } from "next/navigation"

type Props= {
  data: SellDAO
}
export default function ClientBox({ data }: Props) {
    const params= useParams()
    const slug= params.slug
    return (
        <Link href={`/client/${slug}/clientes?codigo=${data.comClient.code}`} prefetch={false} target="_blank" className="min-w-[150px]">
            <p className="font-bold">{data.comClient.name}</p>
            <p>{data.comClient.code} - {data.currency}</p>
        </Link>
    )
}
