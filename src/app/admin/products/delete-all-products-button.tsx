"use client"

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { deleteAllProductsByClient } from "@/services/product-services";
import { Loader } from "lucide-react";
import { useState } from "react";
import { deleteAllProductsByClientAction } from "./product-actions";

type Props = {
    clientId: string
}
export default function DeleteAllProductsButton({ clientId }: Props) {
    const [loading, setLoading] = useState(false)

    function handleDeleteAllProducts() {
        setLoading(true)
        deleteAllProductsByClientAction(clientId)
        .then((ok) => {
            toast({ title: "Productos borrados", description: "Todos los productos han sido borrados"})
        })
        .catch((error) => {
            toast({ title: "Error", description: "No se pudo borrar todos los productos"})
        })
        .finally(() => {
            setLoading(false)
        })

    }
    return (
        <>
        {
            loading ? <Loader className="w-5 h-5 animate-spin" /> :
            <Button variant="destructive" onClick={handleDeleteAllProducts}>
                Borrar todos los productos
            </Button>
        }
        </>
    )
}
