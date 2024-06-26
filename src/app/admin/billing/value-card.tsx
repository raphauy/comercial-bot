import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";

type Props = {
    promptPrice: number
    completionPrice: number
    promptCost: number
    completionCost: number
    costIcon: boolean
    modelName: string
}

export default function ValueCard({ promptPrice, completionPrice, promptCost, completionCost, costIcon, modelName }: Props) {
    const totalCost = promptCost + completionCost
  return (
    <Card className={cn("flex flex-col", totalCost === 0 && "opacity-20")}>
        <CardHeader>
        <CardDescription>
            <div className="flex justify-between">
                {costIcon ? <p>Total de Compra</p> : <p>Total de Venta</p>}
                {costIcon ? <ArrowDownCircle /> : <ArrowUpCircle />}
            </div>
        </CardDescription>
        <CardTitle>
            <div className="flex items-center justify-between">
                <p>{Intl.NumberFormat("es-UY", { style: "currency", currency: "USD" }).format(totalCost)}</p>
                <p className="text-sm text-muted-foreground">{modelName}</p>
            </div>
        </CardTitle>
        </CardHeader>
        <CardHeader>
        <CardTitle>
            <div className="flex items-center justify-between">
            <p className="text-lg text-muted-foreground">{Intl.NumberFormat("es-UY", { style: "currency", currency: "USD" }).format(promptCost)}</p>
            <p className="text-lg text-muted-foreground">{Intl.NumberFormat("es-UY", { style: "currency", currency: "USD" }).format(completionCost)}</p>
            </div>
        </CardTitle>
        <CardDescription>
            <div className="flex justify-between">
            <p>Prompt ({Intl.NumberFormat("es-UY", { style: "currency", currency: "USD", maximumFractionDigits:2 }).format(promptPrice)})</p>
            <p>Completion ({Intl.NumberFormat("es-UY", { style: "currency", currency: "USD", maximumFractionDigits:2 }).format(completionPrice)})</p>
            </div>
        </CardDescription>
        </CardHeader>
    </Card>

  )
}
