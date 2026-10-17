import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getEmployeeEvaluationForm, submitEmployeeEvaluation, type EmployeeEvaluationForm, type EvaluationAnswerInput } from "../api/employee-evaluations";
import "./EmployeeEvaluationPage.css";

export default function EmployeeEvaluationPage(){
 const {employeeId}=useParams();
 const navigate=useNavigate();
 const id=Number(employeeId);
 const [form,setForm]=useState<EmployeeEvaluationForm|null>(null);
 const [answers,setAnswers]=useState<Record<number,{score:string;text:string}>>({});
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");
 useEffect(()=>{
   if(!Number.isSafeInteger(id)||id<=0){setError("Invalid employee ID.");setLoading(false);return;}
   let live=true;
   void getEmployeeEvaluationForm(id).then(data=>{if(live)setForm(data);}).catch(e=>{if(live)setError(e instanceof Error?e.message:"Unable to load evaluation.");}).finally(()=>{if(live)setLoading(false);});
   return ()=>{live=false;};
 },[id]);
 function change(questionId:number,key:"score"|"text",value:string){
   setAnswers(current=>({...current,[questionId]:{score:current[questionId]?.score??"",text:current[questionId]?.text??"",[key]:value}}));
 }
 async function submit(event:FormEvent<HTMLFormElement>){
   event.preventDefault();
   if(!form)return;
   setError("");
   let payload:EvaluationAnswerInput[];
   try{
     payload=form.template.questions.map(q=>{
       const input=answers[q.id]??{score:"",text:""};
       if(q.questionType==="TEXT"){
         if(!input.text.trim())throw new Error(`Please answer: ${q.questionText}`);
         return {questionId:q.id,scoreAnswer:null,textAnswer:input.text.trim()};
       }
       if(input.score==="")throw new Error(`Select a score for: ${q.questionText}`);
       const score=Number(input.score);
       if(!Number.isInteger(score)||q.minScore===null||q.maxScore===null||score<q.minScore||score>q.maxScore)throw new Error("Invalid score.");
       return {questionId:q.id,scoreAnswer:score,textAnswer:input.text.trim()||null};
     });
   }catch(e){setError(e instanceof Error?e.message:"Check your answers.");return;}
   setSaving(true);
   try{await submitEmployeeEvaluation(id,payload);navigate(`/employees/${id}`,{state:{evaluationSaved:true}});}
   catch(e){setError(e instanceof Error?e.message:"Could not submit evaluation.");}
   finally{setSaving(false);}
 }
 return <main className="employee-evaluation-page">
  <Link className="employee-eval-back" to={`/employees/${id}`}>← Employee profile</Link>
  {loading?<div className="employee-eval-card">Loading evaluation…</div>:!form?<div className="employee-eval-error">{error||"Evaluation unavailable."}</div>:<>
   <header className="employee-eval-header"><p>Employee performance / New evaluation</p><h1>{form.template.name}</h1>
   <span>{form.employee.firstName} {form.employee.lastName} · {form.employee.department} · Version {form.template.version}</span></header>
   <form className="employee-eval-form" onSubmit={submit}>
    {form.template.questions.map((q,index)=><section className="employee-eval-card" key={q.id}>
     <p className="employee-eval-index">Question {index+1} of {form.template.questions.length}</p><h2>{q.questionText}</h2>
     {q.questionType==="NUMERIC"&&q.minScore!==null&&q.maxScore!==null?<>
      <fieldset className="employee-eval-scores"><legend>Choose a score</legend>
       {Array.from({length:q.maxScore-q.minScore+1},(_,i)=>q.minScore!+i).map(score=><label key={score} className={answers[q.id]?.score===String(score)?"selected":""}>
        <input required type="radio" name={`score-${q.id}`} value={score} checked={answers[q.id]?.score===String(score)} onChange={()=>change(q.id,"score",String(score))}/>
        <strong>{score}</strong><span>{q.rubric?.[String(score)]||"No description"}</span>
       </label>)}
      </fieldset>
      <label className="employee-eval-comment">Additional comment (optional)<textarea rows={3} value={answers[q.id]?.text??""} onChange={e=>change(q.id,"text",e.target.value)}/></label>
     </>:<label className="employee-eval-comment">Written response<textarea required rows={5} value={answers[q.id]?.text??""} onChange={e=>change(q.id,"text",e.target.value)} placeholder="Write your evaluation…"/></label>}
    </section>)}
    {error&&<div className="employee-eval-error" role="alert">{error}</div>}
    <div className="employee-eval-footer"><Link to={`/employees/${id}`}>Cancel</Link><button disabled={saving||form.template.questions.length===0} type="submit">{saving?"Submitting…":"Complete evaluation"}</button></div>
   </form>
  </>}
 </main>;
}
