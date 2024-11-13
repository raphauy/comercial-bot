import { addItemToOrderImpl } from "./order-services"
import { getFullProductDAOByCode } from "./product-services"

async function main() {


    const clientId = "cltc1dkoj01m1c7mpv5h3y00y"
    const comClientId= "clwf83b1o00bj770t4hk093tz"
    
    const productCode= "TG10711556"
    const quantity= 1

    const result= await getFullProductDAOByCode(clientId, productCode)
    console.log("result: ", result)

    console.log("Done")

}
  
main()
  