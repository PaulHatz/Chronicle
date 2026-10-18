import "./DashboardPage.css";
import {useLanguage} from "../i18n/LanguageContext";
import EmployeePicker, { type EmployeePickerOption } from "../components/EmployeePicker";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getemployeelist, createManagerNote, createEmployeeWriteUp, type WriteUpType, type ManagerNoteType } from "../api/employee";
import { isEvaluationDue } from "../api/evaluationDue";
import { getQuarterEvaluationStatistics } from "../api/employee-evaluations";
import { getRecentActivity, type DashboardActivity } from "../api/dashboard";

type RecordAction = "note" | "writeup" | "recognition";

type UpcomingEvaluation = {
    id: number;
    employee: string;
    position: string;
    date: string;
    daysRemaining: number;
};

function findUpcomingEvaluations(employees: Array<{
    id: number;
    firstName: string;
    lastName: string;
    position: string;
    nextEvaluationAt?: string | null;
}>): UpcomingEvaluation[] {
    const now = new Date();
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const dayMs = 24 * 60 * 60 * 1000;

    return employees.flatMap(employee => {
        if (!employee.nextEvaluationAt) return [];
        const date = new Date(employee.nextEvaluationAt);
        if (Number.isNaN(date.getTime())) return [];
        const scheduledDay = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
        const daysRemaining = Math.round((scheduledDay - today) / dayMs);
        if (daysRemaining > 30) return [];
        return [{
            id: employee.id,
            employee: `${employee.firstName} ${employee.lastName}`,
            position: employee.position,
            date: date.toLocaleDateString(undefined, { timeZone: "UTC", month: "short", day: "numeric" }),
            daysRemaining,
        }];
    }).sort((a, b) => a.daysRemaining - b.daysRemaining || a.employee.localeCompare(b.employee));
}


function greetingForHour(hour: number): string {
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
}

