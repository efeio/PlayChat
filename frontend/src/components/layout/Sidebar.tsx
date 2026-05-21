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
      <div className="h-16 flex items-center justify-center sm:justify-start gap-3 px-3 sm:px-5 border-b border-border-default">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center shadow-lg shadow-accent-primary/20">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <span className="hidden sm:inline text-gradient font-bold text-lg tracking-tight" style={{ fontFamily: 'var(--font-family-display)' }}>
          PlayChat
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 sm:px-3 space-y-1">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center justify-center sm:justify-start gap-3 px-3 sm:px-4 py-2.5 rounded-xl text-sm transition-all duration-200 ${
              isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'
            }`
          }
          title="Odalarım"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
          </svg>
          <span className="hidden sm:inline font-medium">Odalarım</span>
        </NavLink>

        <NavLink
          to="/explore"
          className={({ isActive }) =>
            `flex items-center justify-center sm:justify-start gap-3 px-3 sm:px-4 py-2.5 rounded-xl text-sm transition-all duration-200 ${
              isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'
            }`
          }
          title="Keşfet"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span className="hidden sm:inline font-medium">Keşfet</span>
        </NavLink>

        <NavLink
          to="/create-room"
          className={({ isActive }) =>
            `flex items-center justify-center sm:justify-start gap-3 px-3 sm:px-4 py-2.5 rounded-xl text-sm transition-all duration-200 ${
              isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'
            }`
          }
          title="Oda Oluştur"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span className="hidden sm:inline font-medium">Oda Oluştur</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center justify-center sm:justify-start gap-3 px-3 sm:px-4 py-2.5 rounded-xl text-sm transition-all duration-200 ${
              isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'
            }`
          }
          title="Profil"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span className="hidden sm:inline font-medium">Profil</span>
        </NavLink>
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-border-default">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-bg-card rounded-xl border border-border-default hover:border-accent-primary/20 transition-all duration-300">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-accent-primary/20 ring-2 ring-bg-base">
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
            className="p-2 rounded-lg text-text-muted hover:text-accent-danger hover:bg-accent-danger/10 transition-all duration-200 cursor-pointer"
            title="Çıkış"
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
