import * as z from "zod"
import { prisma } from "@/lib/db"
import { OpenAIEmbeddings } from "langchain/embeddings/openai"
import pgvector from 'pgvector/utils';
import { getFullVendorDAO, getFullVendorDAOByName, vendorSimilaritySearch } from "./vendor-services";

export type ComClientDAO = {
	id: string
	code: string
	name: string
	departamento: string | undefined
	localidad: string | undefined
	direccion: string | undefined
	telefono: string | undefined
	clientId: string
  createdAt: Date
  updatedAt: Date
}

export const comClientSchema = z.object({
	code: z.string().min(1, "code is required."),
	name: z.string().min(1, "name is required."),
	departamento: z.string().optional(),
	localidad: z.string().optional(),
	direccion: z.string().optional(),
	telefono: z.string().optional(),
	clientId: z.string().min(1, "clientId is required."),
})

export type ComClientFormValues = z.infer<typeof comClientSchema>


export async function getComClientsDAO() {
  const found = await prisma.comClient.findMany({
    orderBy: {
      id: 'asc'
    },
  })
  return found as ComClientDAO[]
}

export async function getComClientDAO(id: string) {
  const found = await prisma.comClient.findUnique({
    where: {
      id
    },
  })
  return found as ComClientDAO
}
    
export async function createComClient(data: ComClientFormValues) {
  const created = await prisma.comClient.create({
    data
  })

  const toEmbed= {
    nombre: data.name,
    codigo: data.code,
  }
  const textToEmbed= JSON.stringify(toEmbed)
  console.log(`Text: ${textToEmbed}`)  
  await embedAndSave(textToEmbed, created.id)

  return created
}

export async function updateComClient(id: string, data: ComClientFormValues) {
  const comClient = await getComClientDAO(id)
  const updated = await prisma.comClient.update({
    where: {
      id
    },
    data
  })

  if (comClient.name !== data.name) {
    const toEmbed= {
      nombre: data.name,
      codigo: data.code,
    }
    const textToEmbed= JSON.stringify(toEmbed)
    console.log(`Text: ${textToEmbed}`)  
    await embedAndSave(textToEmbed, updated.id)
  }

  return updated
}

export async function deleteComClient(id: string) {
  const deleted = await prisma.comClient.delete({
    where: {
      id
    },
  })
  return deleted
}


export async function getFullComClientsDAO(slug: string) {
  const found = await prisma.comClient.findMany({
    where: {
      client: {
        slug
      }
    },
    orderBy: {
      id: 'asc'
    },
    include: {
			client: true,
		}
  })
  return found as ComClientDAO[]
}

type SellsCountResult = {
	cantVentas: number
	cliente: {
    codigo: string
    nombre: string
    departamento: string | undefined
    localidad: string | undefined
    direccion: string | undefined
    telefono: string | undefined
  }
}

export async function getFullComClientsDAOByVendor(clientId: string, vendorName: string): Promise<SellsCountResult[]> {
  const similarityVendors= await vendorSimilaritySearch(clientId, vendorName, 1)
  const similarityVendor= similarityVendors[0]
  if (similarityVendor) {
    vendorName= similarityVendor.nombre
  }
  console.log(`Vendor name: ${vendorName}`)
  
  const vendor= await getFullVendorDAOByName(clientId, vendorName)
  console.log(`Vendor: ${JSON.stringify(vendor)}`)
  
  const found = await prisma.comClient.findMany({
    where: {
      vendors: {
        some: {
          vendorId: vendor.id
        }
      },
      clientId: clientId
    },
    include: {
      client: true,
      sells: true,
    },
  });
  
  const clientsWithSellCounts = found.map(client => ({
    cantVentas: client.sells.length,
    cliente: {
      codigo: client.code,
      nombre: client.name,
      departamento: client.departamento,
      localidad: client.localidad,
      direccion: client.direccion,
      telefono: client.telefono,
    }
  }))
  .sort((a, b) => b.cantVentas - a.cantVentas)
  .slice(0, 10); 
 
  return clientsWithSellCounts as SellsCountResult[]
}

