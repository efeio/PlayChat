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
    <aside className="w-16 sm:w-64 h-screen sidebar-panel flex flex-col shrink-0">
      {/* Logo */}
      <div className="h-14 sm:h-16 flex items-center justify-center sm:justify-start gap-2.5 px-3 sm:px-5 border-b border-border-default">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="url(#accentGradientLogo)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <defs>
            <linearGradient id="accentGradientLogo" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FACC15" />
              <stop offset="100%" stopColor="#A855F7" />
            </linearGradient>
          </defs>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span className="hidden sm:inline text-gradient font-semibold text-lg tracking-tight">
          PlayChat
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center justify-center sm:justify-start gap-3 px-5 py-3 text-sm ${
              isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'
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
          <span className="hidden sm:inline font-medium">Dashboard</span>
        </NavLink>
      </nav>

      {/* User footer */}
      <div className="p-4 border-t border-white/5">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 p-3 bg-[#1B132B]/80 rounded-xl border border-white/5 shadow-lg backdrop-blur-xl hover:border-purple-500/20 transition-all duration-300">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 flex items-center justify-center text-white text-xs font-semibold shadow-inner">
            {user?.displayName?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="hidden sm:block flex-1 min-w-0">
            <p className="text-[13px] text-white font-medium truncate">
              {user?.displayName}
            </p>
            <p className="text-[11px] text-text-muted truncate">@{user?.username}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-red-500/20 transition-all duration-200 cursor-pointer"
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
