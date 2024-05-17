import * as z from "zod"
import { prisma } from "@/lib/db"
import { OpenAIEmbeddings } from "langchain/embeddings/openai"
import pgvector from 'pgvector/utils';

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
  const updated = await prisma.comClient.update({
    where: {
      id
    },
    data
  })

  const toEmbed= {
    nombre: data.name,
    codigo: data.code,
  }
  const textToEmbed= JSON.stringify(toEmbed)
  console.log(`Text: ${textToEmbed}`)  
  await embedAndSave(textToEmbed, updated.id)

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
    WHERE c."clientId" = ${clientId} AND c."embedding" <-> ${textEmbedding}::vector < 1.05
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

