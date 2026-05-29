import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Sidebar } from '../components/layout/Sidebar';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { RoomCardSkeleton } from '../components/ui/SkeletonLoader';

import { api } from '../services/api';
import type { Room } from '../types/room.types';

export function Dashboard() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const { token } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const abortRef = useRef<AbortController | null>(null);

  const fetchRooms = useCallback(async () => {
    if (!token) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const data = await api.get<Room[]>('/api/rooms/my-rooms', token, controller.signal);
      if (!controller.signal.aborted) {
        setRooms(data);
      }
    } catch (err) {
      if (!controller.signal.aborted && !(err instanceof DOMException && err.name === 'AbortError')) {
        addToast('error', 'Odalar yüklenemedi');
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [token, addToast]);

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') fetchRooms();
    }, 5000);
    return () => {
      clearInterval(interval);
      abortRef.current?.abort();
    };
  }, [fetchRooms]);

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;
    try {
      const room = await api.post<Room>(
        '/api/rooms',
        { name: newRoomName.trim() },
        token || undefined
      );
      setNewRoomName('');
      setShowCreate(false);
      navigate(`/room/${room.id}`);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to create room');
    }
  };

  return (
    <div className="flex h-screen bg-bg-base">
      <Sidebar />

      <main className="flex-1 overflow-y-auto relative">
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-6 sm:px-8 border-b border-border-default/50 shrink-0 bg-bg-surface/40 backdrop-blur-xl sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <h1 className="page-title text-[22px]">Oyun Odaları</h1>
            <span className="badge badge-live hidden sm:inline-flex">
              <span className="w-1.5 h-1.5 rounded-full bg-status-online animate-pulse" />
              Canlı
            </span>
          </div>
          {rooms.length > 0 && (
            <div className="flex items-center gap-2">
              <Button onClick={() => setShowCreate(true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span className="hidden sm:inline">Yeni Oda</span>
                <span className="sm:hidden">Yeni</span>
              </Button>
            </div>
          )}
        </div>

        <div className="p-6 sm:p-8 relative z-10">
          {/* Create room modal */}
          {showCreate && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay backdrop-blur-md p-4"
              role="dialog"
              aria-modal="true"
              aria-label="Oda oluştur"
              onKeyDown={(e) => e.key === 'Escape' && setShowCreate(false)}
              onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
            >
              <div className="w-full max-w-md bg-bg-surface/90 backdrop-blur-2xl border border-accent-primary/15 rounded-3xl p-8 shadow-[0_32px_80px_rgba(0,0,0,0.2)] flex flex-col gap-6 animate-modal-in relative overflow-hidden">
                {/* Top glow */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent-primary/60 to-transparent" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-20 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.1),transparent_70%)]" />

                <div>
                  <h2 className="section-title mb-1">Oda Oluştur</h2>
                  <p className="text-text-muted text-sm">Yeni bir oyun odası oluştur ve arkadaşlarını davet et</p>
                </div>

                <Input
                  id="room-name"
                  placeholder="Oda adı girin..."
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
                  autoFocus
                />

                <div className="flex justify-end gap-3 w-full">
                  <Button variant="ghost" onClick={() => setShowCreate(false)}>
                    İptal
                  </Button>
                  <Button
                    onClick={handleCreateRoom}
                    disabled={!newRoomName.trim()}
                  >
                    Oda Oluştur
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <RoomCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Empty state — gaming themed */}
          {!isLoading && rooms.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full w-full min-h-[500px] gap-6 animate-fade-in">
              <div className="w-24 h-24 rounded-3xl bg-accent-primary/8 border border-accent-primary/15 flex items-center justify-center animate-float">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent-primary">
                  <line x1="6" y1="11" x2="6" y2="11.01" />
                  <line x1="10" y1="11" x2="10" y2="11.01" />
                  <line x1="14" y1="11" x2="14" y2="11.01" />
                  <line x1="18" y1="11" x2="18" y2="11.01" />
                  <path d="M2 8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-4l-4 4-4-4H4a2 2 0 0 1-2-2V8z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-text-primary text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-family-display)' }}>Henüz oda yok</p>
                <p className="text-text-muted text-sm max-w-xs">Oynamaya başlamak için ilk odanı oluştur ve arkadaşlarını davet et</p>
              </div>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-2 px-7 py-3.5 rounded-2xl border-2 border-dashed border-accent-primary/25 text-text-secondary hover:border-accent-primary/50 hover:text-text-primary hover:bg-accent-primary/5 hover:shadow-[0_0_30px_rgba(139,92,246,0.1)] transition-all duration-300 cursor-pointer text-sm font-semibold"
              >
                + İlk odanı oluştur
              </button>
            </div>
          )}

          {/* Room grid */}
          {!isLoading && rooms.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 w-full max-w-7xl mx-auto animate-fade-in">
              {/* Create new room card */}
              <button
                onClick={() => setShowCreate(true)}
                className="game-card flex flex-col items-center justify-center gap-4 p-6 min-h-[240px] cursor-pointer group border-dashed border-accent-primary/15"
              >
                <div className="w-14 h-14 rounded-2xl bg-accent-primary/8 border border-accent-primary/15 flex items-center justify-center group-hover:bg-accent-primary/15 group-hover:border-accent-primary/30 group-hover:scale-110 group-hover:rotate-90 transition-all duration-300">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-primary">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </div>
                <span className="font-semibold text-sm text-text-muted group-hover:text-text-primary transition-colors">Yeni oda oluştur</span>
              </button>

              {rooms.map((room, roomIndex) => {
                const accentColors = [
                  'from-violet-500 to-purple-600',
                  'from-emerald-400 to-teal-500',
                  'from-cyan-400 to-blue-500',
                  'from-amber-400 to-orange-500',
                  'from-pink-400 to-rose-500',
                  'from-indigo-400 to-violet-500',
                ];
                const accent = accentColors[roomIndex % accentColors.length];

                return (
                  <div
                    key={room.id}
                    className="room-card p-6 flex flex-col justify-between min-h-[220px] group cursor-pointer"
                    onClick={() => navigate(`/room/${room.id}`)}
                  >
                    <div>
                      {/* Room icon + name */}
                      <div className="flex items-start justify-between mb-5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center text-text-inverse text-sm font-bold shrink-0 shadow-lg`}>
                            {room.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h3 className="card-title text-[15px] group-hover:text-text-primary transition-colors truncate">
                              {room.name}
                            </h3>
                            <p className="text-text-muted text-[11px] mt-0.5">
                              {room.members.length} oyuncu
                            </p>
                          </div>
                        </div>
                        {room.games && room.games.length > 0 && (
                          <span className="game-active-pill animate-pulse-glow">
                            <span className="w-1.5 h-1.5 rounded-full bg-status-online" />
                            Canlı
                          </span>
                        )}
                      </div>

                      {/* Members preview */}
                      <div className="flex items-center gap-3 mb-5">
                        <div className="flex -space-x-2">
                          {room.members.slice(0, 4).map((m, i) => (
                            <div
                              key={m.id}
                              className={`w-7 h-7 rounded-full bg-gradient-to-br ${accent} ring-2 ring-bg-card flex items-center justify-center text-[9px] text-text-inverse font-bold relative`}
                              title={m.user.displayName}
                              style={{ zIndex: 10 - i }}
                            >
                              {m.user.displayName.charAt(0).toUpperCase()}
                            </div>
                          ))}
                          {room.members.length > 4 && (
                            <div className="w-7 h-7 rounded-full bg-bg-elevated ring-2 ring-bg-card flex items-center justify-center text-[9px] text-text-muted font-bold relative z-0">
                              +{room.members.length - 4}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/room/${room.id}`);
                      }}
                      fullWidth
                    >
                      Odaya Katıl
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
