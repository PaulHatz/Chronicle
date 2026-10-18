import { apiFetch } from "./client";
export type UserRole = "ADMIN" | "MANAGER" | "TEAM_LEADER";
export type ManagedUser = {id:number;firstName:string;lastName:string;email:string;role:UserRole;createdAt:string;updatedAt:string};
export type UserInput = {firstName:string;lastName:string;email:string;role:UserRole;password?:string};
async function request<T>(url:string, options?:RequestInit):Promise<T>{
 const res=await apiFetch(url,options);
 if(!res.ok){const body=await res.json().catch(()=>null);throw new Error(body&&typeof body.message==="string"?body.message:"Unable to complete user request.");}
 return res.status===204 ? undefined as T : res.json() as Promise<T>;
}
export async function listUsers(){return (await request<{users:ManagedUser[]}>("/users")).users;}
export async function addUser(input:UserInput & {password:string}){return request<ManagedUser>("/users",{method:"POST",body:JSON.stringify(input)});}
export async function editUser(id:number,input:Partial<UserInput>){return request<ManagedUser>(`/users/${id}`,{method:"PATCH",body:JSON.stringify(input)});}
export async function removeUser(id:number){return request<void>(`/users/${id}`,{method:"DELETE"});}
