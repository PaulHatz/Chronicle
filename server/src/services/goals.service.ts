import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const prisma = new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL!})});
export class GoalError extends Error { constructor(public statusCode:number,message:string){super(message);} }
export type GoalInput={title:string;description:string;status:"COMPLETED"|"INCOMPLETE";duration:Date};
async function employeeExists(employeeId:number){
 if(!await prisma.employee.findUnique({where:{id:employeeId},select:{id:true}}))throw new GoalError(404,"Employee not found.");
}
export async function listGoals(employeeId:number){
 await employeeExists(employeeId);
 return prisma.goal.findMany({where:{employeeId},orderBy:[{status:"desc"},{duration:"asc"},{id:"desc"}]});
}
export async function createGoal(employeeId:number,input:GoalInput){
 await employeeExists(employeeId);
 return prisma.goal.create({data:{employeeId,...input}});
}
export async function updateGoal(employeeId:number,goalId:number,input:Partial<GoalInput>){
 const result=await prisma.goal.updateMany({where:{id:goalId,employeeId},data:input});
 if(!result.count)throw new GoalError(404,"Goal not found for this employee.");
 return prisma.goal.findUniqueOrThrow({where:{id:goalId}});
}
export async function deleteGoal(employeeId:number,goalId:number){
 const result=await prisma.goal.deleteMany({where:{id:goalId,employeeId}});
 if(!result.count)throw new GoalError(404,"Goal not found for this employee.");
}