type ClientResult = {
  codigo: string
  nombre: string
  departamento: string | null
  localidad: string | null
  direccion: string | null
  telefono: string | null
}


export async function getClientsByDepartamentoImpl(clientId: string, departamento: string): Promise<ClientResult[]> {
  const found = await prisma.comClient.findMany({
    where: {
      clientId: clientId,
      departamento: {
        equals: departamento.toLowerCase(),
        mode: "insensitive"
      }
    },
    include: {
      client: true,
      sells: true,
    },
    take: 10,
  })

  const res: ClientResult[] = found.map(client => ({
    codigo: client.code,
    nombre: client.name,
    departamento: client.departamento,
    localidad: client.localidad,
    direccion: client.direccion,
    telefono: client.telefono,
  }))
  return res
}

export async function getClientsByLocalidadImpl(clientId: string, localidad: string): Promise<ClientResult[]> {
  const found = await prisma.comClient.findMany({
    where: {
      clientId: clientId,
      localidad: {
        equals: localidad.toLowerCase(),
        mode: "insensitive"
      }
    },
    include: {
      client: true,
      sells: true,
    },
    take: 10,
  });

  const res: ClientResult[] = found.map(client => ({
    codigo: client.code,
    nombre: client.name,
    departamento: client.departamento,
    localidad: client.localidad,
    direccion: client.direccion,
    telefono: client.telefono,
  }))
  return res
}
  
export async function getFullComClientDAO(id: string) {
  const found = await prisma.comClient.findUnique({
    where: {
      id
    },
    include: {
			client: true,
		}
  })
  return found as ComClientDAO
}
    
export async function getFullComClientDAOByCode(code: string, clientId: string) {
  const found = await prisma.comClient.findUnique({
    where: {
      clientId_code: {
        code,
        clientId
      }
    },
    include: {
			client: true,
		}
  })
  return found as ComClientDAO
}

export async function getComClientDAOByCode(clientId: string, code: string) {
  let found = await prisma.comClient.findFirst({
    where: {
      clientId,
      code
    },
  })
  if (found) {
    return found
  }

  const allClients= await prisma.comClient.findMany({
    where: {
      clientId,
    },
  })
  if (!allClients) return null

  const newFound= allClients.find(record => code.includes(record.code))

  return newFound
  
}

type BuyCountResult = {
	cantCompras: number
	cliente: {
    codigo: string
    nombre: string
    departamento: string | undefined
    localidad: string | undefined
    direccion: string | undefined
    telefono: string | undefined
  }
}

export async function getBuyersOfProductByCodeImpl(clientId: string, productCode: string): Promise<BuyCountResult[]> {
  const found = await prisma.comClient.findMany({
    where: {
      clientId,
      sells: {
        some: {
          product: {
            code: productCode
          }
        }
      }
    },
    include: {
			client: true,
      sells: {
        include: {
          product: true,
        },
      }
		},
  })

  const clientsWithSellCounts = found.map(client => ({
    cantCompras: client.sells.filter(sell => sell.product.code === productCode)[0].quantity,
    cliente: {
      codigo: client.code,
      nombre: client.name,
      departamento: client.departamento,
      localidad: client.localidad,
      direccion: client.direccion,
      telefono: client.telefono,
    }
  }))
  .sort((a, b) => b.cantCompras - a.cantCompras)
  .slice(0, 10); 

  return clientsWithSellCounts as BuyCountResult[]
}

export async function getBuyersOfProductByRankingImpl(clientId: string, productRanking: string): Promise<BuyCountResult[]> {
  const found = await prisma.comClient.findMany({
    where: {
      clientId,
      sells: {
        some: {
          product: {
            externalId: productRanking
          }
        }
      }
    },
    include: {
			client: true,
      sells: {
        include: {
          product: true,
        },
      }
		},
  })

  const clientsWithSellCounts = found.map(client => ({
    cantCompras: client.sells.filter(sell => sell.product.externalId === productRanking)[0].quantity,
    cliente: {
      codigo: client.code,
      nombre: client.name,
      departamento: client.departamento,
      localidad: client.localidad,
      direccion: client.direccion,
      telefono: client.telefono,
    }
  }))
  .sort((a, b) => b.cantCompras - a.cantCompras)
  .slice(0, 10); 

  return clientsWithSellCounts as BuyCountResult[]
}

