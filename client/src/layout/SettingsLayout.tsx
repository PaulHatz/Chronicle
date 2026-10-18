import { NavLink, Outlet } from "react-router-dom";
import "./SettingsLayout.css";

const links = [
  { to: "/settings/language", label: "Language / Langue", detail: "Personal language preference" },
  { to: "/users", label: "Users", detail: "Accounts and permissions" },
  { to: "/departments", label: "Departments", detail: "Teams and evaluation schedules" },
  { to: "/evaluation-templates", label: "Evaluation templates", detail: "Performance review forms" },
];

export default function SettingsLayout() {
  return (
    <div className="settings-workspace">
      <aside className="settings-sidebar" aria-label="Settings navigation">
        <div className="settings-sidebar-heading">
          <span className="settings-sidebar-eyebrow">Workspace</span>
          <h1>Settings</h1>
          <p>Manage your organization.</p>
        </div>
        <nav className="settings-sidebar-nav">
          {links.map(link => (
            <NavLink key={link.to} to={link.to}
              className={({isActive}) => `settings-sidebar-link${isActive ? " active" : ""}`}>
              <strong>{link.label}</strong>
              <small>{link.detail}</small>
            </NavLink>
          ))}
        </nav>
      </aside>
      <section className="settings-main" aria-label="Settings content">
        <Outlet />
      </section>
    </div>
  );
}
