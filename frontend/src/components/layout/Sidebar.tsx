import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../ui/ThemeToggle';

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-16 sm:w-60 h-screen sidebar-panel flex flex-col shrink-0">
      {/* Logo */}
      <div className="h-14 flex items-center justify-center sm:justify-start gap-2.5 px-3 sm:px-5 border-b border-border-default/50">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center shadow-lg shadow-accent-primary/25 animate-glow">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <span className="hidden sm:inline text-gradient font-extrabold text-[17px] tracking-tight" style={{ fontFamily: 'var(--font-family-display)' }}>
          PlayChat
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-1.5 sm:px-2 space-y-0.5">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center justify-center sm:justify-start gap-3 px-3 sm:px-4 py-2.5 text-[13px] transition-all duration-200 group ${
              isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'
            }`
          }
          title="Odalarım"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform duration-200">
            <rect x="3" y="3" width="7" height="7" rx="2" />
            <rect x="14" y="3" width="7" height="7" rx="2" />
            <rect x="14" y="14" width="7" height="7" rx="2" />
            <rect x="3" y="14" width="7" height="7" rx="2" />
          </svg>
          <span className="hidden sm:inline font-semibold">Odalarım</span>
        </NavLink>

        <NavLink
          to="/explore"
          className={({ isActive }) =>
            `flex items-center justify-center sm:justify-start gap-3 px-3 sm:px-4 py-2.5 text-[13px] transition-all duration-200 group ${
              isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'
            }`
          }
          title="Keşfet"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform duration-200">
            <polygon points="3 11 22 2 13 21 11 13 3 11" />
          </svg>
          <span className="hidden sm:inline font-semibold">Keşfet</span>
        </NavLink>

        <NavLink
          to="/create-room"
          className={({ isActive }) =>
            `flex items-center justify-center sm:justify-start gap-3 px-3 sm:px-4 py-2.5 text-[13px] transition-all duration-200 group ${
              isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'
            }`
          }
          title="Oda Oluştur"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 group-hover:rotate-90 transition-all duration-300">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span className="hidden sm:inline font-semibold">Oda Oluştur</span>
        </NavLink>

        <NavLink
          to="/leaderboard"
          className={({ isActive }) =>
            `flex items-center justify-center sm:justify-start gap-3 px-3 sm:px-4 py-2.5 text-[13px] transition-all duration-200 group ${
              isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'
            }`
          }
          title="Sıralama"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform duration-200">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 7" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
          </svg>
          <span className="hidden sm:inline font-semibold">Sıralama</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center justify-center sm:justify-start gap-3 px-3 sm:px-4 py-2.5 text-[13px] transition-all duration-200 group ${
              isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'
            }`
          }
          title="Profil"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform duration-200">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span className="hidden sm:inline font-semibold">Profil</span>
        </NavLink>
      </nav>

      {/* Theme toggle */}
      <div className="flex justify-center px-2.5 pb-2">
        <ThemeToggle />
      </div>

      {/* User footer - gaming pill style */}
      <div className="p-2.5">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-2.5 p-2 sm:p-2.5 rounded-2xl bg-bg-elevated/60 border border-border-default hover:border-accent-primary/25 transition-all duration-300 group">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-text-inverse text-xs font-bold shadow-lg shadow-accent-primary/20">
              {user?.displayName?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-status-online border-2 border-bg-base animate-status-glow" />
          </div>
          <div className="hidden sm:block flex-1 min-w-0">
            <p className="text-[12px] text-text-primary font-semibold truncate leading-tight">
              {user?.displayName}
            </p>
            <p className="text-[10px] text-text-muted truncate">Çevrimiçi</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-text-muted hover:text-accent-danger hover:bg-accent-danger/10 transition-all duration-200 cursor-pointer"
            title="Çıkış"
            aria-label="Çıkış yap"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
