import { getCategoriesOfComClient } from "./category-services"
import { getComplementaryFunctionsOfClient } from "./clientService"
import { clientSimilaritySearch, getComClientDAOByCode, getFullComClientDAOByCode } from "./comclient-services"
import { getAllProductsSoldToClient, getComplmentaryProducts, getProductsRecomendationsForClientImpl } from "./product-services"
import { vendorSimilaritySearch } from "./vendor-services"

async function main() {


    const clientId = "cltc1dkoj01m1c7mpv5h3y00y"

    const comClientName= "alberto moreno"
    console.log("comClientName: ", comClientName)

    const result= await getProductsRecomendationsForClientImpl(clientId, comClientName, 5)
    console.log("result: ", result)

    console.log("Done")

}
  
main()
  