import type {Request,Response,NextFunction} from "express";
import {PrismaClient} from "../generated/prisma/client";
import {PrismaPg} from "@prisma/adapter-pg";
import type {AuthRequest} from "./auth.middleware";
import "dotenv/config";
const prisma=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL!})});
export async function requireAdmin(req:Request,res:Response,next:NextFunction){
 const id=(req as AuthRequest).user?.id;
 if(!id)return res.status(401).json({message:"Not authenticated."});
 try{
  const actor=await prisma.user.findUnique({where:{id},select:{role:true}});
  if(!actor)return res.status(401).json({message:"Account not found."});
  if(actor.role!=="ADMIN")return res.status(403).json({message:"Administrator access required."});
  next();
 }catch(e){console.error(e);return res.status(500).json({message:"Unable to verify permissions."});}
}
