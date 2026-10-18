import { Router, type Request, type Response, type NextFunction } from "express";
import argon2 from "argon2";
import "dotenv/config";
import { prisma } from "../lib/prisma";
import { authenticate, requireRoles, type AuthRequest } from "../middleware/auth.middleware";

const router = Router();
const publicFields = {id:true,email:true,firstName:true,lastName:true,role:true,language:true,createdAt:true,updatedAt:true} as const;
const validLanguage = (v:unknown):v is "fr-CA"|"en-CA" => v==="fr-CA" || v==="en-CA";
const roles = ["ADMIN","MANAGER","TEAM_LEADER"] as const;
type Role = typeof roles[number];
const validRole = (value:unknown):value is Role => roles.some(role=>role===value);
const validText = (v:unknown,max=100):v is string => typeof v==="string"&&v.trim().length>0&&v.trim().length<=max;
function error(res:Response,e:unknown) {
  const code = (e as {code?:string})?.code;
  if(code==="P2002") return res.status(409).json({message:"A user with this email already exists."});
  console.error(e); return res.status(500).json({message:"Unable to process user request."});
}
router.use(authenticate);
router.use(requireRoles("ADMIN", "MANAGER"));
router.use((req:Request,res:Response,next:NextFunction)=>{
  res.locals.actorRole=(req as AuthRequest).user!.role;
  next();
});
router.get("/",async(_req,res)=>{try{res.json({users:await prisma.user.findMany({where:res.locals.actorRole==="MANAGER"?{role:"TEAM_LEADER"}:{},select:publicFields,orderBy:[{lastName:"asc"},{firstName:"asc"}]})});}catch(e){error(res,e);}});
router.post("/",async(req,res)=>{
  const {firstName,lastName,email,password,role,language="fr-CA"}=req.body??{};
  if(!validText(firstName)||!validText(lastName)||!validText(email,254)||!/^\S+@\S+\.\S+$/.test(email)||!validText(password,256)||password.length<12||!validRole(role)||!validLanguage(language))
    return res.status(400).json({message:"Provide a name, valid email, role and password (at least 12 characters)."});
  if(res.locals.actorRole==="MANAGER"&&role!=="TEAM_LEADER")return res.status(403).json({message:"Managers may only create team leaders."});
  try{
    const user=await prisma.user.create({data:{firstName:firstName.trim(),lastName:lastName.trim(),email:email.trim().toLowerCase(),role,language,passwordHash:await argon2.hash(password)},select:publicFields});
    return res.status(201).json(user);
  }catch(e){return error(res,e);}
});
router.patch("/:userId",async(req:Request,res:Response)=>{
  const userId=Number(req.params.userId);
  if(!Number.isSafeInteger(userId)||userId<=0)return res.status(400).json({message:"Invalid user ID."});
  const body=req.body;
  if(!body||typeof body!=="object"||Array.isArray(body)||!Object.keys(body).length||Object.keys(body).some(k=>!["firstName","lastName","email","role","password","language"].includes(k)))
    return res.status(400).json({message:"Invalid update fields."});
  for(const key of ["firstName","lastName","email"]){if(key in body&&!validText(body[key],key==="email"?254:100))return res.status(400).json({message:"Invalid "+key});}
  if("email" in body&&!/^\S+@\S+\.\S+$/.test(body.email))return res.status(400).json({message:"Invalid email."});
  if("language" in body&&!validLanguage(body.language))return res.status(400).json({message:"Invalid language."});
  if("role" in body&&!validRole(body.role))return res.status(400).json({message:"Invalid role."});
  if("password" in body&&(!validText(body.password,256)||body.password.length<12))return res.status(400).json({message:"Password must be at least 12 characters."});
  if(res.locals.actorRole==="MANAGER"&&"role" in body&&body.role!=="TEAM_LEADER")return res.status(403).json({message:"Managers may only manage team leaders."});
  try{
    const result=await prisma.$transaction(async tx=>{
      const current=await tx.user.findUnique({where:{id:userId}});
      if(!current)return null;
      if(res.locals.actorRole==="MANAGER"&&current.role!=="TEAM_LEADER")return "forbidden";
      if(current.role==="ADMIN"&&body.role&&body.role!=="ADMIN"&&await tx.user.count({where:{role:"ADMIN"}})<=1)
        return "last-admin";
      return tx.user.update({where:{id:userId},data:{
        ...("firstName" in body?{firstName:body.firstName.trim()}:{}),
        ...("lastName" in body?{lastName:body.lastName.trim()}:{}),
        ...("email" in body?{email:body.email.trim().toLowerCase()}:{}),
        ...("role" in body?{role:body.role as Role}:{}),
        ...("language" in body?{language:body.language as "fr-CA"|"en-CA"}:{}),
        ...("password" in body?{passwordHash:await argon2.hash(body.password)}:{})
      },select:publicFields});
    });
    if(result==="forbidden")return res.status(403).json({message:"Managers may only modify team leaders."});
    if(result==="last-admin")return res.status(409).json({message:"Cannot demote the last administrator."});
    if(!result)return res.status(404).json({message:"User not found."});
    return res.json(result);
  }catch(e){return error(res,e);}
});
router.delete("/:userId",async(req:Request,res:Response)=>{
  if(res.locals.actorRole!=="ADMIN")return res.status(403).json({message:"Only administrators may delete users."});
  const userId=Number(req.params.userId),actorId=(req as AuthRequest).user!.id;
  if(!Number.isSafeInteger(userId)||userId<=0)return res.status(400).json({message:"Invalid user ID."});
  if(userId===actorId)return res.status(409).json({message:"You cannot delete your own account."});
  try{
    const result=await prisma.$transaction(async tx=>{
      const target=await tx.user.findUnique({where:{id:userId}});
      if(!target)return "missing";
      if(target.role==="ADMIN"&&await tx.user.count({where:{role:"ADMIN"}})<=1)return "last-admin";
      await tx.user.delete({where:{id:userId}});return "deleted";
    });
    if(result==="missing")return res.status(404).json({message:"User not found."});
    if(result==="last-admin")return res.status(409).json({message:"Cannot delete the last administrator."});
    return res.status(204).send();
  }catch(e){return error(res,e);}
});
export default router;

