import { prisma } from "../lib/prisma";

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


// Minimal lookup for employee forms and filters; configuration remains admin-only.
export async function listDepartmentOptions() {
  return prisma.department.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
}