export async function getBuyersOfProductByCategoryImpl(clientId: string, categoryName: string): Promise<BuyCountResult[]> {
  if (categoryName === "12v")
    categoryName = "12V"
  else if (categoryName === "220v")
    categoryName = "220V"
  else if (categoryName === "20V")
    categoryName = "20v"
  else if (categoryName === "consumibles")
    categoryName = "Consumibles"
  else if (categoryName === "explosion")
    categoryName = "Explosion"
  else if (categoryName === "explosión")
    categoryName = "Explosion"
  else if (categoryName === "manuales")
    categoryName = "Manuales"

  const found = await prisma.comClient.findMany({
    where: {
      clientId,
      sells: {
        some: {
          product: {
            category: {
              name: categoryName
            }
          }
        }
      }
    },
    include: {
			client: true,
      sells: {
        include: {
          product: {
            include: {
              category: true,
            }
          }
        },
      }
		},
  })

  const clientsWithSellCounts = found.map(client => ({
    // aggregate all quantity of products of the same category
    cantCompras: client.sells.filter(sell => sell.product.category.name === categoryName).reduce((acc, sell) => acc + sell.quantity, 0),
    cliente: {
      codigo: client.code,
      nombre: client.name,
      departamento: client.departamento,
      localidad: client.localidad,
      direccion: client.direccion,
      telefono: client.telefono,
    }
  }))
  .sort((a, b) => b.cantCompras - a.cantCompras)
  .slice(0, 10); 

  return clientsWithSellCounts as BuyCountResult[]
}

export async function getTopBuyersImpl(clientId: string, take: number = 10): Promise<BuyCountResult[]> {
  // get top 10 buyers based on the quantity of products sold
  const clients = await prisma.comClient.findMany({
    where: {
      clientId,
    },
    include: {
      sells: {
        include: {
          product: true,
        },
      },
    },
  })

  const topBuyers = clients
    .map(client => ({
      ...client,
      totalQuantity: client.sells.reduce((total, sell) => total + sell.quantity, 0),
    }))
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, take)

  const clientsWithSellCounts = topBuyers.map(client => ({
    cantCompras: client.sells.reduce((acc, sell) => acc + sell.quantity, 0),
    cliente: {
      codigo: client.code,
      nombre: client.name,
      departamento: client.departamento,
      localidad: client.localidad,
      direccion: client.direccion,
      telefono: client.telefono,
    },
  }))

  return clientsWithSellCounts as BuyCountResult[]
}

export async function getTopBuyersByDepartamentoImpl(clientId: string, departamento:string, take: number = 10): Promise<BuyCountResult[]> {
  // get top 10 buyers of a specific departamento based on the quantity of products sold
  const clients = await prisma.comClient.findMany({
    where: {
      clientId,
      departamento: {
        equals: departamento.toLowerCase(),
        mode: "insensitive"
      }
    },
    include: {
      sells: {
        include: {
          product: true,
        },
      },
    },
  })

  const topBuyers = clients
    .map(client => ({
      ...client,
      totalQuantity: client.sells.reduce((total, sell) => total + sell.quantity, 0),
    }))
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, take)

  const clientsWithSellCounts = topBuyers.map(client => ({
    cantCompras: client.sells.reduce((acc, sell) => acc + sell.quantity, 0),
    cliente: {
      codigo: client.code,
      nombre: client.name,
      departamento: client.departamento,
      localidad: client.localidad,
      direccion: client.direccion,
      telefono: client.telefono,
    },
  }))

  return clientsWithSellCounts as BuyCountResult[]
}

