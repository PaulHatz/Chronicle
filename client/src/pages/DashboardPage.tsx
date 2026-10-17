import "./DashboardPage.css";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getemployeelist } from "../api/employee";
import { isEvaluationDue } from "../api/evaluationDue";
import { getQuarterEvaluationStatistics } from "../api/employee-evaluations";
import { getRecentActivity, type DashboardActivity } from "../api/dashboard";

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


export default function DashboardPage() {
    const managerName = "Paul";
    const [employeeCounts, setEmployeeCounts] = useState<{ total: number; active: number; notes: number; openWriteUps: number; evaluationsDue: number } | null>(null);
    const [employeeError, setEmployeeError] = useState(false);
    const [completedThisQuarter, setCompletedThisQuarter] = useState<number | null>(null);
    const [quarterError, setQuarterError] = useState(false);
    const [recentActivity, setRecentActivity] = useState<DashboardActivity[]>([]);
    const [activityLoading, setActivityLoading] = useState(true);
    const [activityError, setActivityError] = useState(false);
    const [upcomingEvaluations, setUpcomingEvaluations] = useState<UpcomingEvaluation[]>([]);

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


    return (
        <main className="dashboard-page">
            <header className="dashboard-header">
                <div>
                    <p className="dashboard-eyebrow">Overview</p>

                    <h1>Good evening, {managerName}</h1>

                    <p>
                        Here is what is happening with your team today.
                    </p>
                </div>

            </header>

            <section className="summary-grid">
                <article className="summary-card">
                    <span className="summary-icon employees-icon" aria-hidden="true">👥</span>
                    <div className="summary-card-info">
                        <p>Total employees</p>
                        <strong>{employeeCounts?.total ?? "—"}</strong>
                        <span className="summary-card-subtext">{employeeError ? "Unable to load employees" : employeeCounts ? `${employeeCounts.active} active employees` : "Loading employees…"}</span>
                    </div>
                </article>
                <article className="summary-card">
                    <span className="summary-icon evaluation-icon" aria-hidden="true">✓</span>
                    <div className="summary-card-info">
                        <p>Evaluations completed</p>
                        <strong>{completedThisQuarter ?? "—"}</strong>
                        <span className="summary-card-subtext">{quarterError ? "Unable to load evaluations" : "This quarter"}</span>
                    </div>
                </article>
                <article className="summary-card">
                    <span className="summary-icon evaluation-icon" aria-hidden="true">◷</span>
                    <div className="summary-card-info">
                        <p>Evaluations due</p>
                        <strong>{employeeCounts?.evaluationsDue ?? "—"}</strong>
                        <span className="summary-card-subtext">Due today or overdue</span>
                    </div>
                </article>
                <article className="summary-card">
                    <span className="summary-icon note-icon" aria-hidden="true">✎</span>
                    <div className="summary-card-info">
                        <p>Manager notes</p>
                        <strong>{employeeCounts?.notes ?? "—"}</strong>
                        <span className="summary-card-subtext">{employeeError ? "Unable to load notes" : "Total manager notes"}</span>
                    </div>
                </article>
                <article className="summary-card">
                    <span className="summary-icon writeup-icon" aria-hidden="true">!</span>
                    <div className="summary-card-info">
                        <p>Open write-ups</p>
                        <strong>{employeeCounts?.openWriteUps ?? "—"}</strong>
                        <span className="summary-card-subtext">{employeeError ? "Unable to load write-ups" : "Unresolved records"}</span>
                    </div>
                </article>
            </section>

            <section className="dashboard-content-grid">
                <article className="dashboard-panel activity-panel">
                    <div className="panel-header">
                        <div>
                            <h2>Recent activity</h2>
                            <p>Latest employee record updates</p>
                        </div>

                        <Link className="text-button" to="/employees">View employees</Link>
                    </div>

                    <div className="activity-list">
                        {activityLoading && <p className="dashboard-activity-message">Loading recent activity…</p>}
                        {activityError && <p className="dashboard-activity-message" role="alert">Unable to load recent activity.</p>}
                        {!activityLoading && !activityError && recentActivity.length === 0 && <p className="dashboard-activity-message">No employee activity yet.</p>}
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
                                    {activity.type === "evaluation" && <Link className="dashboard-activity-link" to={`/employees/${activity.employeeId}/evaluations/${activity.recordId}`}>View results →</Link>}
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
                                <h2>Upcoming evaluations</h2>
                                <p>Overdue and scheduled in the next 30 days</p>
                            </div>
                        </div>

                        <div className="evaluation-list">
                            {!employeeCounts && !employeeError && <p className="dashboard-activity-message">Loading scheduled evaluations…</p>}
                            {employeeError && <p className="dashboard-activity-message" role="alert">Unable to load evaluation schedule.</p>}
                            {employeeCounts && upcomingEvaluations.length === 0 && <p className="dashboard-activity-message">No overdue or upcoming evaluations in the next 30 days.</p>}
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
                                <h2>Quick actions</h2>
                                <p>Common management tasks</p>
                            </div>
                        </div>

                        <div className="quick-action-grid">
                            <button type="button">
                                <span>＋</span>
                                Add note
                            </button>

                            <button type="button">
                                <span>★</span>
                                Start evaluation
                            </button>

                            <button type="button">
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