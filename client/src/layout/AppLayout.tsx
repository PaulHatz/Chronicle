import { useEffect } from "react";
import { NavLink, Link, Outlet } from "react-router-dom";
import { apiFetch } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import "./AppLayout.css";

export default function AppLayout() {
  const { logout, isAuthenticated } = useAuth();
  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    void apiFetch("/auth/me").then(response => response.ok ? response.json() : null).then(user => {
      if (active && user?.language) {
        document.documentElement.lang = user.language;
        localStorage.setItem("chronicle-language", user.language);
      }
    }).catch(() => {});
    return () => { active = false; };
  }, [isAuthenticated]);
  return (
    <div className="chronicle-shell">
      <header className="chronicle-topbar">
        <div className="chronicle-nav-inner">
          <Link className="chronicle-brand" to="/">
            <span className="chronicle-mark">C</span>
            <span>Chronicle</span>
          </Link>
          <nav className="chronicle-primary-nav" aria-label="Main navigation">
            <NavLink to="/" end className={({isActive}) => isActive ? "chronicle-nav-link active" : "chronicle-nav-link"}>Dashboard</NavLink>
            <NavLink to="/employees" className={({isActive}) => isActive ? "chronicle-nav-link active" : "chronicle-nav-link"}>Employees</NavLink>
          </nav>
          <div className="chronicle-header-actions">
            <NavLink to="/settings" className={({isActive}) => isActive || ["/settings","/users","/departments","/evaluation-templates"].some(path=>window.location.pathname.startsWith(path)) ? "chronicle-settings-icon active" : "chronicle-settings-icon"} aria-label="Settings" title="Settings">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/>
                <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.07-1.9 1.9-.07-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1 1.57V21h-2.7v-.98a1.7 1.7 0 0 0-1-1.57 1.7 1.7 0 0 0-1.88.34l-.07.06-1.9-1.9.06-.07A1.7 1.7 0 0 0 7.8 15a1.7 1.7 0 0 0-1.57-1H5.25v-2.7h.98a1.7 1.7 0 0 0 1.57-1 1.7 1.7 0 0 0-.34-1.88l-.06-.07 1.9-1.9.07.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1-1.57V4h2.7v.98a1.7 1.7 0 0 0 1 1.57 1.7 1.7 0 0 0 1.88-.34l.07-.06 1.9 1.9-.06.07A1.7 1.7 0 0 0 19.4 10a1.7 1.7 0 0 0 1.57 1h.98v2.7h-.98A1.7 1.7 0 0 0 19.4 15Z" transform="translate(-.65 -.65)"/>
              </svg>
            </NavLink>
            <button className="chronicle-logout" type="button" onClick={logout}>Sign out</button>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
