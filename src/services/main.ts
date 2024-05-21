import { getBuyersOfProductByCategoryImpl, getBuyersOfProductByCodeImpl, getBuyersOfProductByRankingImpl } from "./comclient-services"

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
    //const categoryName = "20v"
    //const result = await getBuyersOfProductByCategoryImpl(clientId, categoryName)
    const ranking= "62"
    const result = await getBuyersOfProductByRankingImpl(clientId, ranking)
    console.log(result)

    console.log("Done")

}
  
main()
  