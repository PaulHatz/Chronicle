import { useId, useState } from "react";
import "./EmployeePicker.css";

export type EmployeePickerOption = {
  id: number;
  firstName: string;
  lastName: string;
  position: string;
  status?: string;
};

type Props = {
  employees: EmployeePickerOption[];
  value: string;
  onChange: (employeeId: string) => void;
  disabled?: boolean;
  activeOnly?: boolean;
};

export default function EmployeePicker({ employees, value, onChange, disabled = false, activeOnly = true }: Props) {
  const searchId = useId();
  const [search, setSearch] = useState("");
  const query = search.trim().toLocaleLowerCase();
  const selectedEmployee = employees.find(employee => String(employee.id) === value);
  const matches = employees
    .filter(employee => (!activeOnly || employee.status === "ACTIVE") &&
      `${employee.firstName} ${employee.lastName} ${employee.position}`.toLocaleLowerCase().includes(query))
    .sort((a, b) => (a.lastName + a.firstName).localeCompare(b.lastName + b.firstName));

  return (
    <div className="dashboard-employee-picker">
      <label htmlFor={searchId}>Employee</label>
      <div className="dashboard-employee-search">
        <span aria-hidden="true">⌕</span>
        <input id={searchId} type="search" placeholder="Search employees by name or position…"
          autoComplete="off" value={search} onChange={event => {
            setSearch(event.target.value);
            if (value) onChange("");
          }} disabled={disabled}/>
      </div>
      {selectedEmployee && <span className="dashboard-employee-selected" role="status">Selected: {selectedEmployee.firstName} {selectedEmployee.lastName}</span>}
      <div className="dashboard-employee-results" role="group" aria-label="Choose an employee">
        {matches.map(employee => (
          <button type="button" key={employee.id} disabled={disabled}
            className={`dashboard-employee-choice${value === String(employee.id) ? " is-selected" : ""}`}
            aria-pressed={value === String(employee.id)}
            onClick={() => {
              onChange(String(employee.id));
              setSearch(`${employee.firstName} ${employee.lastName}`);
            }}>
            <span className="dashboard-employee-avatar" aria-hidden="true">{employee.firstName.charAt(0)}{employee.lastName.charAt(0)}</span>
            <span className="dashboard-employee-label">
              <strong>{employee.firstName} {employee.lastName}</strong>
              <small>{employee.position}</small>
            </span>
            {value === String(employee.id) && <span className="dashboard-employee-check" aria-hidden="true">✓</span>}
          </button>
        ))}
        {matches.length === 0 && <p className="dashboard-employee-empty">No matching employees.</p>}
      </div>
    </div>
  );
}
