
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClientSelector, SelectorData } from "../client-selector"
import { getDataClients, updatePrompt } from "../clients/(crud)/actions"
import { ClientFunctionsBox } from "../clients/(crud)/client-dialog"
import ConfigsPage from "../configs/page"
import { PromptForm } from "../prompts/prompt-form"
import Hook from "./hook"
import TokensPrice from "./tokens-price"
import CopyHook from "./copy-hook"
import { getClientBySlug, getFunctionsOfClient } from "@/services/clientService"
import DocumentsHook from "./documents-hook"
import ComercialHook from "./comercial-hook"
import LeadYPedidoHook from "./leads-hook"

type Props = {
    searchParams: {
        clientId: string
    }
}
export default async function ConfigPage({ searchParams }: Props) {

    const clientId= searchParams.clientId

    const clients= await getDataClients()
    const client= clients.find((client) => client.id === clientId)
    if (!client) return <div>No hay clientes</div>
    const selectors: SelectorData[]= clients.map((client) => ({ slug: client.id, name: client.nombre }))
    const narvaezClient= await getClientBySlug("narvaez")
    const summitClient= await getClientBySlug("summit")
    const functionsOfClient= await getFunctionsOfClient(clientId)
    const haveCarServiceFunction= functionsOfClient.find((f) => f.name === "reservarServicio") !== undefined
    const haveInsertLeadFunction= functionsOfClient.find((f) => f.name === "insertLead") !== undefined
    const havePedidoFunction= functionsOfClient.find((f) => f.name === "addItemToOrder") !== undefined

    const BASE_PATH= process.env.NEXTAUTH_URL || "NOT-CONFIGURED"

    return (
        <div className="flex flex-col items-center w-full p-5 gap-7">
            <Tabs defaultValue="prompt" className="min-w-[700px] xl:min-w-[1000px]">
                <TabsList className="flex justify-between w-full h-12 mb-8">
                    <ClientSelector selectors={selectors} />
                    <div>
                        <TabsTrigger value="prompt">Prompt</TabsTrigger>
                        <TabsTrigger value="functions">Funciones</TabsTrigger>
                        <TabsTrigger value="token-price">Tokens $</TabsTrigger>
                        <TabsTrigger value="hooks">Hooks</TabsTrigger>                        
                        <TabsTrigger value="general">General</TabsTrigger>
                    </div>
                </TabsList>
                <TabsContent value="prompt">
                    <PromptForm id={client.id} update={updatePrompt} prompt={client.prompt || ""} />
                </TabsContent>
                <TabsContent value="functions">
                    <ClientFunctionsBox clientId={client.id} />
                </TabsContent>
                <TabsContent value="token-price">
                    <TokensPrice clientId={client.id} promptTokensPrice={client.promptTokensPrice} completionTokensPrice={client.completionTokensPrice} />
                </TabsContent>
                <TabsContent value="hooks">
                    <Hook basePath={BASE_PATH} />
                    <DocumentsHook basePath={BASE_PATH} />
                    <CopyHook name="Narvaez Entry" path={`${BASE_PATH}/api/${narvaezClient?.id}/narvaez`} clientId={narvaezClient?.id || ""} />
                    <CopyHook name="Summit Entry" path={`${BASE_PATH}/api/${summitClient?.id}/summit`} clientId={summitClient?.id || ""} />
                    <ComercialHook basePath={BASE_PATH} />
                    { 
                        haveCarServiceFunction && 
                        <CopyHook name="Car Service Entry" path={`${BASE_PATH}/api/${client.id}/car-service`} clientId={client.id} />
                    }
                    {
                        (haveInsertLeadFunction || havePedidoFunction) && 
                        <LeadYPedidoHook basePath={BASE_PATH} />
                        
                    }
                    </TabsContent>
                <TabsContent value="general">
                    <ConfigsPage />
                </TabsContent>
            </Tabs>    

        </div>
    )
}
