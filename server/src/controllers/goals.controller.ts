import {Request,Response} from "express";
import * as service from "../services/goals.service";
function id(value:string|string[]|undefined){const n=Number(value);if(!Number.isSafeInteger(n)||n<=0)throw new service.GoalError(400,"Invalid ID.");return n;}
function parse(value:unknown,partial=false):Partial<service.GoalInput>{
 if(!value||typeof value!=="object"||Array.isArray(value))throw new service.GoalError(400,"Expected a JSON object.");
 const b=value as Record<string,unknown>;
 if(Object.keys(b).some(k=>!["title","description","status","duration"].includes(k)))throw new service.GoalError(400,"Unexpected goal field.");
 if(!partial && (!("title" in b)||!("description" in b)||!("duration" in b)))throw new service.GoalError(400,"Title, description and target date are required.");
 if(partial&&!Object.keys(b).length)throw new service.GoalError(400,"Provide at least one field.");
 const data:Partial<service.GoalInput>={};
 for(const key of ["title","description"] as const)if(key in b){
  if(typeof b[key]!=="string"||!b[key].trim()||b[key].trim().length>(key==="title"?200:10000))throw new service.GoalError(400,"Invalid "+key+".");
  data[key]=b[key].trim();
 }
 if("status" in b){if(b.status!=="COMPLETED"&&b.status!=="INCOMPLETE")throw new service.GoalError(400,"Invalid goal status.");data.status=b.status;}
 if("duration" in b){
  if(typeof b.duration!=="string"||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(b.duration))throw new service.GoalError(400,"Target date must be YYYY-MM-DD.");
  const d=new Date(b.duration+"T00:00:00.000Z");
  if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==b.duration)throw new service.GoalError(400,"Invalid target date.");
  data.duration=d;
 }
 return data;
}
function fail(e:unknown,res:Response){if(e instanceof service.GoalError)return res.status(e.statusCode).json({message:e.message});console.error(e);return res.status(500).json({message:"Unable to process goals."});}
export async function list(req:Request,res:Response){try{return res.json({goals:await service.listGoals(id(req.params.employeeId))});}catch(e){return fail(e,res);}}
export async function create(req:Request,res:Response){try{return res.status(201).json(await service.createGoal(id(req.params.employeeId),{status:"INCOMPLETE",...parse(req.body)} as service.GoalInput));}catch(e){return fail(e,res);}}
export async function update(req:Request,res:Response){try{return res.json(await service.updateGoal(id(req.params.employeeId),id(req.params.goalId),parse(req.body,true)));}catch(e){return fail(e,res);}}
export async function remove(req:Request,res:Response){try{await service.deleteGoal(id(req.params.employeeId),id(req.params.goalId));return res.status(204).send();}catch(e){return fail(e,res);}}
