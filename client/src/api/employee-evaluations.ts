import { apiFetch } from "./client";
export type EvaluationQuestion = {id:number;questionText:string;questionType:"NUMERIC"|"TEXT";minScore:number|null;maxScore:number|null;rubric:Record<string,string>|null};
export type EmployeeEvaluationForm = { employee:{id:number;firstName:string;lastName:string;department:string};template:{id:number;name:string;version:string;questions:EvaluationQuestion[]} };
export type EvaluationAnswerInput = {questionId:number;scoreAnswer:number|null;textAnswer:string|null};
export type CompletedEvaluation = {id:number;completedAt:string;template:{name:string;version:string};answers:Array<{id:number;scoreAnswer:number|null;textAnswer:string|null;question:{questionText:string;questionType:string;rubric:Record<string,string>|null;minScore:number|null;maxScore:number|null}}>};
async function request<T>(endpoint:string,options?:RequestInit):Promise<T>{
 const response=await apiFetch(endpoint,options);
 if(!response.ok){const data:unknown=await response.json().catch(()=>null);throw new Error(data&&typeof data==="object"&&"message" in data?String(data.message):"Request failed");}
 return response.json() as Promise<T>;
}
export const getEmployeeEvaluationForm=(employeeId:number)=>request<EmployeeEvaluationForm>(`/employees/${employeeId}/evaluation-form`);
export const submitEmployeeEvaluation=(employeeId:number,answers:EvaluationAnswerInput[])=>request<{id:number}>(`/employees/${employeeId}/evaluations`,{method:"POST",body:JSON.stringify({answers})});
export const getEmployeeEvaluations=(employeeId:number)=>request<CompletedEvaluation[]>(`/employees/${employeeId}/evaluations`);

export type EvaluationResult = CompletedEvaluation & { employee:{firstName:string;lastName:string;department:{name:string}} };
export const getEvaluationResult=(employeeId:number,evaluationId:number)=>request<EvaluationResult>(`/employees/${employeeId}/evaluations/${evaluationId}`);

export const getQuarterEvaluationStatistics = () => request<{ completedThisQuarter: number }>("/employees/evaluation-statistics/quarter");
