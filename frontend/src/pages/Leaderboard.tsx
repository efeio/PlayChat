import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/layout/Sidebar';
import { api } from '../services/api';

type GameFilter = 'global' | 'tic-tac-toe' | 'connect-four' | 'wordle' | 'memory-cards' | 'hangman' | 'number-guess' | 'rock-paper-scissors';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
}

const FILTERS: { key: GameFilter; label: string }[] = [
  { key: 'global', label: 'Global' },
  { key: 'tic-tac-toe', label: 'Tic-Tac-Toe' },
  { key: 'connect-four', label: 'Connect Four' },
  { key: 'wordle', label: 'Wordle' },
  { key: 'memory-cards', label: 'Hafıza' },
  { key: 'hangman', label: 'Adam Asmaca' },
  { key: 'number-guess', label: 'Sayı Tahmin' },
  { key: 'rock-paper-scissors', label: 'Taş Kağıt Makas' },
];

export function Leaderboard() {
  const { user, token } = useAuth();
  const [filter, setFilter] = useState<GameFilter>('global');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [filter, token]);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const data = await api.get<LeaderboardEntry[]>(
        `/api/leaderboard?game=${filter}`,
        token || undefined
      );
      setEntries(data);
    } catch {
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  };

  const currentUserEntry = entries.find((e) => e.userId === user?.id);
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="flex h-screen bg-bg-base">
      <Sidebar />

      <main className="flex-1 overflow-y-auto relative">
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-6 sm:px-8 border-b border-border-default/50 shrink-0 bg-bg-surface/40 backdrop-blur-xl sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <h1 className="page-title text-[22px]">Sıralama</h1>
            <span className="badge badge-live hidden sm:inline-flex">
              <span className="w-1.5 h-1.5 rounded-full bg-status-online animate-pulse" />
              Canlı
            </span>
          </div>
        </div>

        <div className="p-6 sm:p-8 relative z-10 pb-28">
          {/* Filter pills */}
          <div className="flex flex-wrap gap-2 mb-8 overflow-x-auto pb-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all duration-200 cursor-pointer ${
                  filter === f.key
                    ? 'bg-accent-primary text-text-inverse shadow-[0_4px_16px_var(--glow-primary)]'
                    : 'bg-bg-elevated/60 text-text-secondary border border-border-default hover:border-accent-primary/30 hover:text-text-primary'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
              <div className="w-6 h-6 border-2 border-border-default border-t-accent-primary rounded-full animate-spin" />
              <p className="text-text-muted text-sm">Yükleniyor...</p>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && entries.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 animate-fade-in">
              <div className="w-20 h-20 rounded-3xl bg-accent-warm/8 border border-accent-warm/15 flex items-center justify-center animate-float">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent-warm">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7" />
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 7" />
                  <path d="M4 22h16" />
                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                </svg>
              </div>
              <p className="text-text-primary text-lg font-bold" style={{ fontFamily: 'var(--font-family-display)' }}>
                Henüz veri yok
              </p>
              <p className="text-text-muted text-sm">Oyun oynayarak sıralamaya gir!</p>
            </div>
          )}

          {!isLoading && entries.length > 0 && (
            <div className="animate-fade-in">
              {/* Top 3 Podium */}
              {top3.length >= 3 && (
                <div className="flex items-end justify-center gap-3 sm:gap-5 mb-10 px-2">
                  {/* 2nd Place - Left */}
                  <PodiumCard entry={top3[1]} place={2} />
                  {/* 1st Place - Center */}
                  <PodiumCard entry={top3[0]} place={1} />
                  {/* 3rd Place - Right */}
                  <PodiumCard entry={top3[2]} place={3} />
                </div>
              )}

              {/* Ranking List */}
              {(top3.length < 3 ? entries : rest).length > 0 && (
                <div className="max-w-3xl mx-auto space-y-2">
                  {/* Table header */}
                  <div className="grid grid-cols-[48px_1fr_80px_60px_60px_72px] sm:grid-cols-[56px_1fr_100px_80px_80px_90px] items-center px-4 py-2 text-[11px] sm:text-xs font-semibold text-text-muted uppercase tracking-wider">
                    <span>#</span>
                    <span>Oyuncu</span>
                    <span className="text-center">Maç</span>
                    <span className="text-center">Galibiyet</span>
                    <span className="text-center">Mağlubiyet</span>
                    <span className="text-center">Oran</span>
                  </div>

                  {(top3.length < 3 ? entries : rest).map((entry) => (
                    <RankRow
                      key={entry.userId}
                      entry={entry}
                      isCurrentUser={entry.userId === user?.id}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky current user bar */}
        {currentUserEntry && currentUserEntry.rank > 3 && (
          <div className="fixed bottom-0 left-16 sm:left-60 right-0 z-30 p-3 sm:p-4 bg-bg-surface/80 backdrop-blur-xl border-t border-accent-primary/20">
            <div className="max-w-3xl mx-auto">
              <div className="grid grid-cols-[48px_1fr_80px_60px_60px_72px] sm:grid-cols-[56px_1fr_100px_80px_80px_90px] items-center px-4 py-3 rounded-2xl bg-accent-primary/8 border border-accent-primary/20 shadow-[0_0_24px_var(--glow-primary)]">
                <span className="text-sm font-bold text-accent-primary">
                  #{currentUserEntry.rank}
                </span>
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-text-inverse text-xs font-bold shrink-0 ring-2 ring-accent-primary/40">
                    {currentUserEntry.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">
                      {currentUserEntry.displayName}
                    </p>
                    <p className="text-[10px] text-accent-primary font-medium">Sen</p>
                  </div>
                </div>
                <span className="text-sm text-text-secondary text-center font-medium">
                  {currentUserEntry.totalMatches}
                </span>
                <span className="text-sm text-accent-success text-center font-medium">
                  {currentUserEntry.wins}
                </span>
                <span className="text-sm text-accent-danger text-center font-medium">
                  {currentUserEntry.losses}
                </span>
                <span className="text-sm text-text-primary text-center font-bold">
                  %{currentUserEntry.winRate}
                </span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function PodiumCard({ entry, place }: { entry: LeaderboardEntry; place: 1 | 2 | 3 }) {
  const config = {
    1: {
      size: 'w-28 sm:w-36',
      height: 'min-h-[220px] sm:min-h-[260px]',
      avatar: 'w-16 h-16 sm:w-20 sm:h-20',
      ring: 'ring-4 ring-yellow-400/50 shadow-[0_0_30px_rgba(251,191,36,0.3)]',
      gradient: 'from-yellow-400 to-amber-500',
      glow: 'shadow-[0_8px_40px_var(--glow-warm)]',
      border: 'border-yellow-400/30',
      crown: true,
      label: '🥇',
    },
    2: {
      size: 'w-24 sm:w-32',
      height: 'min-h-[190px] sm:min-h-[220px]',
      avatar: 'w-12 h-12 sm:w-16 sm:h-16',
      ring: 'ring-2 ring-gray-300/50 shadow-[0_0_20px_rgba(148,163,184,0.2)]',
      gradient: 'from-slate-300 to-gray-400',
      glow: '',
      border: 'border-gray-400/20',
      crown: false,
      label: '🥈',
    },
    3: {
      size: 'w-24 sm:w-32',
      height: 'min-h-[180px] sm:min-h-[200px]',
      avatar: 'w-12 h-12 sm:w-16 sm:h-16',
      ring: 'ring-2 ring-amber-600/40 shadow-[0_0_20px_rgba(180,83,9,0.2)]',
      gradient: 'from-amber-600 to-orange-700',
      glow: '',
      border: 'border-amber-700/20',
      crown: false,
      label: '🥉',
    },
  }[place];

  return (
    <div
      className={`${config.size} ${config.height} flex flex-col items-center justify-end gap-2 p-3 sm:p-4 rounded-3xl bg-bg-elevated/80 border ${config.border} backdrop-blur-md ${config.glow} relative transition-transform hover:scale-105 duration-300`}
    >
      {/* Crown for 1st */}
      {config.crown && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl sm:text-3xl animate-float">
          👑
        </div>
      )}

      {/* Medal */}
      <span className="text-lg sm:text-xl">{config.label}</span>

      {/* Avatar */}
      <div className={`${config.avatar} rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center text-text-inverse font-bold ${config.ring} text-sm sm:text-lg`}>
        {entry.displayName.charAt(0).toUpperCase()}
      </div>

      {/* Name */}
      <p className="text-text-primary text-xs sm:text-sm font-bold text-center truncate w-full">
        {entry.displayName}
      </p>

      {/* Stats */}
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-accent-success text-[11px] sm:text-xs font-semibold">
          {entry.wins} galibiyet
        </span>
        <span className="text-text-muted text-[10px] sm:text-[11px]">
          %{entry.winRate} oran
        </span>
      </div>
    </div>
  );
}

function RankRow({ entry, isCurrentUser }: { entry: LeaderboardEntry; isCurrentUser: boolean }) {
  return (
    <div
      className={`grid grid-cols-[48px_1fr_80px_60px_60px_72px] sm:grid-cols-[56px_1fr_100px_80px_80px_90px] items-center px-4 py-3 rounded-2xl transition-all duration-200 ${
        isCurrentUser
          ? 'bg-accent-primary/8 border border-accent-primary/20'
          : 'hover:bg-bg-elevated/40 border border-transparent'
      }`}
    >
      <span className={`text-sm font-bold ${isCurrentUser ? 'text-accent-primary' : 'text-text-muted'}`}>
        #{entry.rank}
      </span>

      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-text-inverse text-[10px] font-bold shrink-0">
          {entry.displayName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary truncate">
            {entry.displayName}
          </p>
          <p className="text-[10px] text-text-muted truncate">@{entry.username}</p>
        </div>
      </div>

      <span className="text-sm text-text-secondary text-center">{entry.totalMatches}</span>
      <span className="text-sm text-accent-success text-center font-medium">{entry.wins}</span>
      <span className="text-sm text-accent-danger text-center font-medium">{entry.losses}</span>
      <span className="text-sm text-text-primary text-center font-bold">%{entry.winRate}</span>
    </div>
  );
}
