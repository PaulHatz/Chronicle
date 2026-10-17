import { apiFetch } from "./client";

export async function getemployeelist() {

    const response = await apiFetch(
        "/employees/getemployeelist", 
        {
            method: "GET"
        }
    );

    return response.json();

}

export async function getemployee(id) {
    const response = await apiFetch(
        "/employees/" + String(id), 
        {
            method: "GET"
        }
    );

    return response.json();
}

export async function addemployee(newEmployee) {
    return apiFetch("/employees/add", {
        method: "POST",
        body: JSON.stringify(newEmployee),
    });
}

export async function getemployeenotes(id) {
    const response = await apiFetch(
        "/activity/notes/" + String(id), 
        {
            method: "GET"
        }
    );

    return response.json();
}

export async function getemployeewriteups(id) {
    const response = await apiFetch(
        "/activity/writeup/" + String(id), 
        {
            method: "GET"
        }
    );

    return response.json();
}
export type ManagerNoteType = "POSITIVE" | "IMPROVEMENT" | "GENERAL";
export async function createManagerNote(employeeId:number,input:{title:string;content:string;type:ManagerNoteType}){
 const response=await apiFetch("/activity/notes/"+employeeId,{method:"POST",body:JSON.stringify(input)});
 const body=await response.json();if(!response.ok)throw new Error(body.message||"Unable to save note");return body;
}
export type WriteUpType="VERBAL_WARNING"|"WRITTEN_WARNING"|"FINAL_WARNING";
export async function createEmployeeWriteUp(employeeId:number,input:{type:WriteUpType;reason:string}){
 const response=await apiFetch("/activity/writeup/"+employeeId,{method:"POST",body:JSON.stringify(input)});
 const body=await response.json();if(!response.ok)throw new Error(body.message||"Unable to save write-up");return body;
}
export async function resolveEmployeeWriteUp(employeeId:number,writeUpId:number){
 const response=await apiFetch("/activity/writeup/"+employeeId+"/"+writeUpId+"/resolve",{method:"PATCH"});
 const body=await response.json();if(!response.ok)throw new Error(body.message||"Unable to resolve write-up");return body;
}
