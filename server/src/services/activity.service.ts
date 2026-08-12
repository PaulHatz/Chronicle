import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";


const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });
  
  const prisma = new PrismaClient({ adapter });


export async function getManagerNotesForEmployeeId(id) {
    const notes =  await prisma.ManagerNote.findMany({
        where: { employeeId: Number(id) }
    });

    return notes;
}

export async function getWriteUpsForEmployeeId(id) {
    const notes =  await prisma.WriteUp.findMany({
        where: { employeeId: Number(id) }
    });

    return notes;
}
