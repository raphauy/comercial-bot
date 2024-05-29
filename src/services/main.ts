import { getTopBuyersByDepartamentoAndVendorImpl } from "./comclient-services"

async function main() {


    const clientId = "cltc1dkoj01m1c7mpv5h3y00y"

    // const comClientName= "alberto moreno"
    // console.log("comClientName: ", comClientName)

    const departamento= "Maldonado"
    const vendorName= "enzo de los santos"

    const result= await getTopBuyersByDepartamentoAndVendorImpl(clientId, departamento, vendorName, 3)
    console.log("result: ", result)

    console.log("Done")

}
  
//main()
  