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

export async function getEmployeeForId(id) {
    const employee = await prisma.employee.findUnique({
        where: { id }
    });

    return employee;

}

export async function createEmployee(emp) {

    console.log(emp);
    const new_employee = await prisma.employee.create({
            data: {
                firstName: emp.firstName,
                lastName: emp.lastName,
                email: emp.email,
                position: emp.position,
                department: emp.department,
                status: emp.status,
                phone: emp.phone,
                hireDate: new Date(`${emp.startDate}T00:00:00.000Z`)
            },
    });
    return new_employee;

}
