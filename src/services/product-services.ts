import * as z from "zod"
import { prisma } from "@/lib/db"
import { CategoryDAO, CategoryFormValues, createCategory, getCategoriesOfComClient, getCategoryDAO, getCategoryDAOByName } from "./category-services"
import { getClient, getClientBySlug } from "./clientService"
import { OpenAIEmbeddings } from "langchain/embeddings/openai"
import pgvector from 'pgvector/utils';
import { clientSimilaritySearch, getFullComClientDAOByCode } from "./comclient-services"

export type ProductDAO = {
	id: string
	externalId: string
	code: string
	name: string
	stock: number
	pedidoEnOrigen: number
	precioUSD: number
	category: CategoryDAO
	categoryId: string
  categoryName: string
  clientId: string  
  createdAt: Date
  updatedAt: Date
}

export const productSchema = z.object({
	externalId: z.string().min(1, "externalId is required."),
	code: z.string().min(1, "code is required."),
	name: z.string().min(1, "name is required."),
	stock: z.number({required_error: "stock is required."}),
	pedidoEnOrigen: z.number({required_error: "pedidoEnOrigen is required."}),
	precioUSD: z.number({required_error: "precioUSD is required."}),
	categoryName: z.string().min(1, "categoryId is required."),
  clientId: z.string().min(1, "clientSlug is required."),
})

export type ProductFormValues = z.infer<typeof productSchema>


export async function getProductsDAO() {
  const found = await prisma.product.findMany({
    orderBy: {
      id: 'asc'
    },
  })
  return found as ProductDAO[]
}

export async function getProductDAO(id: string) {
  const found = await prisma.product.findUnique({
    where: {
      id
    },
  })
  return found as ProductDAO
}
    
export async function createOrUpdateProduct(data: ProductFormValues) {
  const categoryName= data.categoryName
  const client= await getClient(data.clientId)
  if (!client) {
    throw new Error("client not found")
  }
  let category = await getCategoryDAOByName(categoryName, client.id)
  if (!category) {
    const categoryForm: CategoryFormValues = {
      name: categoryName, 
      clientId: client.id
    }
    const createdCategory = await createCategory(categoryForm)
    category = createdCategory
  }
  const dataWithCategory = {
    externalId: data.externalId,
    code: data.code,
    name: data.name,
    stock: data.stock,
    pedidoEnOrigen: data.pedidoEnOrigen,
    precioUSD: data.precioUSD,
    categoryId: category.id,
    clientId: client.id
  }

  const product= await getFullProductDAOByExternalId(data.externalId, data.clientId)
  const productName= product?.name

  const created = await prisma.product.upsert({
    where: {
      clientId_externalId: {
        clientId: client.id,
        externalId: data.externalId
      }
    },
    create: dataWithCategory,
    update: dataWithCategory,
  })

  if (!created.id) return null

  if (productName !== data.name) {
    const toEmbed= {
      nombre: data.name,
      familia: category.name
    }
    const textToEmbed= JSON.stringify(toEmbed)
    console.log(`Text: ${textToEmbed}`)  
    await embedAndSave(textToEmbed, created.id)  
  }
  
  return created  
}


export async function deleteProduct(id: string) {
  const deleted = await prisma.product.delete({
    where: {
      id
    },
  })
  return deleted
}

