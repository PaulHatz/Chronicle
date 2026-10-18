import { Router, type Request, type Response } from "express";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { authenticate, type AuthRequest } from "../middleware/auth.middleware";
import "dotenv/config";
const prisma=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL!})});
const router=Router();
router.use(authenticate);
router.patch("/language",async(req:Request,res:Response)=>{
 const language=req.body?.language;
 if(language!=="fr-CA"&&language!=="en-CA")return res.status(400).json({message:"Choose fr-CA or en-CA."});
 const id=(req as AuthRequest).user?.id;
 if(!id)return res.status(401).json({message:"Not authenticated."});
 try{
  const result=await prisma.user.updateMany({where:{id},data:{language}});
  if(!result.count)return res.status(404).json({message:"User not found."});
  return res.json({language});
 }catch(e){console.error(e);return res.status(500).json({message:"Unable to save language."});}
});
export default router;
