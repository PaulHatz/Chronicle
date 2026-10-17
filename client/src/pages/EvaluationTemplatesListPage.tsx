import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getEvaluationTemplates } from "../api/evaluations";
import "./EvaluationTemplatesPage.css";

type Template = { id: number; name: string; version: string };

export default function EvaluationTemplatesListPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => {
    void getEvaluationTemplates()
      .then(setTemplates)
      .catch(e => setError(e instanceof Error ? e.message : "Could not load templates."))
      .finally(() => setLoading(false));
  }, []);
  const visible = templates.filter(t => (t.name + " " + t.version).toLowerCase().includes(search.toLowerCase()));
  return (
    <main className="evaluation-builder">
      <div className="evaluation-list-header">
        <div>
          <p className="evaluation-eyebrow">Settings / Evaluations</p>
          <h1>Evaluation templates</h1>
          <p className="evaluation-help">Manage the evaluation formats available to your departments.</p>
        </div>
        <Link to="/evaluation-templates/new" className="evaluation-submit evaluation-link-button">＋ Create template</Link>
      </div>
      <div className="evaluation-panel evaluation-template-list">
        <div className="evaluation-list-toolbar">
          <h2>All templates <span>({templates.length})</span></h2>
          <input aria-label="Search evaluation templates" placeholder="Search by name or version…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {loading ? <p className="evaluation-help">Loading templates…</p> :
          error ? <p className="evaluation-error" role="alert">{error}</p> :
          visible.length === 0 ? <div className="evaluation-empty"><strong>No templates found</strong><p>Create a template to get started, or change your search.</p></div> :
          <div className="evaluation-list-rows">
            {visible.map(t => <Link className="evaluation-list-row evaluation-list-link" to={`/evaluation-templates/${t.id}`} key={t.id}>
              <div className="evaluation-template-symbol">▤</div>
              <div><strong>{t.name}</strong><span>Evaluation template</span></div>
              <span className="evaluation-version">v{t.version}</span><span aria-hidden="true">→</span>
            </Link>)}
          </div>}
      </div>
    </main>
  );
}
