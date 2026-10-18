import { apiFetch } from "./client";
export type Department = { id:number; name:string; evaluationTemplateId:number; evaluationFrequencyDays:number; evaluationTemplate:{id:number;name:string;version:string} };
export type DepartmentInput = Pick<Department,"name"|"evaluationTemplateId"|"evaluationFrequencyDays">;
async function call<T>(endpoint:string,options?:RequestInit):Promise<T>{
 const response=await apiFetch(endpoint,options);
 if(!response.ok){const e=await response.json().catch(()=>({}));throw new Error(e.message||"Request failed");}
 return response.status===204 ? undefined as T : response.json();
}
export const getDepartments=()=>call<Department[]>("/departments");
export const addDepartment=(data:DepartmentInput)=>call<Department>("/departments",{method:"POST",body:JSON.stringify(data)});
export const modifyDepartment=(id:number,data:DepartmentInput)=>call<Department>(`/departments/${id}`,{method:"PATCH",body:JSON.stringify(data)});
export const deleteDepartment=(id:number)=>call<void>(`/departments/${id}`,{method:"DELETE"});


export type DepartmentOption = Pick<Department,"id"|"name">;
export const getDepartmentOptions=()=>call<DepartmentOption[]>("/departments/options");
