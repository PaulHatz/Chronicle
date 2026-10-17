import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { getEvaluationTemplate, updateEvaluationQuestion, deleteEvaluationQuestion, type EvaluationTemplateDetail, type EvaluationQuestion, type NewQuestion } from "../api/evaluations";
import "./EvaluationTemplatesPage.css";

export default function EvaluationTemplateDetailPage() {
  const { templateId } = useParams();
  const id = Number(templateId);
  const [template, setTemplate] = useState<EvaluationTemplateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState<NewQuestion | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!Number.isSafeInteger(id) || id <= 0) {
      setError("Invalid template ID."); setLoading(false); return;
    }
    let active = true;
    void getEvaluationTemplate(id)
      .then(data => { if (active) setTemplate(data); })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : "Unable to load template."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  function beginEdit(q: EvaluationQuestion) {
    setError(""); setNotice(""); setEditing(q.id);
    setDraft({
      questionText: q.questionText, questionType: q.questionType,
      minScore: q.minScore, maxScore: q.maxScore,
      rubric: q.rubric ? { ...q.rubric } : null,
    });
  }

  function changeType(type: "NUMERIC" | "TEXT") {
    setDraft(current => current && (type === "TEXT"
      ? { ...current, questionType: type, minScore: null, maxScore: null, rubric: null }
      : { ...current, questionType: type, minScore: 1, maxScore: 5, rubric: {} }));
  }

  function validate(input: NewQuestion) {
    if (!input.questionText.trim()) throw new Error("Question text is required.");
    if (input.questionType === "NUMERIC") {
      if (input.minScore === null || input.maxScore === null ||
          !Number.isSafeInteger(input.minScore) || !Number.isSafeInteger(input.maxScore) ||
          input.minScore > input.maxScore || input.maxScore - input.minScore > 20) {
        throw new Error("Enter a valid score range with at most 21 levels.");
      }
      if (input.rubric && Object.values(input.rubric).some(value => typeof value !== "string")) {
        throw new Error("Rubric descriptions must be text.");
      }
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editing === null || !draft) return;
    setError(""); setNotice("");
    try { validate(draft); } catch (e) { setError(e instanceof Error ? e.message : "Invalid question."); return; }
    setBusy(true);
    try {
      const saved = await updateEvaluationQuestion(editing, { ...draft, questionText: draft.questionText.trim() });
      setTemplate(current => current && ({
        ...current, questions: current.questions.map(q => q.id === editing ? saved : q),
      }));
      setEditing(null); setDraft(null); setNotice("Question updated.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not update question."); }
    finally { setBusy(false); }
  }

  async function remove(q: EvaluationQuestion) {
    if (!window.confirm(`Delete "${q.questionText}"? This cannot be undone.`)) return;
    setError(""); setNotice(""); setBusy(true);
    try {
      await deleteEvaluationQuestion(q.id);
      setTemplate(current => current && ({ ...current, questions: current.questions.filter(item => item.id !== q.id) }));
      setNotice("Question deleted.");
      if (editing === q.id) { setEditing(null); setDraft(null); }
    } catch (e) { setError(e instanceof Error ? e.message : "Could not delete question."); }
    finally { setBusy(false); }
  }

  return (
    <main className="evaluation-builder">
      <header className="evaluation-builder-header">
        <Link className="evaluation-back" to="/evaluation-templates">← All templates</Link>
        <p className="evaluation-eyebrow">Settings / Evaluation templates</p>
        <h1>{template?.name ?? "Evaluation template"}</h1>
        {template && <p>{template.department} · Version {template.version} · {template.questions.length} questions</p>}
      </header>
      {loading ? <section className="evaluation-panel">Loading template…</section> :
        !template ? <section className="evaluation-panel evaluation-error">{error || "Template not found."}</section> : (
        <div className="evaluation-detail-list">
          {error && <p role="alert" className="evaluation-error">{error}</p>}
          {notice && <p role="status" className="evaluation-success">{notice}</p>}
          {template.questions.length === 0 && <section className="evaluation-panel">This template has no questions.</section>}
          {template.questions.map((q, index) => (
            <section className="evaluation-panel" key={q.id}>
              <div className="evaluation-question-top">
                <div>
                  <p className="evaluation-eyebrow">Question {index + 1} · {q.questionType === "NUMERIC" ? "Numeric score" : "Written response"}</p>
                  {editing !== q.id && <h2>{q.questionText}</h2>}
                </div>
                {editing !== q.id && <div className="evaluation-detail-actions">
                  <button type="button" disabled={busy} onClick={() => beginEdit(q)}>Edit</button>
                  <button type="button" disabled={busy} className="evaluation-remove" onClick={() => void remove(q)}>Delete</button>
                </div>}
              </div>
              {editing === q.id && draft ? (
                <form className="evaluation-detail-form" onSubmit={save}>
                  <label>Question text<textarea required rows={2} value={draft.questionText} onChange={e => setDraft({ ...draft, questionText: e.target.value })}/></label>
                  <label>Question type<select value={draft.questionType} onChange={e => changeType(e.target.value as "NUMERIC" | "TEXT")}>
                    <option value="NUMERIC">Numeric score</option><option value="TEXT">Written answer</option>
                  </select></label>
                  {draft.questionType === "NUMERIC" && <>
                    <div className="evaluation-range">
                      <label>Minimum score<input type="number" value={draft.minScore ?? ""} onChange={e => setDraft({ ...draft, minScore: e.target.value === "" ? null : Number(e.target.value) })}/></label>
                      <label>Maximum score<input type="number" value={draft.maxScore ?? ""} onChange={e => setDraft({ ...draft, maxScore: e.target.value === "" ? null : Number(e.target.value) })}/></label>
                    </div>
                    <div className="evaluation-rubric"><strong>Scoring rubric</strong>
                      {draft.minScore !== null && draft.maxScore !== null &&
                       Number.isSafeInteger(draft.minScore) && Number.isSafeInteger(draft.maxScore) &&
                       draft.minScore <= draft.maxScore && draft.maxScore - draft.minScore <= 20 &&
                       Array.from({length:draft.maxScore - draft.minScore + 1},(_,i)=>draft.minScore!+i).map(score => (
                         <label className="evaluation-rubric-row" key={score}>
                           <span>{score}</span>
                           <input placeholder="Description (optional)" value={draft.rubric?.[String(score)] ?? ""}
                             onChange={e => setDraft({ ...draft, rubric: { ...draft.rubric, [String(score)]: e.target.value } })}/>
                         </label>
                       ))}
                    </div>
                  </>}
                  <div className="evaluation-detail-actions">
                    <button type="button" disabled={busy} onClick={() => { setEditing(null); setDraft(null); }}>Cancel</button>
                    <button className="evaluation-submit" disabled={busy} type="submit">{busy ? "Saving…" : "Save changes"}</button>
                  </div>
                </form>
              ) : q.questionType === "NUMERIC" ? (
                <div className="evaluation-rubric">
                  <strong>Scoring rubric · {q.minScore}–{q.maxScore}</strong>
                  {q.rubric && Object.entries(q.rubric).sort(([a],[b])=>Number(a)-Number(b)).map(([score,description]) => (
                    <div className="evaluation-rubric-display" key={score}><strong>{score}</strong><span>{description}</span></div>
                  ))}
                  {!q.rubric && <p className="evaluation-help">No rubric provided.</p>}
                </div>
              ) : <p className="evaluation-help">The evaluator enters a written response to this question.</p>}
            </section>
          ))}
          <p className="evaluation-help">Questions linked to existing employee evaluations cannot be edited or deleted. The API will return a conflict in that case.</p>
        </div>
      )}
    </main>
  );
}
