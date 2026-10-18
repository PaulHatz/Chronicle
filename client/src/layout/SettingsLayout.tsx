import { NavLink, Outlet } from "react-router-dom";
import "./SettingsLayout.css";
import { useLanguage } from "../i18n/LanguageContext";

const links = [
  { to: "/settings/language", label: "Language / Langue", detail: "Personal language preference" },
  { to: "/users", label: "Users", detail: "Accounts and permissions" },
  { to: "/departments", label: "Departments", detail: "Teams and evaluation schedules" },
  { to: "/evaluation-templates", label: "Evaluation templates", detail: "Performance review forms" },
];

export default function SettingsLayout() {
  const {t}=useLanguage();
  return (
    <div className="settings-workspace">
      <aside className="settings-sidebar" aria-label="Settings navigation">
        <div className="settings-sidebar-heading">
          <span className="settings-sidebar-eyebrow">{t("workspace")}</span>
          <h1>{t("settings")}</h1>
          <p>{t("manageOrganization")}</p>
        </div>
        <nav className="settings-sidebar-nav">
          {links.map(link => (
            <NavLink key={link.to} to={link.to}
              className={({isActive}) => `settings-sidebar-link${isActive ? " active" : ""}`}>
              <strong>{link.to==="/users"?t("users"):link.to==="/departments"?t("departments"):link.to==="/evaluation-templates"?t("evaluationTemplates"):t("language")}</strong>
              <small>{link.to==="/users"?t("accountPermissions"):link.to==="/departments"?t("teamsSchedules"):link.to==="/evaluation-templates"?t("performanceForms"):t("languageDescription")}</small>
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
