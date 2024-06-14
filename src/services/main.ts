import { addItemToOrderImpl } from "./order-services"

async function main() {


    const clientId = "cltc1dkoj01m1c7mpv5h3y00y"
    const comClientId= "clwf83b1o00bj770t4hk093tz"
    
    const productCode= "TG111165"
    const quantity= 1

    const result= await addItemToOrderImpl(clientId, comClientId, "new", productCode, quantity)
    console.log("result: ", result)

    console.log("Done")

}
  
main()
  