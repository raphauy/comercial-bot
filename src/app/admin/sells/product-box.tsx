"use client"

import { ProductDAO } from "@/services/product-services"
import Link from "next/link"
import { useParams } from "next/navigation"

type Props= {
  data: ProductDAO
}
export default function ProductBox({ data }: Props) {
    const params= useParams()
    const slug= params.slug
    return (
        <Link href={`/client/${slug}/productos?codigo=${data.code}`} prefetch={false} target="_blank">
            <p className="font-bold">{data.name}</p>
            <p>{data.code}</p>
        </Link>

    )
}
