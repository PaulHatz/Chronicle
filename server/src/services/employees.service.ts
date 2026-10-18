import type { EmployeeInput } from "../validation/schemas";
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

export async function getEmployeeForId(id: number) {
    const employee = await prisma.employee.findUnique({
        where: { id },
        include: { department: true, evaluations: { orderBy: { completedAt: "desc" }, take: 1, select: { completedAt: true } }, _count: { select: { notes: true, writeUps: { where: { resolvedAt: null } } } } }
    });

    return employee ? withSchedule(employee) : null;

}

export async function createEmployee(emp: EmployeeInput) {

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

export async function updateEmployee(id: number, input: unknown) {
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error("Invalid employee ID.");
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid profile.");
    const data = input as Record<string, unknown>;
    const required = ["firstName", "lastName", "position"];
    if (required.some(key => typeof data[key] !== "string" || !(data[key] as string).trim() || (data[key] as string).length > 100)) throw new Error("Provide valid employee details.");
    if (data.email !== null && data.email !== "" && (typeof data.email !== "string" || !/^\S+@\S+\.\S+$/.test(data.email) || data.email.length > 254)) throw new Error("Invalid email.");
    if (data.phone !== null && data.phone !== "" && (typeof data.phone !== "string" || data.phone.length > 50)) throw new Error("Invalid phone.");
    if (!["ACTIVE","INACTIVE","LEAVE"].includes(data.status as string)) throw new Error("Invalid status.");
    const departmentId = Number(data.departmentId);
    if (!Number.isSafeInteger(departmentId) || departmentId <= 0) throw new Error("Invalid department.");
    if (typeof data.hireDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(data.hireDate)) throw new Error("Invalid hire date.");
    const hireDate = new Date(data.hireDate + "T00:00:00.000Z");
    if (Number.isNaN(hireDate.getTime()) || hireDate.toISOString().slice(0,10) !== data.hireDate) throw new Error("Invalid hire date.");
    const department = await prisma.department.findUnique({where:{id:departmentId}});
    if (!department) throw new Error("Department not found.");
    const current = await prisma.employee.findUnique({where:{id}});
    if (!current) return null;
    return prisma.employee.update({where:{id},data:{
        firstName:(data.firstName as string).trim(),
        lastName:(data.lastName as string).trim(),
        position:(data.position as string).trim(),
        email: typeof data.email==="string" && data.email.trim() ? data.email.trim() : null,
        phone: typeof data.phone==="string" && data.phone.trim() ? data.phone.trim() : null,
        status:data.status as "ACTIVE"|"INACTIVE"|"LEAVE",
        departmentId,hireDate,
        ...((current.departmentId !== departmentId || current.hireDate.getTime() !== hireDate.getTime()) && !current.nextEvaluationAt
            ? {nextEvaluationAt:addDays(hireDate,department.evaluationFrequencyDays)} : {})
    },include:{department:true}});
}

