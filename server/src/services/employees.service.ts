import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });
  
  const prisma = new PrismaClient({ adapter });

export async function getEmployeeList() {

    const employees = await prisma.employee.findMany();

    if(!employees) {
        return null;
    }

    return employees;
}