export async function deleteAllProductsByClient(clientId: string) {
  try {
    await prisma.product.deleteMany({
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


export async function getFullProductsDAO(slug: string) {
  const client = await getClientBySlug(slug)
  if (!client) {
    throw new Error("client not found")
  }
  const found = await prisma.product.findMany({
    where: {
      clientId: client.id
    },
    orderBy: {
      name: 'asc'
    },
    include: {
			category: true,
		}
  })
  const res: ProductDAO[] = found.map((product) => {
    return {
      ...product,
      categoryName: product.category.name,
    }
  })
  return res
}
  
export async function getFullProductDAO(id: string): Promise<ProductDAO> {
  const found = await prisma.product.findUnique({
    where: {
      id
    },
    include: {
			category: true,
		}
  })
  if (!found) {
    throw new Error("product not found")
  }
  const res: ProductDAO = {
    ...found,
    categoryName: found.category.name,
  }
  return res
}
    
export async function getFullProductDAOByExternalId(externalId: string, clientId: string) {
  const found = await prisma.product.findUnique({
    where: {
      clientId_externalId: {
        clientId,
        externalId
      }
    },
    include: {
			category: true,
		}
  })
  if (!found) {
    return null
    // throw new Error("product not found")
  }
  const res: ProductDAO = {
    ...found,
    categoryName: found.category.name,
  }
  return res
}

export async function getFullProductDAOByCode(clientId: string, code: string) {
  const found = await prisma.product.findFirst({
    where: {
      clientId,
      code
    },
    include: {
			category: true,
		}
  })
  if (!found) {
    return null
  }
  const res: ProductDAO = {
    ...found,
    categoryName: found.category.name,
  }
  return res
}

export async function getFullProductDAOByRanking(clientId: string, externalId: string) {
  const found = await prisma.product.findFirst({
    where: {
      clientId,
      externalId
    },
    include: {
			category: true,
		}
  })
  if (!found) {
    return null
  }
  const res: ProductDAO = {
    ...found,
    categoryName: found.category.name,
  }
  return res
}

export async function getFullProductDAOByCategoryName(clientId: string, categoryName: string, limit: number = 5): Promise<ProductDAO[] | null> {
  const found = await prisma.product.findMany({
    where: {
      clientId,
      category: {
        name: {
          equals: categoryName,
          mode: "insensitive"
        }
      }
    },
    include: {
			category: true,
		},
    take: limit
  })
  if (!found) {
    return null
  }
  const res: ProductDAO[] = found.map((product) => {
    return {
      ...product,
      categoryName: product.category.name,
    }
  })
  return res
}

export async function getAllProductsSoldToClient(clientId: string, comClientId: string) {
  const found = await prisma.product.findMany({
    where: {
      clientId,
      sells: {
        some: {
          comClientId
        }
      }
    },
    include: {
			category: true,
		}
  })
  const res: ProductDAO[] = found.map((product) => {
    return {
      ...product,
      categoryName: product.category.name,
    }
  })
  return res
}

export async function getComplmentaryProducts(clientId: string, productList: string[], categoryList: string[], limit: number = 10): Promise<ProductDAO[]> {
  const found = await prisma.product.findMany({
    where: {
      clientId,
      categoryId: {
        in: categoryList
      },
      id: {
        notIn: productList
      }
    },
    include: {
			category: true,
		},
    take: limit
  })
  const res: ProductDAO[] = found.map((product) => {
    return {
      ...product,
      categoryName: product.category.name,
    }
  })
  return res
}

export type ProductRecomendationResult = {
	numeroRanking: string
	codigo: string
	nombre: string
	stock: number
	pedidoEnOrigen: number
	precioUSD: number
  familia: string
}

export async function getProductsRecomendationsForClientImpl(clientId: string, comClientName: string, limit: number = 10): Promise<ProductRecomendationResult[]> {
  const similarityResult= await clientSimilaritySearch(clientId, comClientName)
  if (similarityResult.length === 0) {
      throw new Error(`client ${comClientName} not found`)
  } else {
      const firstClient = similarityResult[0]
      console.log("searching recomendations for client:", firstClient.name)
      const comClient= await getFullComClientDAOByCode(firstClient.code, clientId)
      if (!comClient) throw new Error(`client ${comClientName} not found`)
  
      const categoriesOfVendor= await getCategoriesOfComClient(clientId, comClient.id)
      const categoriesList= categoriesOfVendor.map(category => category.id)

      const productsSoldToClient= await getAllProductsSoldToClient(clientId, comClient.id)
      const productsList= productsSoldToClient.map(product => product.id)
      
      const complementaryProducts= await getComplmentaryProducts(clientId, productsList, categoriesList, limit)
      for (const product of complementaryProducts) {
        console.log(product.externalId, product.code, product.name, product.categoryName)        
      }
      const result: ProductRecomendationResult[] = []
      for (const product of complementaryProducts) {
        result.push({
          numeroRanking: product.externalId,
          codigo: product.code,
          nombre: product.name,
          stock: product.stock,
          pedidoEnOrigen: product.pedidoEnOrigen,
          precioUSD: product.precioUSD,
          familia: product.categoryName
        })
    }
      return result
  }
}

async function embedAndSave(text: string, productId: string) {
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY_FOR_EMBEDDINGS,
    verbose: true,
    modelName: "text-embedding-3-large",    
  })
  
  const vector= await embeddings.embedQuery(text)
  const embedding = pgvector.toSql(vector)
  await prisma.$executeRaw`UPDATE "Product" SET embedding = ${embedding}::vector WHERE id = ${productId}`
  console.log(`Text embeded: ${text}`)      
}

export type SimilarityProductResult = {
	numeroRanking: string
	codigo: string
	nombre: string
	stock: number
	pedidoEnOrigen: number
	precioUSD: number
  familia: string
  vectorDistance: number
}

export async function productSimilaritySearch(clientId: string, text: string, limit: number = 5): Promise<SimilarityProductResult[]> {
  console.log(`Searching for similar products for: ${text} and clientId: ${clientId}`)

  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY_FOR_EMBEDDINGS,
    verbose: true,
    modelName: "text-embedding-3-large",
  });

  const vector = await embeddings.embedQuery(text);
  const textEmbedding = pgvector.toSql(vector);


  const similarityResult: any[] = await prisma.$queryRaw`
    SELECT p."externalId", p."code", p."name", p."stock", p."pedidoEnOrigen", p."precioUSD", c."name" AS "categoryName", p."embedding" <-> ${textEmbedding}::vector AS distance
    FROM "Product" AS p
    INNER JOIN "Category" AS c ON p."categoryId" = c."id" 
    WHERE p."clientId" = ${clientId} AND p."embedding" <-> ${textEmbedding}::vector < 1.3
    ORDER BY distance
    LIMIT ${limit}`;

  const result: SimilarityProductResult[] = [];
  for (const row of similarityResult) {
    const product = await getFullProductDAOByExternalId(row.externalId, clientId)
    if (product) {
      result.push({
        numeroRanking: row.externalId,
        codigo: row.code,
        nombre: row.name,
        stock: row.stock,
        pedidoEnOrigen: row.pedidoEnOrigen,
        precioUSD: row.precioUSD,
        familia: row.categoryName,
        vectorDistance: row.distance
      })
    }
  }

  return result;
}

