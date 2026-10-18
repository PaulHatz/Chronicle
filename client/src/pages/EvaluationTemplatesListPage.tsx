import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getEvaluationTemplates } from "../api/evaluations";
import "./EvaluationTemplatesPage.css";
import {useLanguage} from "../i18n/LanguageContext";

type Template = { id: number; name: string; version: string };

export default function EvaluationTemplatesListPage() {
  const {t}=useLanguage();
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
          <p className="evaluation-eyebrow">{t("settingsEvaluations")}</p>
          <h1>{t("evaluationTemplates")}</h1>
          <p className="evaluation-help">{t("manageTemplates")}</p>
        </div>
        <Link to="/evaluation-templates/new" className="evaluation-submit evaluation-link-button">＋ {t("createTemplateShort")}</Link>
      </div>
      <div className="evaluation-panel evaluation-template-list">
        <div className="evaluation-list-toolbar">
          <h2>All templates <span>({templates.length})</span></h2>
          <input aria-label="Search evaluation templates" placeholder="Search by name or version…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {loading ? <p className="evaluation-help">{t("loadingTemplates")}</p> :
          error ? <p className="evaluation-error" role="alert">{error}</p> :
          visible.length === 0 ? <div className="evaluation-empty"><strong>{t("noTemplates")}</strong><p>{t("templateCreationHelp")}</p></div> :
          <div className="evaluation-list-rows">
            {visible.map(t => <Link className="evaluation-list-row evaluation-list-link" to={`/evaluation-templates/${t.id}`} key={t.id}>
              <div className="evaluation-template-symbol">▤</div>
              <div><strong>{t.name}</strong><span>{t("evaluationTemplate")}</span></div>
              <span className="evaluation-version">v{t.version}</span><span aria-hidden="true">→</span>
            </Link>)}
          </div>}
      </div>
    </main>
  );
}
