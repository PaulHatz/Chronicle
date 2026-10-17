import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const prisma = new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL!})});
export class ActivityError extends Error {constructor(public status:number,message:string){super(message);}}
async function requireEmployee(employeeId:number){
 const employee=await prisma.employee.findUnique({where:{id:employeeId},select:{id:true}});
 if(!employee)throw new ActivityError(404,"Employee not found.");
}
export async function listNotes(employeeId:number){
 await requireEmployee(employeeId);
 return prisma.managerNote.findMany({where:{employeeId},orderBy:{createdAt:"desc"}});
}
export async function listWriteUps(employeeId:number){
 await requireEmployee(employeeId);
 return prisma.writeUp.findMany({where:{employeeId},orderBy:{createdAt:"desc"}});
}
export async function createNote(employeeId:number,title:string,content:string,type:"POSITIVE"|"IMPROVEMENT"|"GENERAL" = "GENERAL"){
 await requireEmployee(employeeId);
 return prisma.managerNote.create({data:{employeeId,title,content,type}});
}
export async function createWriteUp(employeeId:number,type:"VERBAL_WARNING"|"WRITTEN_WARNING"|"FINAL_WARNING",reason:string){
 await requireEmployee(employeeId);
 return prisma.writeUp.create({data:{employeeId,type,reason}});
}
export async function resolveWriteUp(employeeId:number,id:number){
 const result=await prisma.writeUp.updateMany({where:{id,employeeId,resolvedAt:null},data:{resolvedAt:new Date()}});
 if(result.count===0)throw new ActivityError(404,"Open write-up not found.");
 return prisma.writeUp.findUniqueOrThrow({where:{id}});
}
