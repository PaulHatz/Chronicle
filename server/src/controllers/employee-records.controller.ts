import {Request,Response} from "express";
import * as svc from "../services/employee-records.service";
function id(value:string|string[]|undefined){const n=Number(value);if(!Number.isSafeInteger(n)||n<=0)throw new svc.ActivityError(400,"Invalid ID.");return n;}
function body(value:unknown){if(!value||typeof value!=="object"||Array.isArray(value))throw new svc.ActivityError(400,"Invalid request.");return value as Record<string,unknown>;}
function textField(v:unknown,field:string,max:number){if(typeof v!=="string"||!v.trim()||v.trim().length>max)throw new svc.ActivityError(400,field+" is required (max "+max+" characters).");return v.trim();}
function fail(e:unknown,res:Response){if(e instanceof svc.ActivityError)return res.status(e.status).json({message:e.message});console.error(e);return res.status(500).json({message:"Internal server error."});}
export async function notes(req:Request,res:Response){try{return res.json({notes:await svc.listNotes(id(req.params.employeeId))});}catch(e){return fail(e,res);}}
export async function writeUps(req:Request,res:Response){try{return res.json({notes:await svc.listWriteUps(id(req.params.employeeId))});}catch(e){return fail(e,res);}}
export async function addNote(req:Request,res:Response){try{const b=body(req.body);return res.status(201).json(await svc.createNote(id(req.params.employeeId),textField(b.title,"Title",200),textField(b.content,"Content",10000)));}catch(e){return fail(e,res);}}
export async function addWriteUp(req:Request,res:Response){try{const b=body(req.body);const type=b.type;if(type!=="VERBAL_WARNING"&&type!=="WRITTEN_WARNING"&&type!=="FINAL_WARNING")throw new svc.ActivityError(400,"Invalid warning type.");return res.status(201).json(await svc.createWriteUp(id(req.params.employeeId),type,textField(b.reason,"Reason",10000)));}catch(e){return fail(e,res);}}
export async function resolveWriteUp(req:Request,res:Response){try{return res.json(await svc.resolveWriteUp(id(req.params.employeeId),id(req.params.writeUpId)));}catch(e){return fail(e,res);}}
