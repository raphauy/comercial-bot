import * as z from "zod"
import { prisma } from "@/lib/db"
import { getClientByComClientId } from "./clientService"
import { OpenAIEmbeddings } from "langchain/embeddings/openai"
import pgvector from 'pgvector/utils';

export type VendorDAO = {
	id: string
	name: string
  createdAt: Date
  updatedAt: Date
}

export const vendorSchema = z.object({
	name: z.string().min(1, "name is required."),
})

export type VendorFormValues = z.infer<typeof vendorSchema>


export async function getVendorsDAO() {
  const found = await prisma.vendor.findMany({
    orderBy: {
      id: 'asc'
    },
  })
  return found as VendorDAO[]
}

export async function getVendorDAO(id: string) {
  const found = await prisma.vendor.findUnique({
    where: {
      id
    },
  })
  return found as VendorDAO
}
    
export async function createOrUpdateVendor(data: VendorFormValues) {
  let vendor= await prisma.vendor.findFirst({
    where: {
      name: data.name,
    },
  })

  if (!vendor) {
    console.log("Creating vendor")
    
    vendor = await prisma.vendor.create({
      data: {
        name: data.name,
      },
    })
    await embedAndSave(data.name, vendor.id)
  } else {
    if (vendor.name !== data.name) {
      console.log("Updating vendor")
      vendor = await prisma.vendor.update({
        where: {
          id: vendor.id
        },
        data: {
          name: data.name,
        },
      })
      await embedAndSave(data.name, vendor.id)
    }
  }


  return vendor as VendorDAO
}


export async function deleteVendor(id: string) {
  const deleted = await prisma.vendor.delete({
    where: {
      id
    },
  })
  return deleted
}


export async function getFullVendorsDAO(slug: string) {
  const found = await prisma.vendor.findMany({
    where: {
      client: {
        slug
      }
  },
    orderBy: {
      id: 'asc'
    },
  })
  return found as VendorDAO[]
}
  
export async function getFullVendorDAO(id: string) {
  const found = await prisma.vendor.findUnique({
    where: {
      id
    },
  })
  return found as VendorDAO
}

export async function getFullVendorDAOByNameAndComclientId(name: string, comClientId: string) {
  const found = await prisma.vendor.findFirst({
    where: {
      name,
      comClients: {
        some: {
          comClientId
        }
      }
    },
  })
  return found as VendorDAO
}

export async function getFullVendorDAOByName(clientId: string, name: string) {
  const found = await prisma.vendor.findFirst({
    where: {
      name,
      client: {
        id: clientId
      }
  } 
  })
  return found as VendorDAO
}

async function embedAndSave(text: string, vendorId: string) {
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY_FOR_EMBEDDINGS,
    verbose: true,
    modelName: "text-embedding-3-large",    
  })
  
  const vector= await embeddings.embedQuery(text)
  const embedding = pgvector.toSql(vector)
  await prisma.$executeRaw`UPDATE "Vendor" SET embedding = ${embedding}::vector WHERE id = ${vendorId}`
  console.log(`Text embeded: ${text}`)
}

export type SimilarityVendorResult = {
	nombre: string
	vectorDistance: number
}

export async function vendorSimilaritySearch(clientId: string, text: string, limit: number = 5): Promise<SimilarityVendorResult[]> {
  console.log(`Searching for similar vendors for: ${text} and clientId: ${clientId}`)

  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY_FOR_EMBEDDINGS,
    verbose: true,
    modelName: "text-embedding-3-large",
  });

  const vector = await embeddings.embedQuery(text);
  const textEmbedding = pgvector.toSql(vector);


  const similarityResult: any[] = await prisma.$queryRaw`
    SELECT v."name", v."embedding" <-> ${textEmbedding}::vector AS distance
    FROM "Vendor" AS v
    WHERE v."clientId" = ${clientId} AND v."embedding" <-> ${textEmbedding}::vector < 1.3
    ORDER BY distance
    LIMIT ${limit}`;

  const result: SimilarityVendorResult[] = [];
  for (const row of similarityResult) {
    result.push({
      nombre: row.name,
      vectorDistance: row.distance
    })
  }

  return result;
}