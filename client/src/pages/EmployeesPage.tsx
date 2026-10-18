import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./EmployeesPage.css";
import {useLanguage} from "../i18n/LanguageContext";

import { getemployeelist, addemployee } from "../api/employee";
import { getDepartmentOptions, type DepartmentOption } from "../api/departments";
import { isEvaluationDue } from "../api/evaluationDue";

type EmployeeStatus = "ACTIVE" | "INACTIVE" | "LEAVE";

type Employee = {
    id: number;
    name: string;
    initials: string;
    email: string;
    position: string;
    department: string;
    status: EmployeeStatus;
    lastEvaluation: string;
    nextEvaluation: string;
    nextEvaluationAt: string | null;
    openWriteUps: number;
    notes: number;
};



export default function EmployeesPage() {
    const {t}=useLanguage();
    
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [departments, setDepartments] = useState<DepartmentOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);

    const [newEmployee, setNewEmployee] = useState({
        firstName: "",
        lastName: "",
        email: "",
        position: "",
        departmentId: 0,
        status: "ACTIVE" as EmployeeStatus,
        phone: "",
        hireDate: ""
    });

    const [isAdding, setIsAdding] = useState(false);
    const [addError, setAddError] = useState<string | null>(null);

    async function handleAddEmployee(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();
    
        setIsAdding(true);
        setAddError(null);
    
        try {

            const response = await addemployee(newEmployee);
    
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
    
                throw new Error(
                    errorData?.message ?? "Failed to add employee",
                );
            }
    
            const data = await response.json();
    
            // Change this if your server returns the employee directly.
            const createdEmployee = data.employee;
    
            const employeeForPage: Employee = {
                id: Number(createdEmployee.id),
                name: `${createdEmployee.firstName} ${createdEmployee.lastName}`,
                initials:
                    `${createdEmployee.firstName[0]}${createdEmployee.lastName[0]}`.toUpperCase(),
                email: createdEmployee.email,
                position: createdEmployee.position,
                department: createdEmployee.department?.name ?? "Unknown",
                status: createdEmployee.status,
                lastEvaluation: "N/A",
                nextEvaluation: createdEmployee.nextEvaluationAt ? new Date(createdEmployee.nextEvaluationAt).toLocaleDateString(document.documentElement.lang) : "N/A",
                nextEvaluationAt: createdEmployee.nextEvaluationAt ?? null,
                openWriteUps: 0,
                notes: 0,
            };
    
            setEmployees((currentEmployees) => [
                ...currentEmployees,
                employeeForPage,
            ]);
    
            setNewEmployee({
                firstName: "",
                lastName: "",
                email: "",
                position: "",
                departmentId: 0,
                status: "ACTIVE",
                phone: "",
                hireDate: ""
            });
    
            setShowAddForm(false);
        } catch (error) {
            setAddError(
                error instanceof Error
                    ? error.message
                    : "Failed to add employee",
            );
        } finally {
            setIsAdding(false);
        }
    }
    
    useEffect(() => {
        void getDepartmentOptions().then(setDepartments).catch(error => console.error("Failed to load departments:", error));
        let cancelled = false;
    
        async function loadEmployees() {
            try {
                const data = await getemployeelist();
               
                if (!cancelled) {

                    const employeeList: Employee[] = data.employeeList.map(
                        (employee: any): Employee => ({
                            id: Number(employee.id),
                            name: String(employee.firstName + " " + employee.lastName),
                            initials: String(employee.firstName[0] + employee.lastName[0]),
                            email: String(employee.email),
                            position: String(employee.position),
                            department: String(employee.department?.name ?? "Unknown"),
                            status: employee.status as EmployeeStatus,
                            lastEvaluation: employee.lastEvaluationAt ? new Date(employee.lastEvaluationAt).toLocaleDateString(document.documentElement.lang) : "N/A",
                            nextEvaluation: employee.nextEvaluationAt ? new Date(employee.nextEvaluationAt).toLocaleDateString(document.documentElement.lang) : "N/A",
                            nextEvaluationAt: employee.nextEvaluationAt ?? null,
                            openWriteUps: Number(employee.openWriteUpsCount ?? 0),
                            notes: Number(employee.notesCount ?? 0),
                        }),
                    );

                    setEmployees(employeeList);

                }
            } catch (error) {
                if (!cancelled) {
                    setError(
                        error instanceof Error
                            ? error.message
                            : "Failed to load employees",
                    );
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }
    
        loadEmployees();
        return () => {
            cancelled = true;
        };
    }, []);


    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [departmentFilter, setDepartmentFilter] = useState("All");
    const activeEmployees = employees.filter(
        (employee) => employee.status === "ACTIVE",
    ).length;

    const evaluationsDue = employees.filter(employee => isEvaluationDue(employee.nextEvaluationAt)).length;
    const employeesWithWriteUps = employees.filter(
        (employee) => employee.openWriteUps > 0,
    ).length;
     
    const filteredEmployees = useMemo(() => {
        const normalizedSearch = search.toLowerCase().trim();

        return employees.filter((employee) => {
            const matchesSearch =
                employee.name.toLowerCase().includes(normalizedSearch) ||
                employee.position.toLowerCase().includes(normalizedSearch) ||
                employee.email.toLowerCase().includes(normalizedSearch);

            const matchesStatus =
                statusFilter === "All" ||
                employee.status === statusFilter;

            const matchesDepartment =
                departmentFilter === "All" ||
                employee.department === departmentFilter;

            return (
                matchesSearch &&
                matchesStatus &&
                matchesDepartment
            );
        });
    },  [
        employees,
        search,
        statusFilter,
        departmentFilter,
    ]);

  
    return (
        <main className="employees-page">
            <header className="employees-header">
                <div>
                    <p className="employees-eyebrow">{t("teamManagement")}</p>
                    <h1>{t("employees")}</h1>
                    <p className="employees-description">
                        {t("employeeDirectoryDescription")}
                    </p>
                </div>

                <button className="add-employee-button" type="button" onClick={() => setShowAddForm(true)}>
                    <span>+</span>{t("addEmployee")}</button>
            </header>

            {showAddForm && (
    <div
        className="employee-modal-backdrop"
        role="presentation"
        onMouseDown={() => setShowAddForm(false)}
    >
        <section
            className="employee-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-employee-title"
            onMouseDown={(event) => event.stopPropagation()}
        >
            <header className="employee-modal-header">
                <div>
                    <p className="employee-modal-eyebrow">{t("teamManagement")}</p>

                    <h2 id="add-employee-title">{t("addEmployee")}</h2>

                    <p>
                        {t("createEmployeeProfile")}
                    </p>
                </div>

                <button
                    className="employee-modal-close"
                    type="button"
                    aria-label={t("close")}
                    onClick={() => setShowAddForm(false)}
                >
                    ×
                </button>
            </header>

            <form
                className="add-employee-form"
                onSubmit={handleAddEmployee}
            >
                <div className="employee-form-grid">
                    <label className="employee-form-field">
                        <span>{t("firstName")}</span>

                        <input
                            required
                            autoFocus
                            type="text"
                            placeholder="Sarah"
                            value={newEmployee.firstName}
                            onChange={(event) =>
                                setNewEmployee((current) => ({
                                    ...current,
                                    firstName: event.target.value,
                                }))
                            }
                        />
                    </label>

                    <label className="employee-form-field">
                        <span>{t("lastName")}</span>

                        <input
                            required
                            type="text"
                            placeholder="Martin"
                            value={newEmployee.lastName}
                            onChange={(event) =>
                                setNewEmployee((current) => ({
                                    ...current,
                                    lastName: event.target.value,
                                }))
                            }
                        />
                    </label>

                    <label className="employee-form-field">
                        <span>{t("emailAddress")}</span>

                        <input
                            required
                            type="email"
                            placeholder="sarah.martin@example.com"
                            value={newEmployee.email}
                            onChange={(event) =>
                                setNewEmployee((current) => ({
                                    ...current,
                                    email: event.target.value,
                                }))
                            }
                        />
                    </label>
                    <label className="employee-form-field">
                        <span>{t("phoneNumber")}</span>

                        <input
                            required
                            type="tel"
                            placeholder="514-555-0123"
                            autoComplete="tel"
                            value={newEmployee.phone}
                            onChange={(event) =>
                                setNewEmployee((current) => ({
                                    ...current,
                                    phone: event.target.value,
                                }))
                            }
                        />
                    </label>

                    <label className="employee-form-field">
                        <span>{t("position")}</span>

                        <input
                            required
                            type="text"
                            placeholder={t("examplePosition")}
                            value={newEmployee.position}
                            onChange={(event) =>
                                setNewEmployee((current) => ({
                                    ...current,
                                    position: event.target.value,
                                }))
                            }
                        />
                    </label>

                    <label className="employee-form-field">
                        <span>{t("department")}</span>

                        <select
                            required
                            value={newEmployee.departmentId || ""}
                            onChange={(event) =>
                                setNewEmployee((current) => ({
                                    ...current,
                                    departmentId: Number(event.target.value),
                                }))
                            }
                        >
                            <option value="" disabled>{t("selectDepartment")}</option>
                            {departments.map((department) => (
                                <option key={department.id} value={department.id}>
                                    {department.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    

<label className="employee-form-field">
    <span>{t("startDate")}</span>

    <input
        required
        type="date"
        value={newEmployee.hireDate}
        onChange={(event) =>
            setNewEmployee((current) => ({
                ...current,
                hireDate: event.target.value,
            }))
        }
    />
</label>
                </div>

                {addError && (
                    <div className="employee-form-error" role="alert">
                        {addError}
                    </div>
                )}

                <footer className="employee-modal-actions">
                    <button
                        className="employee-form-cancel"
                        type="button"
                        disabled={isAdding}
                        onClick={() => setShowAddForm(false)}
                    >{t("cancel")}</button>

                    <button
                        className="employee-form-submit"
                        type="submit"
                        disabled={isAdding}
                    >
                        {isAdding ? "Adding..." : "Add employee"}
                    </button>
                </footer>
            </form>
        </section>
    </div>
)}

            <section className="employee-summary-grid">
                <article className="employee-summary-card">
                    <div className="summary-icon summary-icon-blue">
                        👥
                    </div>

                    <div>
                        <span>{t("totalEmployees")}</span>
                        <strong>{employees.length}</strong>
                    </div>
                </article>

                <article className="employee-summary-card">
                    <div className="summary-icon summary-icon-green">
                        ✓
                    </div>

                    <div>
                        <span>{t("activeEmployees")}</span>
                        <strong>{activeEmployees}</strong>
                    </div>
                </article>

                <article className="employee-summary-card">
                    <div className="summary-icon summary-icon-orange">
                        ⏱
                    </div>

                    <div>
                        <span>{t("evaluationsDue")}</span>
                        <strong>{isLoading ? "—" : evaluationsDue}</strong>
                    </div>
                </article>

                <article className="employee-summary-card">
                    <div className="summary-icon summary-icon-red">
                        !
                    </div>

                    <div>
                        <span>{t("openWriteUps")}</span>
                        <strong>{employeesWithWriteUps}</strong>
                    </div>
                </article>
            </section>

            <section className="employee-directory">
                <div className="directory-toolbar">
                    <div className="search-container">
                        <span className="search-icon">⌕</span>

                        <input
                            type="search"
                            placeholder={t("searchEmployees")}
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                        />
                    </div>

                    <div className="filter-group">
                        <select
                            value={departmentFilter}
                            onChange={(event) =>
                                setDepartmentFilter(event.target.value)
                            }
                            aria-label={t("filterDepartment")}
                        >
                            <option value="All">
                                {t("allDepartmentsFilter")}
                            </option>
                            {departments.map((department) => (
                                <option key={department.id} value={department.name}>
                                    {department.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={statusFilter}
                            onChange={(event) =>
                                setStatusFilter(event.target.value)
                            }
                            aria-label={t("filterStatus")}
                        >
                            <option value="All">{t("allStatuses")}</option>
                            <option value="ACTIVE">{t("active")}</option>
                            <option value="LEAVE">{t("onLeave")}</option>
                            <option value="INACTIVE">{t("inactive")}</option>
                        </select>
                    </div>
                </div>

                <div className="directory-heading">
                    <div>
                        <h2>{t("employeeDirectory")}</h2>
                        <p>
                            {filteredEmployees.length} employee
                            {filteredEmployees.length !== 1 ? "s" : ""}
                        </p>
                    </div>

                    <button className="sort-button" type="button">
                        {t("sortByName")}
                        <span>⌄</span>
                    </button>
                </div>

                <div className="employee-list">
                    {filteredEmployees.map((employee) => (
                        <article
                            className="employee-card"
                            key={employee.id}
                        >
                            <div className="employee-primary">
                                <div className="employee-avatar">
                                    {employee.initials}

                                    <span
                                        className={`employee-presence employee-presence-${employee.status.toLowerCase()}`}
                                    />
                                </div>

                                <div className="employee-identity">
                                    <div className="employee-name-row">
                                        <h3>{employee.name}</h3>

                                        <span
                                            className={`employee-status employee-status-${employee.status.toLowerCase()}`}
                                        >
                                            {employee.status === "Leave"
                                                ? "On leave"
                                                : employee.status}
                                        </span>
                                    </div>

                                    <p>
                                        {employee.position}
                                        <span>•</span>
                                        {employee.department}
                                    </p>

                                    <a href={`mailto:${employee.email}`}>
                                        {employee.email}
                                    </a>
                                </div>
                            </div>

                            <div className="employee-metrics">
                                <div className="employee-metric">
                                    <span>{t("lastEvaluation")}</span>
                                    <strong>
                                        {employee.lastEvaluation}
                                    </strong>
                                </div>

                                <div className="employee-metric">
                                    <span>{t("nextEvaluation")}</span>
                                    <strong>
                                        {employee.nextEvaluation}
                                    </strong>
                                </div>

                                <div className="employee-metric compact">
                                    <span>{t("notes")}</span>
                                    <strong>{employee.notes}</strong>
                                </div>

                                <div className="employee-metric compact">
                                    <span>{t("writeUps")}</span>
                                    <strong

                                        className={
                                            employee.openWriteUps > 0
                                                ? "metric-warning"
                                                : ""
                                        }
                                    >
                                        {employee.openWriteUps}
                                    </strong>
                                </div>
                            </div>
                          
                            <Link
                                className="view-employee-button"
                                to={`/employees/${employee.id}`}
                            >
                                {t("viewProfile")}
                                <span>→</span>
                            </Link> 
                        </article>
                    ))}

                    {filteredEmployees.length === 0 && (
                        <div className="empty-employees">
                            <div>⌕</div>
                            <h3>{t("noEmployees")}</h3>
                            <p>
                                Try changing your search or filter
                                selections.
                            </p>
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}
