import { getFullComClientsDAOByVendor } from "./comclient-services"
import { VendorFormValues, createOrUpdateVendor, getVendorsDAO } from "./vendor-services"

async function main() {

    // const vendors= await getVendorsDAO()
    // console.log(vendors.length)

    // // iterate over vendors and update their values
    // for (const vendor of vendors) { 
        
    //     const vendorFormValue: VendorFormValues = {
    //         name: vendor.name,
    //         comClientId: vendor.comClientId,
    //     }
    //     const updatedVendor = await createOrUpdateVendor(vendorFormValue)
    // }

    const clientId = "cltc1dkoj01m1c7mpv5h3y00y"
    const result= await getFullComClientsDAOByVendor(clientId, "Washington Vendedor Viajero")
    console.log(result)

    console.log("Done")

}
  
main()
  