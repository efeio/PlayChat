import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Sidebar } from '../components/layout/Sidebar';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../context/ToastContext';
import { GAME_ICONS } from '../components/games/GameIcons';

interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  isVerified: boolean;
  createdAt: string;
  stats: UserStat[];
}

interface UserStat {
  id: string;
  userId: string;
  gameType: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  roomsJoined: number;
}

const GAME_TYPE_LABELS: Record<string, string> = {
  GENERAL: 'Genel',
  TIC_TAC_TOE: 'XOX',
  CONNECT_FOUR: 'Dörtlü Bağla',
  ROCK_PAPER_SCISSORS: 'Taş Kağıt Makas',
  HANGMAN: 'Adam Asmaca',
  WORDLE: 'Wordle',
  MEMORY_CARDS: 'Hafıza Kartları',
  NUMBER_GUESS: 'Sayı Tahmin',
};

const GAME_COLORS: Record<string, string> = {
  TIC_TAC_TOE: '#8b5cf6',
  CONNECT_FOUR: '#06d6a0',
  ROCK_PAPER_SCISSORS: '#f59e0b',
  HANGMAN: '#ef4444',
  WORDLE: '#3b82f6',
  MEMORY_CARDS: '#ec4899',
  NUMBER_GUESS: '#14b8a6',
};

