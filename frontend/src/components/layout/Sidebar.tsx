import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-16 sm:w-64 h-screen bg-bg-surface border-r border-border flex flex-col shrink-0">
      {/* Logo */}
      <div className="h-14 sm:h-16 flex items-center justify-center sm:justify-start gap-2.5 px-3 sm:px-5 border-b border-border">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-text-primary"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span className="hidden sm:inline text-text-primary font-semibold text-lg tracking-tight">
          PlayChat
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 sm:p-3 space-y-1">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center justify-center sm:justify-start gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-150 ${
              isActive
                ? 'bg-bg-elevated text-text-primary'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
            }`
          }
          title="Dashboard"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          <span className="hidden sm:inline">Dashboard</span>
        </NavLink>
      </nav>

      {/* User footer */}
      <div className="p-2 sm:p-3 border-t border-border">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-bg-elevated border border-border flex items-center justify-center text-text-primary text-xs font-semibold">
            {user?.displayName?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="hidden sm:block flex-1 min-w-0">
            <p className="text-sm text-text-primary font-medium truncate">
              {user?.displayName}
            </p>
            <p className="text-xs text-text-muted truncate">@{user?.username}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors cursor-pointer"
            title="Logout"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
