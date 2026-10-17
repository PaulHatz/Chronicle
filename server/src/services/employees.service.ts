import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });
  
  const prisma = new PrismaClient({ adapter });

export async function getEmployeeList() {

    const employees = await prisma.employee.findMany({ include: { department: true } });

    if(!employees) {
        return null;
    }

    return employees;
}

export async function getEmployeeForId(id) {
    const employee = await prisma.employee.findUnique({
        where: { id },
        include: { department: true }
    });

    return employee;

}

export async function createEmployee(emp) {

    if (!Number.isSafeInteger(Number(emp.departmentId)) || Number(emp.departmentId) <= 0) {
        throw new Error("A valid departmentId is required.");
    }
    const new_employee = await prisma.employee.create({
            data: {
                firstName: emp.firstName,
                lastName: emp.lastName,
                email: emp.email,
                position: emp.position,
                department: { connect: { id: Number(emp.departmentId) } },
                status: emp.status,
                phone: emp.phone,
                hireDate: new Date(`${emp.hireDate}T00:00:00.000Z`)
            },
            include: { department: true }
    });
    return new_employee;

}