export default function DashboardPage() {
    const {t}=useLanguage();
    const managerName = "Paul";
    const [greeting, setGreeting] = useState(() => greetingForHour(new Date().getHours()));

    useEffect(() => {
        const updateGreeting = () => setGreeting(greetingForHour(new Date().getHours()));
        const interval = window.setInterval(updateGreeting, 60_000);
        window.addEventListener("focus", updateGreeting);
        return () => { window.clearInterval(interval); window.removeEventListener("focus", updateGreeting); };
    }, []);
    const [employeeCounts, setEmployeeCounts] = useState<{ total: number; active: number; notes: number; openWriteUps: number; evaluationsDue: number } | null>(null);
    const [employeeError, setEmployeeError] = useState(false);
    const [completedThisQuarter, setCompletedThisQuarter] = useState<number | null>(null);
    const [quarterError, setQuarterError] = useState(false);
    const [recentActivity, setRecentActivity] = useState<DashboardActivity[]>([]);
    const [activityLoading, setActivityLoading] = useState(true);
    const [activityError, setActivityError] = useState(false);
    const [upcomingEvaluations, setUpcomingEvaluations] = useState<UpcomingEvaluation[]>([]);
    const [employees, setEmployees] = useState<EmployeePickerOption[]>([]);
    const [recordAction, setRecordAction] = useState<RecordAction | null>(null);
    const [recordEmployeeId, setRecordEmployeeId] = useState("");
    const [noteTitle, setNoteTitle] = useState("");
    const [noteType, setNoteType] = useState<ManagerNoteType>("GENERAL");
    const [recordContent, setRecordContent] = useState("");
    const [warningType, setWarningType] = useState<WriteUpType>("VERBAL_WARNING");
    const [recordSaving, setRecordSaving] = useState(false);
    const [recordError, setRecordError] = useState("");
    const [recordNotice, setRecordNotice] = useState("");

    useEffect(() => {
        let cancelled = false;
        async function loadEmployeeCounts() {
            try {
                const data: unknown = await getemployeelist();
                if (!data || typeof data !== "object" || !("employeeList" in data) ||
                    !Array.isArray(data.employeeList)) {
                    throw new Error("Invalid employee list response.");
                }
                const employees = data.employeeList as Array<{ id: number; firstName: string; lastName: string; position: string; status?: string; notesCount?: number; openWriteUpsCount?: number; nextEvaluationAt?: string | null }>;
                if (!cancelled) {
                    setEmployees(employees);
                    setUpcomingEvaluations(findUpcomingEvaluations(employees));
                    setEmployeeCounts({
                        total: employees.length,
                        active: employees.filter(employee => employee.status === "ACTIVE").length,
                        notes: employees.reduce((total, employee) => total + (employee.notesCount ?? 0), 0),
                        openWriteUps: employees.reduce((total, employee) => total + (employee.openWriteUpsCount ?? 0), 0),
                        evaluationsDue: employees.filter(employee => isEvaluationDue(employee.nextEvaluationAt)).length,
                    });
                }
            } catch (error) {
                console.error("Failed to load dashboard employee counts:", error);
                if (!cancelled) setEmployeeError(true);
            }
        }
        void loadEmployeeCounts();
        void getRecentActivity().then(items => { if (!cancelled) setRecentActivity(items); })
            .catch(error => { console.error(error); if (!cancelled) setActivityError(true); })
            .finally(() => { if (!cancelled) setActivityLoading(false); });
        void getQuarterEvaluationStatistics()
            .then(data => { if (!cancelled) setCompletedThisQuarter(data.completedThisQuarter); })
            .catch(error => {
                console.error("Failed to load quarterly evaluation statistics:", error);
                if (!cancelled) setQuarterError(true);
            });
        return () => { cancelled = true; };
    }, []);


    function openRecord(action: RecordAction) {
        setRecordAction(action);
        setRecordEmployeeId("");
        setNoteTitle("");
        setNoteType(action === "recognition" ? "POSITIVE" : "GENERAL");
        setRecordContent("");
        setWarningType("VERBAL_WARNING");
        setRecordError("");
        setRecordNotice("");
    }

    async function submitRecord(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const employeeId = Number(recordEmployeeId);
        if (!Number.isSafeInteger(employeeId) || !employees.some(employee => employee.id === employeeId)) {
            setRecordError("Select an employee.");
            return;
        }
        if (!recordContent.trim() || (recordAction !== "writeup" && !noteTitle.trim())) {
            setRecordError("Complete all required fields.");
            return;
        }
        setRecordSaving(true);
        setRecordError("");
        try {
            if (recordAction === "note" || recordAction === "recognition") {
                await createManagerNote(employeeId, { title: noteTitle.trim(), content: recordContent.trim(), type: recordAction === "recognition" ? "POSITIVE" : noteType });
            } else if (recordAction === "writeup") {
                await createEmployeeWriteUp(employeeId, { type: warningType, reason: recordContent.trim() });
            } else return;
            setRecordNotice(recordAction === "recognition" ? "Recognition added." : recordAction === "note" ? "Manager note saved." : "Write-up created.");
            setRecordAction(null);
            const [activity, list] = await Promise.allSettled([getRecentActivity(), getemployeelist()]);
            if (activity.status === "fulfilled") setRecentActivity(activity.value);
            if (list.status === "fulfilled" && Array.isArray(list.value?.employeeList)) {
                const updated = list.value.employeeList as Array<{ id: number; firstName: string; lastName: string; position: string; status?: string; notesCount?: number; openWriteUpsCount?: number; nextEvaluationAt?: string | null }>;
                setEmployees(updated);
                setUpcomingEvaluations(findUpcomingEvaluations(updated));
                setEmployeeCounts({
                    total: updated.length,
                    active: updated.filter(employee => employee.status === "ACTIVE").length,
                    notes: updated.reduce((sum, employee) => sum + (employee.notesCount ?? 0), 0),
                    openWriteUps: updated.reduce((sum, employee) => sum + (employee.openWriteUpsCount ?? 0), 0),
                    evaluationsDue: updated.filter(employee => isEvaluationDue(employee.nextEvaluationAt)).length,
                });
            }
        } catch (caught) {
            setRecordError(caught instanceof Error ? caught.message : "Unable to save record.");
        } finally {
            setRecordSaving(false);
        }
    }

    return (
        <main className="dashboard-page">
            <header className="dashboard-header">
                <div>
                    <p className="dashboard-eyebrow">{t("overview")}</p>

                    <h1>{t(greeting === "Good morning" ? "goodMorning" : greeting === "Good afternoon" ? "goodAfternoon" : "goodEvening")}, {managerName}</h1>

                    <p>
                        {t("teamToday")}
                    </p>
                </div>

            </header>

            {recordNotice && <p className="dashboard-record-notice" role="status">{recordNotice}</p>}
            {recordAction && (
                <div className="dashboard-record-backdrop" onMouseDown={() => { if (!recordSaving) setRecordAction(null); }}>
                    <section className="dashboard-record-modal" role="dialog" aria-modal="true" aria-label={recordAction === "recognition" ? "Add recognition" : recordAction === "note" ? "Add manager note" : "Create write-up"} onMouseDown={event => event.stopPropagation()}>
                        <h2>{recordAction === "recognition" ? "Add recognition" : recordAction === "note" ? "Add manager note" : "Create write-up"}</h2>
                        <p>{t("chooseEmployee")}</p>
                        <form onSubmit={submitRecord}>
                            <EmployeePicker employees={employees} value={recordEmployeeId}
                                onChange={id => { setRecordEmployeeId(id); setRecordError(""); }} disabled={recordSaving}/>
                            {recordAction !== "writeup" ? (
                                <>{recordAction === "note" && <fieldset className="note-type-fieldset"><legend>{t("noteType")}</legend><div className="note-type-button-group" role="group" aria-label="Note type">{([["GENERAL","General"],["POSITIVE","Positive"],["IMPROVEMENT","Needs improvement"]] as const).map(([value,label])=><button key={value} type="button" className={`note-type-option${noteType === value ? " selected" : ""}`} aria-pressed={noteType === value} disabled={recordSaving} onClick={()=>setNoteType(value)}>{label}</button>)}</div></fieldset>}<label>{t("title")}<input required maxLength={200} value={noteTitle} onChange={event => setNoteTitle(event.target.value)} disabled={recordSaving}/></label></>
                            ) : (
                                <label>Warning type
                                    <select value={warningType} onChange={event => setWarningType(event.target.value as WriteUpType)} disabled={recordSaving}>
                                        <option value="VERBAL_WARNING">{t("verbalWarning")}</option>
                                        <option value="WRITTEN_WARNING">{t("writtenWarning")}</option>
                                        <option value="FINAL_WARNING">{t("finalWarning")}</option>
                                    </select>
                                </label>
                            )}
                            <label>{recordAction === "recognition" ? "Recognition details" : recordAction === "note" ? "Note" : "Reason / details"}
                                <textarea required rows={5} maxLength={10000} value={recordContent} onChange={event => setRecordContent(event.target.value)} disabled={recordSaving}/>
                            </label>
                            {recordError && <p className="dashboard-record-error" role="alert">{recordError}</p>}
                            {employeeError && <p className="dashboard-record-error" role="alert">{t("loadEmployeesFailed")}</p>}
                            <div className="dashboard-record-actions">
                                <button type="button" disabled={recordSaving} onClick={() => setRecordAction(null)}>{t("cancel")}</button>
                                <button type="submit" disabled={recordSaving || employeeError || !employees.length}>{recordSaving ? "Saving…" : "Save record"}</button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
            <section className="summary-grid">
                <article className="summary-card">
                    <span className="summary-icon employees-icon" aria-hidden="true">👥</span>
                    <div className="summary-card-info">
                        <p>{t("totalEmployees")}</p>
                        <strong>{employeeCounts?.total ?? "—"}</strong>
                        <span className="summary-card-subtext">{employeeError ? "Unable to load employees" : employeeCounts ? `${employeeCounts.active} active employees` : "Loading employees…"}</span>
                    </div>
                </article>
                <article className="summary-card">
                    <span className="summary-icon evaluation-icon" aria-hidden="true">✓</span>
                    <div className="summary-card-info">
                        <p>{t("completedEvaluations")}</p>
                        <strong>{completedThisQuarter ?? "—"}</strong>
                        <span className="summary-card-subtext">{quarterError ? "Unable to load evaluations" : "This quarter"}</span>
                    </div>
                </article>
                <article className="summary-card">
                    <span className="summary-icon evaluation-icon" aria-hidden="true">◷</span>
                    <div className="summary-card-info">
                        <p>{t("evaluationsDue")}</p>
                        <strong>{employeeCounts?.evaluationsDue ?? "—"}</strong>
                        <span className="summary-card-subtext">{t("dueOverdue")}</span>
                    </div>
                </article>
                <article className="summary-card">
                    <span className="summary-icon note-icon" aria-hidden="true">✎</span>
                    <div className="summary-card-info">
                        <p>{t("managerNotes")}</p>
                        <strong>{employeeCounts?.notes ?? "—"}</strong>
                        <span className="summary-card-subtext">{employeeError ? "Unable to load notes" : "Total manager notes"}</span>
                    </div>
                </article>
                <article className="summary-card">
                    <span className="summary-icon writeup-icon" aria-hidden="true">!</span>
                    <div className="summary-card-info">
                        <p>{t("openWriteUps")}</p>
                        <strong>{employeeCounts?.openWriteUps ?? "—"}</strong>
                        <span className="summary-card-subtext">{employeeError ? "Unable to load write-ups" : "Unresolved records"}</span>
                    </div>
                </article>
            </section>

            <section className="dashboard-content-grid">
                <article className="dashboard-panel activity-panel">
                    <div className="panel-header">
                        <div>
                            <h2>{t("recentActivity")}</h2>
                            <p>{t("latestRecordUpdates")}</p>
                        </div>

                        <Link className="text-button" to="/employees">{t("viewEmployees")}</Link>
                    </div>

                    <div className="activity-list">
                        {activityLoading && <p className="dashboard-activity-message">{t("loadingActivity")}</p>}
                        {activityError && <p className="dashboard-activity-message" role="alert">{t("activityFailed")}</p>}
                        {!activityLoading && !activityError && recentActivity.length === 0 && <p className="dashboard-activity-message">{t("noActivity")}</p>}
                        {recentActivity.map((activity) => (
                            <div
                                className="activity-item"
                                key={activity.id}
                            >
                                <div className="employee-avatar">
                                    {activity.initials}
                                </div>

                                <div className="activity-information">
                                    <div className="activity-title-row">
                                        <Link className="dashboard-activity-employee" to={`/employees/${activity.employeeId}`}>
                                            {activity.employee}
                                        </Link>

                                        <span
                                            className={`activity-type ${activity.type}`}
                                        >
                                            {activity.type}
                                        </span>
                                    </div>

                                    <p>{activity.action}</p>
                                    {activity.type === "evaluation" && <Link className="dashboard-activity-link" to={`/employees/${activity.employeeId}/evaluations/${activity.recordId}`}>{t("viewResultsShort")}</Link>}
                                    <span>{activity.detail}</span>
                                </div>

                                <time dateTime={activity.occurredAt}>{new Date(activity.occurredAt).toLocaleDateString()}</time>
                            </div>
                        ))}
                    </div>
                </article>

                <aside className="dashboard-side-column">
                    <article className="dashboard-panel">
                        <div className="panel-header">
                            <div>
                                <h2>{t("upcomingEvaluations")}</h2>
                                <p>{t("next30Days")}</p>
                            </div>
                        </div>

                        <div className="evaluation-list">
                            {!employeeCounts && !employeeError && <p className="dashboard-activity-message">{t("loadingScheduled")}</p>}
                            {employeeError && <p className="dashboard-activity-message" role="alert">{t("invalidSchedule")}</p>}
                            {employeeCounts && upcomingEvaluations.length === 0 && <p className="dashboard-activity-message">{t("noUpcoming")}</p>}
                            {upcomingEvaluations.map((evaluation) => (
                                <div
                                    className="evaluation-item"
                                    key={evaluation.id}
                                >
                                    <div>
                                        <Link className="dashboard-upcoming-employee" to={`/employees/${evaluation.id}`}>
                                            {evaluation.employee}
                                        </Link>

                                        <span>
                                            {evaluation.position}
                                        </span>
                                    </div>

                                    <div className="evaluation-date">
                                        <strong>{evaluation.date}</strong>

                                        <span>
                                            {evaluation.daysRemaining < 0 ? `${Math.abs(evaluation.daysRemaining)} ${Math.abs(evaluation.daysRemaining) === 1 ? "day" : "days"} overdue` : evaluation.daysRemaining === 0 ? "Due today" : evaluation.daysRemaining === 1 ? "Tomorrow" : `${evaluation.daysRemaining} days away`}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Link className="panel-button dashboard-schedule-link" to="/employees">
                            View employee schedule
                        </Link>
                    </article>

                    <article className="dashboard-panel quick-actions-panel">
                        <div className="panel-header">
                            <div>
                                <h2>{t("quickActions")}</h2>
                                <p>{t("commonTasks")}</p>
                            </div>
                        </div>

                        <div className="quick-action-grid">
                            <button type="button" onClick={() => openRecord("note")}>
                                <span>＋</span>
                                Add note
                            </button>

                            <button type="button" onClick={() => openRecord("recognition")}>
                                <span>★</span>
                                Add recognition
                            </button>

                            <button type="button" onClick={() => openRecord("writeup")}>
                                <span>!</span>
                                Create write-up
                            </button>

                            <button type="button">
                                <span>⌕</span>
                                Find employee
                            </button>
                        </div>
                    </article>
                </aside>
            </section>
        </main>
    );
}