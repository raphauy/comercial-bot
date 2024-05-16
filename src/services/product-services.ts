import * as z from "zod"
import { prisma } from "@/lib/db"
import { CategoryDAO, CategoryFormValues, createCategory, getCategoryDAO, getCategoryDAOByName } from "./category-services"
import { getClient, getClientBySlug } from "./clientService"
import { OpenAIEmbeddings } from "langchain/embeddings/openai"
import pgvector from 'pgvector/utils';
import { TrimantProductResult } from "./functions"

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

  const toEmbed= {
    nombre: data.name,
    familia: category.name
  }
  const textToEmbed= JSON.stringify(toEmbed)
  console.log(`Text: ${textToEmbed}`)  
  await embedAndSave(textToEmbed, created.id)
  
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
      externalId: 'asc'
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
    throw new Error("product not found")
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
  distance: number
}

export async function similaritySearch(clientId: string, text: string, limit: number = 5): Promise<SimilarityProductResult[]> {
  console.log(`Searching for similar sections for: ${text} and clientId: ${clientId}`)

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
    WHERE p."clientId" = ${clientId} AND p."embedding" <-> ${textEmbedding}::vector < 1.05
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
        distance: row.distance
      })
    }
  }

  return result;
}