export function Profile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, token } = useAuth();
  const { addToast } = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isOwnProfile = !id || id === currentUser?.id;
  const profileId = id || currentUser?.id;

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setIsLoading(true);
    const endpoint = isOwnProfile ? '/api/users/me' : `/api/users/${profileId}`;
    api.get<UserProfile>(endpoint, token)
      .then((data) => {
        if (cancelled) return;
        setProfile(data);
        setEditName(data.displayName);
      })
      .catch(() => {
        if (cancelled) return;
        setProfile(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [profileId, isOwnProfile, token]);

  const handleSave = async () => {
    if (!token || !editName.trim()) return;
    setIsSaving(true);
    try {
      const updated = await api.put<UserProfile>('/api/users/me', { displayName: editName.trim() }, token);
      setProfile((prev) => prev ? { ...prev, ...updated } : prev);
      setIsEditing(false);
      addToast('success', 'Profil güncellendi');
    } catch {
      addToast('error', 'Profil güncellenemedi');
    } finally {
      setIsSaving(false);
    }
  };

  const generalStats = profile?.stats.find((s) => s.gameType === 'GENERAL');
  const gameStats = profile?.stats.filter((s) => s.gameType !== 'GENERAL') || [];

  const winRate = generalStats && generalStats.gamesPlayed > 0
    ? Math.round((generalStats.wins / generalStats.gamesPlayed) * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="flex h-screen bg-bg-base">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-border-default border-t-accent-primary rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-screen bg-bg-base">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-text-primary text-sm font-medium mb-2">Profil yüklenemedi</p>
            <p className="text-text-muted text-xs mb-4">Lütfen tekrar giriş yapmayı deneyin.</p>
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              Geri Dön
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-bg-base">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-10">
          {/* Header - centered */}
          <div className="flex flex-col items-center text-center mb-12">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-text-inverse text-3xl font-bold shadow-lg shadow-accent-primary/20 mb-4">
              {profile.displayName.charAt(0).toUpperCase()}
            </div>
            {isEditing ? (
              <div className="flex items-center gap-3 mt-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="max-w-[240px]"
                  maxLength={32}
                />
                <Button onClick={handleSave} disabled={isSaving || !editName.trim()}>
                  Kaydet
                </Button>
                <Button variant="ghost" onClick={() => { setIsEditing(false); setEditName(profile.displayName); }}>
                  İptal
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-2">
                <h1 className="text-3xl font-bold text-text-primary">{profile.displayName}</h1>
                {isOwnProfile && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors cursor-pointer"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                )}
              </div>
            )}
            <p className="text-text-muted text-sm mt-1">@{profile.username}</p>
            <p className="text-text-muted text-xs mt-1">
              {new Date(profile.createdAt).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })} tarihinde katıldı
            </p>
          </div>

          {/* General Stats - larger cards */}
          {generalStats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
              <StatCard label="Oynanan" value={generalStats.gamesPlayed} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} />
              <StatCard label="Galibiyet" value={generalStats.wins} accent="green" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>} />
              <StatCard label="Mağlubiyet" value={generalStats.losses} accent="red" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>} />
              <StatCard label="Kazanma Oranı" value={`%${winRate}`} accent="blue" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>} />
            </div>
          )}

          {/* Pie Chart + Game Stats */}
          {gameStats.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
              {/* Pie Chart */}
              <div className="p-6 bg-bg-card rounded-2xl border border-border-default">
                <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-5">Oyun Dağılımı</h2>
                <div className="flex flex-col items-center gap-6">
                  <PieChart gameStats={gameStats} />
                  <div className="flex flex-wrap justify-center gap-3">
                    {gameStats.map((stat) => (
                      <div key={stat.id} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: GAME_COLORS[stat.gameType] || '#6b7280' }} />
                        <span className="text-xs text-text-secondary">{GAME_TYPE_LABELS[stat.gameType] || stat.gameType}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Per-game Stats */}
              <div className="p-6 bg-bg-card rounded-2xl border border-border-default">
                <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-5">Oyun Bazında</h2>
                <div className="space-y-3">
                  {gameStats.map((stat) => {
                    const label = GAME_TYPE_LABELS[stat.gameType] || stat.gameType;
                    const rate = stat.gamesPlayed > 0 ? Math.round((stat.wins / stat.gamesPlayed) * 100) : 0;
                    return (
                      <div key={stat.id} className="flex items-center gap-3 p-3 bg-bg-elevated/50 rounded-xl">
                        <span className="w-8 h-8 flex items-center justify-center text-text-secondary">
                          {GAME_ICONS[stat.gameType] || GAME_ICONS.GENERAL}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary">{label}</p>
                          <p className="text-xs text-text-muted">
                            {stat.gamesPlayed} oyun · {stat.wins}G / {stat.losses}M / {stat.draws}B
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-text-primary">{rate}%</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {(!generalStats || (generalStats.gamesPlayed === 0 && gameStats.length === 0)) && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-20 h-20 rounded-3xl bg-accent-primary/8 border border-accent-primary/15 flex items-center justify-center">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent-primary">
                  <line x1="12" y1="20" x2="12" y2="10" />
                  <line x1="18" y1="20" x2="18" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="16" />
                </svg>
              </div>
              <p className="text-text-primary text-lg font-bold" style={{ fontFamily: 'var(--font-family-display)' }}>Henüz oyun oynamadın</p>
              <p className="text-text-muted text-sm">Bir odaya katıl ve istatistiklerini burada gör.</p>
              <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mt-2">
                Odalara Git
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, accent, icon }: { label: string; value: string | number; accent?: string; icon: React.ReactNode }) {
  const accentClasses: Record<string, string> = {
    green: 'text-emerald-500',
    red: 'text-red-500',
    blue: 'text-sky-500',
  };
  return (
    <div className="p-5 bg-bg-card rounded-2xl border border-border-default shadow-sm flex flex-col gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent ? accentClasses[accent] : 'text-text-muted'} bg-bg-elevated`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-text-muted font-medium">{label}</p>
        <p className={`text-3xl font-bold mt-0.5 ${accent ? accentClasses[accent] : 'text-text-primary'}`}>{value}</p>
      </div>
    </div>
  );
}

function PieChart({ gameStats }: { gameStats: UserStat[] }) {
  const total = gameStats.reduce((sum, s) => sum + s.gamesPlayed, 0);
  if (total === 0) {
    return (
      <div className="w-40 h-40 rounded-full border-[12px] border-border-default flex items-center justify-center">
        <span className="text-text-muted text-xs">Veri yok</span>
      </div>
    );
  }

  const size = 176;
  const strokeWidth = 28;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;
  const segments = gameStats
    .filter((s) => s.gamesPlayed > 0)
    .map((stat) => {
      const fraction = stat.gamesPlayed / total;
      const dash = fraction * circumference;
      const offset = cumulativeOffset;
      cumulativeOffset += dash;
      return { ...stat, dash, offset };
    });

  return (
    <div className="relative w-44 h-44">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        {segments.map((segment) => (
          <circle
            key={segment.id}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={GAME_COLORS[segment.gameType] || '#6b7280'}
            strokeWidth={strokeWidth}
            strokeDasharray={`${segment.dash} ${circumference - segment.dash}`}
            strokeDashoffset={-segment.offset}
            strokeLinecap="butt"
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-text-primary leading-none">{total}</span>
        <span className="text-xs text-text-muted mt-0.5">oyun</span>
      </div>
    </div>
  );
}