export async function getTopBuyersByDepartamentoAndVendorImpl(clientId: string, departamento:string, vendorName: string, take: number = 10) {
  // get top 10 buyers of a specific departamento and vendor based on the quantity of products sold
  const similarityVendors= await vendorSimilaritySearch(clientId, vendorName, 1)
  const similarityVendor= similarityVendors[0]
  if (similarityVendor) {
    vendorName= similarityVendor.nombre
  }
  console.log(`Vendor name: ${vendorName}`)
  
  const vendor= await getFullVendorDAOByName(clientId, vendorName)
  if (!vendor) return "No se encontró un vendedor con el nombre: " + vendorName
  console.log(`Vendor: ${JSON.stringify(vendor)}`)
  
  const clients = await prisma.comClient.findMany({
    where: {
      clientId,
      departamento: {
        equals: departamento.toLowerCase(),
        mode: "insensitive"
      },
      vendors: {
        some: {
          vendorId: vendor.id
        }
      }
    },
    include: {
      sells: {
        include: {
          product: true,
        },
      }
		},
  })

  const topBuyers = clients
    .map(client => ({
      ...client,
      totalQuantity: client.sells.reduce((total, sell) => total + sell.quantity, 0),
    }))
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, take)

  const clientsWithSellCounts = topBuyers.map(client => ({
    cantCompras: client.sells.reduce((acc, sell) => acc + sell.quantity, 0),
    cliente: {
      codigo: client.code,
      nombre: client.name,
      departamento: client.departamento,
      localidad: client.localidad,
      direccion: client.direccion,
      telefono: client.telefono,
    },
  }))

  return clientsWithSellCounts as BuyCountResult[]
}

async function embedAndSave(text: string, comClientId: string) {
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY_FOR_EMBEDDINGS,
    verbose: true,
    modelName: "text-embedding-3-large",    
  })
  
  const vector= await embeddings.embedQuery(text)
  const embedding = pgvector.toSql(vector)
  await prisma.$executeRaw`UPDATE "ComClient" SET embedding = ${embedding}::vector WHERE id = ${comClientId}`
  console.log(`Text embeded: ${text}`)
}


export type SimilarityClientResult = {
	code: string
	name: string
	departamento: string | undefined
	localidad: string | undefined
	direccion: string | undefined
	telefono: string | undefined
  vectorDistance: number
}

export async function clientSimilaritySearch(clientId: string, text: string, limit: number = 5): Promise<SimilarityClientResult[]> {
  console.log(`Searching for similar clients for: ${text} and clientId: ${clientId}`)

  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY_FOR_EMBEDDINGS,
    verbose: true,
    modelName: "text-embedding-3-large",
  });

  const vector = await embeddings.embedQuery(text);
  const textEmbedding = pgvector.toSql(vector);


  const similarityResult: any[] = await prisma.$queryRaw`
    SELECT c."id", c."code", c."name", c."departamento", c."localidad", c."direccion", c."telefono", c."embedding" <-> ${textEmbedding}::vector AS distance 
    FROM "ComClient" AS c
    WHERE c."clientId" = ${clientId} AND c."embedding" <-> ${textEmbedding}::vector < 1.3
    ORDER BY distance
    LIMIT ${limit}`;

  const result: SimilarityClientResult[] = [];
  for (const row of similarityResult) {
    const client = await getFullComClientDAO(row.id)
    if (client) {
      result.push({
        code: row.code,
        name: row.name,
        departamento: row.departamento,
        localidad: row.localidad,
        direccion: row.direccion,
        telefono: row.telefono,
        vectorDistance: row.distance
      })
    }
  }

  return result;
}


export async function deleteAllComClientsByClient(clientId: string): Promise<boolean> {
  console.log("deleteAllComClientsByClient", clientId)

  // disconnect all vendors from client
  await prisma.comClientVendor.deleteMany({
    where: {
      comClient: {
        clientId
      }
    },
  })
  
  try {
    await prisma.comClient.deleteMany({
      where: {
        clientId
      },
    })
    return true
  
  } catch (error) {
    console.log(error)
    return false
  }
}
