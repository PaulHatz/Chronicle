import { useEffect, useRef, useState } from "react";
import { NavLink, Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./AppLayout.css";

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleOutsideClick(event: PointerEvent) {
      if (!settingsRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);
  const location = useLocation();
  const { logout } = useAuth();
  const settingsActive = (location.pathname.startsWith("/evaluation-templates") || location.pathname.startsWith("/departments") || location.pathname.startsWith("/users"));
  return (
    <div className="chronicle-shell">
      <header className="chronicle-topbar">
        <div className="chronicle-nav-inner">
          <Link className="chronicle-brand" to="/" onClick={() => setOpen(false)}>
            <span className="chronicle-mark">C</span>
            <span>Chronicle</span>
          </Link>
          <nav className="chronicle-primary-nav" aria-label="Main navigation">
            <NavLink to="/" end className={({isActive}) => isActive ? "chronicle-nav-link active" : "chronicle-nav-link"}>Dashboard</NavLink>
            <NavLink to="/employees" className={({isActive}) => isActive ? "chronicle-nav-link active" : "chronicle-nav-link"}>Employees</NavLink>
            <div className="chronicle-settings-menu" ref={settingsRef}>
              <button type="button" className={settingsActive ? "chronicle-nav-link active" : "chronicle-nav-link"} aria-expanded={open} aria-haspopup="true" onClick={() => setOpen(v => !v)}>
                Settings <span aria-hidden="true">⌄</span>
              </button>
              {open && (
                <div className="chronicle-menu" role="menu">
                  <Link role="menuitem" to="/users" onClick={() => setOpen(false)}>Users<span>Manage user accounts and roles</span></Link>
                  <Link role="menuitem" to="/departments" onClick={() => setOpen(false)}>Departments<span>Manage departments and review frequency</span></Link>
                  <Link role="menuitem" to="/evaluation-templates" onClick={() => setOpen(false)}>Evaluation templates<span>View and manage templates</span></Link>
                  <Link role="menuitem" to="/evaluation-templates/new" onClick={() => setOpen(false)}>Create evaluation template<span>Build a new evaluation</span></Link>
                </div>
              )}
            </div>
          </nav>
          <button className="chronicle-logout" type="button" onClick={logout}>Sign out</button>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
