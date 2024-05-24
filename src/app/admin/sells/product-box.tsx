"use client"

import { Badge } from "@/components/ui/badge"
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
            <div className="flex items-center justify-between">
                <Badge className="h-5 bg-gray-400 dark:text-white">{data.categoryName}</Badge> 
                <p>{data.code}</p>
            </div>
        </Link>

    )
}
