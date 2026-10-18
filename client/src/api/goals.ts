import { apiFetch } from "./client";
export type GoalStatus="COMPLETED"|"INCOMPLETE";
export type EmployeeGoal={id:number;employeeId:number;title:string;description:string;status:GoalStatus;duration:string};
export type GoalPayload={title:string;description:string;status:GoalStatus;duration:string};
async function call<T>(url:string,init?:RequestInit):Promise<T>{
 const response=await apiFetch(url,init);
 if(!response.ok){const body=await response.json().catch(()=>({}));throw new Error(body.message||"Goal request failed.");}
 return response.status===204?undefined as T:response.json();
}
const url=(employeeId:number)=>`/employees/${employeeId}/goals`;
export async function getEmployeeGoals(employeeId:number):Promise<EmployeeGoal[]>{return (await call<{goals:EmployeeGoal[]}>(url(employeeId))).goals;}
export async function createEmployeeGoal(employeeId:number,data:GoalPayload){return call<EmployeeGoal>(url(employeeId),{method:"POST",body:JSON.stringify(data)});}
export async function updateEmployeeGoal(employeeId:number,goalId:number,data:Partial<GoalPayload>){return call<EmployeeGoal>(`${url(employeeId)}/${goalId}`,{method:"PATCH",body:JSON.stringify(data)});}
export async function deleteEmployeeGoal(employeeId:number,goalId:number){return call<void>(`${url(employeeId)}/${goalId}`,{method:"DELETE"});}
