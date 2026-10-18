import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getEvaluationResult, type EvaluationResult } from "../api/employee-evaluations";
import "./EmployeeEvaluationPage.css";
import {useLanguage} from "../i18n/LanguageContext";

export default function EmployeeEvaluationResultPage() {
  const {t}=useLanguage();
  const { employeeId, evaluationId } = useParams();
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState("");
  const employee = Number(employeeId);
  useEffect(() => {
    let alive = true;
    void getEvaluationResult(employee, Number(evaluationId))
      .then(data => { if (alive) setResult(data); })
      .catch(e => { if (alive) setError(e instanceof Error ? e.message : "Unable to load evaluation."); });
    return () => { alive = false; };
  }, [employee, evaluationId]);
  return <main className="employee-evaluation-page">
    <Link className="employee-eval-back" to={`/employees/${employee}`}>{t("employeeProfileBack")}</Link>
    {error && <p className="employee-eval-error" role="alert">{error}</p>}
    {!error && !result && <p>{t("loadingEvaluation")}</p>}
    {result && <>
      <header className="employee-eval-header">
        <p>{t("completedEvaluation")}</p>
        <h1>{result.template.name}</h1>
        <span>{result.employee.firstName} {result.employee.lastName} · {result.employee.department.name} · {new Date(result.completedAt).toLocaleDateString(document.documentElement.lang)} · v{result.template.version}</span>
      </header>
      <div className="employee-eval-form">
        {result.answers.map((answer,index) => <section className="employee-eval-card" key={answer.id}>
          <p className="employee-eval-index">Question {index+1}</p>
          <h2>{answer.question.questionText}</h2>
          {answer.scoreAnswer !== null && <div className="evaluation-result-score">
            <strong>Score: {answer.scoreAnswer}</strong>
            <p>{answer.question.rubric?.[String(answer.scoreAnswer)] ?? ""}</p>
          </div>}
          {answer.textAnswer && <div className="evaluation-result-text">{answer.textAnswer}</div>}
        </section>)}
      </div>
    </>}
  </main>;
}
