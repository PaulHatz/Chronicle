import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

export type DepartmentInput = {
  name: string;
  evaluationTemplateId: number;
  evaluationFrequencyDays: number;
};

export class DepartmentError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function listDepartments() {
  return prisma.department.findMany({
    include: { evaluationTemplate: { select: { id: true, name: true, version: true } } },
    orderBy: { name: "asc" },
  });
}

export async function createDepartment(data: DepartmentInput) {
  return prisma.department.create({
    data,
    include: { evaluationTemplate: { select: { id: true, name: true, version: true } } },
  });
}

export async function updateDepartment(id: number, data: Partial<DepartmentInput>) {
  return prisma.department.update({
    where: { id }, data,
    include: { evaluationTemplate: { select: { id: true, name: true, version: true } } },
  });
}

export async function deleteDepartment(id: number) {
  await prisma.department.delete({ where: { id } });
}
