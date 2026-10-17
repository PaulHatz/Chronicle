import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { getEvaluationTemplates } from "../api/evaluations";
import { getDepartments, addDepartment, modifyDepartment, deleteDepartment, type Department, type DepartmentInput } from "../api/departments";
import "./DepartmentsPage.css";

type Template = { id: number; name: string; version: string };
const blank: DepartmentInput = { name: "", evaluationTemplateId: 0, evaluationFrequencyDays: 90 };

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [draft, setDraft] = useState<DepartmentInput>({ ...blank });

  useEffect(() => {
    let active = true;
    void Promise.all([getDepartments(), getEvaluationTemplates()])
      .then(([ds, ts]) => { if (active) { setDepartments(ds); setTemplates(ts); } })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : "Unable to load departments."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function create() {
    setEditing("new");
    setDraft({ ...blank, evaluationTemplateId: templates[0]?.id ?? 0 });
    setError(""); setNotice("");
  }
  function edit(d: Department) {
    setEditing(d.id);
    setDraft({ name: d.name, evaluationTemplateId: d.evaluationTemplateId, evaluationFrequencyDays: d.evaluationFrequencyDays });
    setError(""); setNotice("");
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.name.trim() || !Number.isSafeInteger(draft.evaluationTemplateId) || draft.evaluationTemplateId <= 0 ||
      !Number.isSafeInteger(draft.evaluationFrequencyDays) || draft.evaluationFrequencyDays <= 0) {
      setError("Provide a department name, evaluation template, and positive whole number of days."); return;
    }
    setBusy(true); setError(""); setNotice("");
    try {
      const input = { ...draft, name: draft.name.trim() };
      const saved = editing === "new" ? await addDepartment(input) : await modifyDepartment(editing as number, input);
      setDepartments(current => [...current.filter(d => d.id !== saved.id), saved].sort((a,b) => a.name.localeCompare(b.name)));
      setNotice(editing === "new" ? "Department created." : "Department updated.");
      setEditing(null);
    } catch(e) { setError(e instanceof Error ? e.message : "Could not save department."); }
    finally { setBusy(false); }
  }
  async function remove(d: Department) {
    if (!window.confirm(`Delete department "${d.name}"? This cannot be undone.`)) return;
    setBusy(true); setError(""); setNotice("");
    try { await deleteDepartment(d.id); setDepartments(current => current.filter(x=>x.id!==d.id)); setNotice("Department deleted."); if(editing===d.id)setEditing(null); }
    catch(e){setError(e instanceof Error ? e.message : "Could not delete department.");}
    finally{setBusy(false);}
  }

  return <main className="departments-page">
    <header className="departments-header">
      <div><p className="departments-eyebrow">Settings / Organization</p><h1>Departments</h1><p>Manage your departments and their evaluation schedules.</p></div>
      <button className="department-primary" type="button" disabled={loading||busy||templates.length===0} onClick={create}>＋ Add department</button>
    </header>
    {error && <p className="department-alert department-error" role="alert">{error}</p>}
    {notice && <p className="department-alert department-success" role="status">{notice}</p>}
    {loading ? <section className="department-card">Loading departments…</section> : <>
      {templates.length === 0 && <section className="department-card">Create an <Link to="/evaluation-templates/new">evaluation template</Link> before adding a department.</section>}
      {editing !== null && <form className="department-card department-form" onSubmit={save}>
        <h2>{editing === "new" ? "Add department" : "Edit department"}</h2>
        <div className="department-fields">
          <label>Name<input required value={draft.name} placeholder="Kitchen" onChange={e=>setDraft(d=>({...d,name:e.target.value}))}/></label>
          <label>Evaluation template<select required value={draft.evaluationTemplateId||""} onChange={e=>setDraft(d=>({...d,evaluationTemplateId:Number(e.target.value)}))}>
            <option value="" disabled>Select a template</option>
            {templates.map(t=><option key={t.id} value={t.id}>{t.name} (v{t.version})</option>)}
          </select></label>
          <label>Evaluation frequency (days)<input required type="number" min="1" step="1" value={draft.evaluationFrequencyDays} onChange={e=>setDraft(d=>({...d,evaluationFrequencyDays:Number(e.target.value)}))}/></label>
        </div>
        <div className="department-actions"><button type="button" disabled={busy} onClick={()=>setEditing(null)}>Cancel</button><button className="department-primary" disabled={busy} type="submit">{busy?"Saving…":"Save department"}</button></div>
      </form>}
      <section className="department-card department-directory">
        <div className="department-list-heading"><h2>All departments</h2><span>{departments.length} total</span></div>
        {departments.length===0 ? <p className="department-empty">No departments created yet.</p> :
          departments.map(d=><div className="department-row" key={d.id}>
            <span className="department-icon">▦</span>
            <div className="department-identity"><strong>{d.name}</strong><span>Every {d.evaluationFrequencyDays} days</span></div>
            <div className="department-template"><small>Evaluation template</small><Link to={`/evaluation-templates/${d.evaluationTemplateId}`}>{d.evaluationTemplate.name} · v{d.evaluationTemplate.version}</Link></div>
            <div className="department-actions"><button type="button" disabled={busy} onClick={()=>edit(d)}>Edit</button><button type="button" disabled={busy} className="department-delete" onClick={()=>void remove(d)}>Delete</button></div>
          </div>)}
      </section>
    </>}
  </main>;
}
