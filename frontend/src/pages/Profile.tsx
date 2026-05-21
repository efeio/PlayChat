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
          <div className="w-6 h-6 border-2 border-border-default border-t-white rounded-full animate-spin" />
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
            <p className="text-white text-sm font-medium mb-2">Profil yüklenemedi</p>
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
        <div className="max-w-3xl mx-auto px-6 py-10">
          {/* Header */}
          <div className="flex items-start gap-5 mb-10">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-accent-primary/20">
              {profile.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="flex items-center gap-3">
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
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-white truncate">{profile.displayName}</h1>
                  {isOwnProfile && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-bg-elevated transition-colors cursor-pointer"
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
          </div>

          {/* General Stats */}
          {generalStats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
              <StatCard label="Oynanan" value={generalStats.gamesPlayed} />
              <StatCard label="Galibiyet" value={generalStats.wins} accent="green" />
              <StatCard label="Mağlubiyet" value={generalStats.losses} accent="red" />
              <StatCard label="Kazanma Oranı" value={`%${winRate}`} accent="blue" />
            </div>
          )}

          {/* Per-game Stats */}
          {gameStats.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Oyun Bazında İstatistikler</h2>
              <div className="space-y-3">
                {gameStats.map((stat) => {
                  const label = GAME_TYPE_LABELS[stat.gameType] || stat.gameType;
                  const rate = stat.gamesPlayed > 0 ? Math.round((stat.wins / stat.gamesPlayed) * 100) : 0;
                  return (
                    <div key={stat.id} className="flex items-center gap-4 p-4 bg-bg-card rounded-xl border border-border-default">
                      <span className="w-8 h-8 flex items-center justify-center text-text-secondary">
                        {GAME_ICONS[stat.gameType] || GAME_ICONS.GENERAL}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{label}</p>
                        <p className="text-xs text-text-muted">
                          {stat.gamesPlayed} oyun · {stat.wins}G / {stat.losses}M / {stat.draws}B
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-white">{rate}%</p>
                        <p className="text-[10px] text-text-muted">kazanma</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Empty State */}
          {!generalStats && (
            <div className="text-center py-16">
              <p className="text-text-muted text-sm">Henüz oyun oynamadın.</p>
              <p className="text-text-muted text-xs mt-1">Bir odaya katıl ve istatistiklerini burada gör.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  const accentClasses: Record<string, string> = {
    green: 'text-emerald-400',
    red: 'text-red-400',
    blue: 'text-sky-400',
  };
  return (
    <div className="p-4 bg-bg-card rounded-xl border border-border-default">
      <p className="text-xs text-text-muted mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent ? accentClasses[accent] : 'text-white'}`}>{value}</p>
    </div>
  );
}
