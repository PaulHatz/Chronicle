import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  createEvaluationTemplate, addEvaluationQuestion,
  getEvaluationTemplates, type NewQuestion,
} from "../api/evaluations";
import "./EvaluationTemplatesPage.css";

type DraftQuestion = {
  key: number;
  questionText: string;
  questionType: "NUMERIC" | "TEXT";
  minScore: number;
  maxScore: number;
  rubric: Record<string, string>;
};

const newQuestion = (key: number): DraftQuestion => ({
  key, questionText: "", questionType: "NUMERIC",
  minScore: 1, maxScore: 5, rubric: {},
});

export default function EvaluationTemplatesPage() {
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("Service");
  const [version, setVersion] = useState("1.0");
  const [questions, setQuestions] = useState<DraftQuestion[]>([newQuestion(1)]);
  const [nextKey, setNextKey] = useState(2);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [templates, setTemplates] = useState<Array<{ id: number; name: string; department: string; version: string }>>([]);

  useEffect(() => {
    void getEvaluationTemplates().then(setTemplates).catch(() => {
      // Creation can still work if loading the existing templates fails.
    });
  }, []);

  function editQuestion(key: number, patch: Partial<DraftQuestion>) {
    setQuestions(current => current.map(q => q.key === key ? { ...q, ...patch } : q));
  }

  function appendQuestion() {
    setQuestions(current => [...current, newQuestion(nextKey)]);
    setNextKey(current => current + 1);
  }

  function removeQuestion(key: number) {
    setQuestions(current => current.filter(q => q.key !== key));
  }

  function validateAndConvert(q: DraftQuestion, index: number): NewQuestion {
    if (!q.questionText.trim()) throw new Error(`Question ${index + 1} needs a title.`);
    if (q.questionType === "TEXT") {
      return { questionText: q.questionText.trim(), questionType: "TEXT", minScore: null, maxScore: null, rubric: null };
    }
    if (!Number.isSafeInteger(q.minScore) || !Number.isSafeInteger(q.maxScore) ||
        q.minScore > q.maxScore || q.maxScore - q.minScore > 20) {
      throw new Error(`Question ${index + 1} needs a valid score range (maximum 21 levels).`);
    }
    const rubric: Record<string, string> = {};
    for (let score = q.minScore; score <= q.maxScore; score++) {
      const description = q.rubric[String(score)]?.trim();
      if (!description) throw new Error(`Add rubric description for question ${index + 1}, score ${score}.`);
      rubric[String(score)] = description;
    }
    return {
      questionText: q.questionText.trim(), questionType: "NUMERIC",
      minScore: q.minScore, maxScore: q.maxScore, rubric,
    };
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!name.trim() || !department.trim() || !version.trim()) {
      setError("Enter a name, department, and version.");
      return;
    }
    if (questions.length === 0) {
      setError("Add at least one question.");
      return;
    }

    let payload: NewQuestion[];
    try {
      payload = questions.map(validateAndConvert);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Invalid question.");
      return;
    }

    setSaving(true);
    let templateId: number | null = null;
    try {
      const template = await createEvaluationTemplate({
        name: name.trim(), department: department.trim(), version: version.trim(),
      });
      templateId = template.id;
      for (const question of payload) {
        await addEvaluationQuestion(template.id, question);
      }
      setSuccess(`Template #${template.id} created successfully with ${payload.length} question(s).`);
      setName("");
      setQuestions([newQuestion(nextKey)]);
      setNextKey(current => current + 1);
      setTemplates(await getEvaluationTemplates());
    } catch (caught) {
      setError(
        (caught instanceof Error ? caught.message : "Could not save template.") +
        (templateId !== null ? ` Template #${templateId} was created; some questions might not have saved.` : "")
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="evaluation-builder">
      <header className="evaluation-builder-header">
        <div>
          <Link className="evaluation-back" to="/evaluation-templates">← All templates</Link>
          <p className="evaluation-eyebrow">Employee performance</p>
          <h1>Create evaluation template</h1>
          <p>Build department-specific evaluations with scored and written questions.</p>
        </div>
      </header>

      <div className="evaluation-layout">
        <form className="evaluation-editor" onSubmit={submit}>
          <section className="evaluation-panel">
            <div className="evaluation-panel-heading">
              <span className="evaluation-number">01</span>
              <div><h2>Template details</h2><p>Choose a name, department, and version.</p></div>
            </div>
            <div className="evaluation-fields">
              <label>Template name<input required value={name} placeholder="Quarterly performance review" onChange={e => setName(e.target.value)} /></label>
              <label>Department<input required value={department} placeholder="Kitchen" onChange={e => setDepartment(e.target.value)} /></label>
              <label>Version<input required value={version} placeholder="1.0" onChange={e => setVersion(e.target.value)} /></label>
            </div>
          </section>

          <section className="evaluation-panel">
            <div className="evaluation-panel-heading">
              <span className="evaluation-number">02</span>
              <div><h2>Questions</h2><p>Add scored questions with a rubric, or written responses.</p></div>
            </div>
            <div className="evaluation-questions">
              {questions.map((q, i) => (
                <div className="evaluation-question" key={q.key}>
                  <div className="evaluation-question-top">
                    <strong>Question {i + 1}</strong>
                    <button type="button" className="evaluation-remove" onClick={() => removeQuestion(q.key)}>Remove</button>
                  </div>
                  <label>Question text<textarea required rows={2} value={q.questionText} placeholder="How well does the employee work with their team?" onChange={e => editQuestion(q.key, { questionText: e.target.value })} /></label>
                  <label>Answer type
                    <select value={q.questionType} onChange={e => editQuestion(q.key, { questionType: e.target.value as DraftQuestion["questionType"] })}>
                      <option value="NUMERIC">Numeric score</option>
                      <option value="TEXT">Written answer</option>
                    </select>
                  </label>
                  {q.questionType === "NUMERIC" ? (
                    <>
                      <div className="evaluation-range">
                        <label>Minimum score<input type="number" value={q.minScore} onChange={e => editQuestion(q.key, { minScore: Number(e.target.value) })} /></label>
                        <label>Maximum score<input type="number" value={q.maxScore} onChange={e => editQuestion(q.key, { maxScore: Number(e.target.value) })} /></label>
                      </div>
                      <div className="evaluation-rubric">
                        <div className="evaluation-rubric-heading"><strong>Scoring rubric</strong><span>Describe what each score means</span></div>
                        {Number.isSafeInteger(q.minScore) && Number.isSafeInteger(q.maxScore) &&
                          q.minScore <= q.maxScore && q.maxScore - q.minScore <= 20 &&
                          Array.from({ length: q.maxScore - q.minScore + 1 }, (_, offset) => q.minScore + offset).map(score => (
                            <label className="evaluation-rubric-row" key={score}>
                              <span>{score}</span>
                              <textarea rows={3} aria-label={`Description for score ${score}`} value={q.rubric[String(score)] ?? ""} placeholder={`Meaning of score ${score}`}
                                onChange={e => editQuestion(q.key, { rubric: { ...q.rubric, [String(score)]: e.target.value } })} />
                            </label>
                          ))}
                      </div>
                    </>
                  ) : <p className="evaluation-help">The evaluator will enter a written response.</p>}
                </div>
              ))}
            </div>
            <button type="button" className="evaluation-add" onClick={appendQuestion}>＋ Add question</button>
          </section>
          {error && <div className="evaluation-error" role="alert">{error}</div>}
          {success && <div className="evaluation-success" role="status">{success}</div>}
          <div className="evaluation-actions">
            <button type="submit" disabled={saving} className="evaluation-submit">{saving ? "Saving…" : "Create evaluation template"}</button>
          </div>
        </form>
        <aside className="evaluation-sidebar">
          <section className="evaluation-panel">
            <h2>Template overview</h2>
            <div className="evaluation-stat"><span>Questions</span><strong>{questions.length}</strong></div>
            <div className="evaluation-stat"><span>Numeric</span><strong>{questions.filter(q => q.questionType === "NUMERIC").length}</strong></div>
            <div className="evaluation-stat"><span>Written</span><strong>{questions.filter(q => q.questionType === "TEXT").length}</strong></div>
          </section>
          <section className="evaluation-panel">
            <h2>Existing templates</h2>
            {templates.length ? templates.map(template =>
              <div key={template.id} className="evaluation-existing">
                <strong>{template.name}</strong>
                <span>{template.department} · v{template.version}</span>
              </div>
            ) : <p className="evaluation-help">No templates loaded yet.</p>}
          </section>
        </aside>
      </div>
    </main>
  );
}
