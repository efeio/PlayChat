import { useState, useEffect } from 'react';
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

  const fetchRooms = async () => {
    try {
      const timeoutId = setTimeout(() => {
        if (isLoading) {
          setIsLoading(false);
          addToast('error', 'Odalar yüklenemedi - zaman aşımı');
        }
      }, 5000);

      const data = await api.get<Room[]>('/api/rooms/my-rooms', token || undefined);
      clearTimeout(timeoutId);
      setRooms(data);
    } catch {
      addToast('error', 'Odalar yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 5000);
    return () => clearInterval(interval);
  }, [token]);

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
        <div className="h-16 flex items-center justify-between px-6 sm:px-8 border-b border-border-default shrink-0 bg-bg-surface/50 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <h1 className="page-title">Oyun Odaları</h1>
            <span className="badge badge-live hidden sm:inline-flex">
              <span className="w-1.5 h-1.5 rounded-full bg-status-online animate-pulse" />
              Canlı
            </span>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="hidden sm:inline">Yeni Oda</span>
            <span className="sm:hidden">Yeni</span>
          </Button>
        </div>

        <div className="p-6 sm:p-8 relative z-10">
          {/* Create room modal */}
          {showCreate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay backdrop-blur-sm p-4">
              <div className="w-full max-w-md bg-bg-surface border border-border-default rounded-2xl p-8 shadow-2xl shadow-black/40 flex flex-col gap-6 animate-modal-in relative overflow-hidden">
                {/* Top glow */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent-primary/50 to-transparent" />

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

          {/* Empty state */}
          {!isLoading && rooms.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full w-full min-h-[500px] gap-6 animate-fade-in">
              <div className="w-20 h-20 rounded-2xl bg-bg-card border border-border-default flex items-center justify-center animate-float">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#emptyGradient)" strokeWidth="1.5">
                  <defs>
                    <linearGradient id="emptyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#22d3ee" />
                    </linearGradient>
                  </defs>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-white text-lg font-semibold mb-1" style={{ fontFamily: 'var(--font-family-display)' }}>Henüz oda yok</p>
                <p className="text-text-muted text-sm">Oynamaya başlamak için ilk odanı oluştur</p>
              </div>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-2 px-6 py-3 rounded-xl border border-dashed border-accent-primary/30 text-text-muted hover:border-accent-primary/60 hover:text-white transition-all duration-200 cursor-pointer text-sm font-medium bg-bg-card/40 hover:bg-bg-card/80"
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
                className="game-card flex flex-col items-center justify-center gap-4 p-6 min-h-[240px] cursor-pointer group border-dashed"
              >
                <div className="w-14 h-14 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center group-hover:bg-accent-primary/20 group-hover:border-accent-primary/40 group-hover:scale-110 transition-all duration-300">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-primary">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </div>
                <span className="font-medium text-sm text-text-muted group-hover:text-white transition-colors">Yeni oda oluştur</span>
              </button>

              {rooms.map((room, roomIndex) => {
                const accentColors = [
                  'from-indigo-500 to-purple-500',
                  'from-cyan-500 to-blue-500',
                  'from-emerald-500 to-teal-500',
                  'from-amber-500 to-orange-500',
                  'from-pink-500 to-rose-500',
                  'from-violet-500 to-fuchsia-500',
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
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-lg`}>
                            {room.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h3 className="card-title text-[15px] group-hover:text-white transition-colors truncate">
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
                              className={`w-7 h-7 rounded-full bg-gradient-to-br ${accent} ring-2 ring-[#151c2c] flex items-center justify-center text-[9px] text-white font-bold relative`}
                              title={m.user.displayName}
                              style={{ zIndex: 10 - i }}
                            >
                              {m.user.displayName.charAt(0).toUpperCase()}
                            </div>
                          ))}
                          {room.members.length > 4 && (
                            <div className="w-7 h-7 rounded-full bg-bg-elevated ring-2 ring-[#151c2c] flex items-center justify-center text-[9px] text-text-muted font-bold relative z-0">
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
