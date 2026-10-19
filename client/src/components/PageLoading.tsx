import { useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./PageLoading.css";

function Skeleton({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`chronicle-skeleton ${className}`} />;
}

export default function PageLoading() {
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();
  const showWorkspace = isAuthenticated && pathname !== "/login";

  if (!showWorkspace) {
    return (
      <main className="chronicle-loading-login" role="status" aria-live="polite" aria-label="Loading Chronicle">
        <div className="chronicle-loading-login-mark" aria-hidden="true">C</div>
        <h1>Chronicle</h1>
        <p>Preparing your workspace…</p>
        <div className="chronicle-loading-progress" aria-hidden="true"><span /></div>
      </main>
    );
  }

  return (
    <div className="chronicle-loading-shell" role="status" aria-live="polite" aria-label="Loading your workspace">
      <header className="chronicle-loading-topbar" aria-hidden="true">
        <div className="chronicle-loading-nav">
          <div className="chronicle-loading-brand"><span className="chronicle-loading-mark">C</span><strong>Chronicle</strong></div>
          <Skeleton className="chronicle-loading-navitem" />
          <Skeleton className="chronicle-loading-navitem" />
          <span className="chronicle-loading-spacer" />
          <Skeleton className="chronicle-loading-circle" />
        </div>
      </header>
      <main className="chronicle-loading-workspace">
        <div className="chronicle-loading-heading" aria-hidden="true">
          <div><Skeleton className="chronicle-loading-title" /><Skeleton className="chronicle-loading-subtitle" /></div>
          <Skeleton className="chronicle-loading-button" />
        </div>
        <div className="chronicle-loading-stats" aria-hidden="true">
          {[0, 1, 2].map((index) => <div className="chronicle-loading-card" key={index}><Skeleton className="chronicle-loading-label" /><Skeleton className="chronicle-loading-number" /></div>)}
        </div>
        <div className="chronicle-loading-panels" aria-hidden="true">
          <div className="chronicle-loading-card chronicle-loading-panel">
            <Skeleton className="chronicle-loading-panel-title" />
            {[0, 1, 2, 3].map((index) => <div className="chronicle-loading-line" key={index}><Skeleton className="chronicle-loading-avatar" /><div><Skeleton className="chronicle-loading-row-title" /><Skeleton className="chronicle-loading-row-text" /></div></div>)}
          </div>
          <div className="chronicle-loading-card chronicle-loading-panel chronicle-loading-side">
            <Skeleton className="chronicle-loading-panel-title" />
            <Skeleton className="chronicle-loading-side-block" />
            <Skeleton className="chronicle-loading-side-block" />
          </div>
        </div>
        <p className="chronicle-loading-caption">Loading your workspace…</p>
      </main>
    </div>
  );
}
