import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });
  
  const prisma = new PrismaClient({ adapter });

function addDays(date: Date, days: number) {
    const due = new Date(date);
    due.setUTCDate(due.getUTCDate() + days);
    return due;
}

function withSchedule<T extends {
    hireDate: Date;
    nextEvaluationAt: Date | null;
    department: { evaluationFrequencyDays: number };
    evaluations: { completedAt: Date }[];
    _count: { notes: number; writeUps: number };
}>(employee: T) {
    const lastEvaluationAt = employee.evaluations[0]?.completedAt ?? null;
    const nextEvaluationAt = employee.nextEvaluationAt ??
        addDays(lastEvaluationAt ?? employee.hireDate, employee.department.evaluationFrequencyDays);
    const { evaluations, _count, ...record } = employee;
    return { ...record, nextEvaluationAt, lastEvaluationAt, notesCount: _count.notes, openWriteUpsCount: _count.writeUps };
}

export async function getEmployeeList() {

    const employees = await prisma.employee.findMany({ include: { department: true, evaluations: { orderBy: { completedAt: "desc" }, take: 1, select: { completedAt: true } }, _count: { select: { notes: true, writeUps: { where: { resolvedAt: null } } } } } });

    if(!employees) {
        return null;
    }

    return employees.map(withSchedule);
}

export async function getEmployeeForId(id) {
    const employee = await prisma.employee.findUnique({
        where: { id },
        include: { department: true, evaluations: { orderBy: { completedAt: "desc" }, take: 1, select: { completedAt: true } }, _count: { select: { notes: true, writeUps: { where: { resolvedAt: null } } } } }
    });

    return employee ? withSchedule(employee) : null;

}

export async function createEmployee(emp) {

    if (!Number.isSafeInteger(Number(emp.departmentId)) || Number(emp.departmentId) <= 0) {
        throw new Error("A valid departmentId is required.");
    }
    const department = await prisma.department.findUnique({ where: { id: Number(emp.departmentId) } });
    if (!department) throw new Error("Department not found.");
    const hireDate = new Date(`${emp.hireDate}T00:00:00.000Z`);
    const new_employee = await prisma.employee.create({
            data: {
                firstName: emp.firstName,
                lastName: emp.lastName,
                email: emp.email,
                position: emp.position,
                department: { connect: { id: Number(emp.departmentId) } },
                status: emp.status,
                phone: emp.phone,
                hireDate,
                nextEvaluationAt: addDays(hireDate, department.evaluationFrequencyDays)
            },
            include: { department: true }
    });
    return new_employee;

}
