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

export function Explore() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [passwordModal, setPasswordModal] = useState<{ roomId: string; roomName: string } | null>(null);
  const [roomPassword, setRoomPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const { token, user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const fetchRooms = async () => {
    try {
      const data = await api.get<Room[]>('/api/rooms', token || undefined);
      setRooms(data);
      setFilteredRooms(data);
    } catch {
      addToast('error', 'Odalar yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 10000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredRooms(rooms);
      return;
    }
    const query = searchQuery.toLowerCase();
    setFilteredRooms(
      rooms.filter((room) =>
        room.name.toLowerCase().includes(query)
      )
    );
  }, [searchQuery, rooms]);

  const handleJoinRoom = (room: Room) => {
    const isMember = room.members?.some((m) => m.user.id === user?.id);
    if (room.type === 'PRIVATE' && !isMember) {
      setPasswordModal({ roomId: room.id, roomName: room.name });
      setRoomPassword('');
    } else {
      navigate(`/room/${room.id}`);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!passwordModal || !roomPassword.trim()) return;
    setIsVerifying(true);
    try {
      await api.post(`/api/rooms/${passwordModal.roomId}/verify`, { password: roomPassword }, token || undefined);
      navigate(`/room/${passwordModal.roomId}?password=${encodeURIComponent(roomPassword)}`);
    } catch {
      addToast('error', 'Şifre hatalı');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="flex h-screen bg-bg-base">
      <Sidebar />

      <main className="flex-1 overflow-y-auto relative">
        <div className="h-16 flex items-center justify-between px-6 sm:px-8 border-b border-border-default shrink-0 bg-bg-surface/50 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <h1 className="page-title">Keşfet</h1>
            <span className="text-text-muted text-sm hidden sm:inline">
              {filteredRooms.length} oda mevcut
            </span>
          </div>
          <Button onClick={() => navigate('/create-room')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="hidden sm:inline">Oda Oluştur</span>
          </Button>
        </div>

        <div className="p-6 sm:p-8">
          {/* Search bar */}
          <div className="max-w-md mb-8">
            <div className="relative">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <Input
                placeholder="Oda ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11"
              />
            </div>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <RoomCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && filteredRooms.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 animate-fade-in">
              <div className="w-20 h-20 rounded-2xl bg-bg-card border border-border-default flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-white text-lg font-semibold mb-1">
                  {searchQuery ? 'Oda bulunamadı' : 'Henüz açık oda yok'}
                </p>
                <p className="text-text-muted text-sm">
                  {searchQuery
                    ? 'Farklı bir arama terimi deneyin'
                    : 'İlk odayı sen oluştur'}
                </p>
              </div>
              {!searchQuery && (
                <Button onClick={() => navigate('/create-room')}>
                  İlk Odayı Oluştur
                </Button>
              )}
            </div>
          )}

          {/* Room grid */}
          {!isLoading && filteredRooms.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-fade-in">
              {filteredRooms.map((room, roomIndex) => {
                const accentColors = [
                  'from-indigo-500 to-purple-500',
                  'from-cyan-500 to-blue-500',
                  'from-emerald-500 to-teal-500',
                  'from-amber-500 to-orange-500',
                  'from-pink-500 to-rose-500',
                  'from-violet-500 to-fuchsia-500',
                ];
                const accent = accentColors[roomIndex % accentColors.length];
                const memberCount = room.members?.length || 0;
                const hasActiveGame = room.games && room.games.length > 0;

                return (
                  <div
                    key={room.id}
                    className="room-card p-6 flex flex-col justify-between min-h-[220px] group cursor-pointer"
                    onClick={() => handleJoinRoom(room)}
                  >
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-lg relative`}>
                            {room.name.charAt(0).toUpperCase()}
                            {room.type === 'PRIVATE' && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-bg-card border border-border-default flex items-center justify-center">
                                <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400">
                                  <rect x="3" y="11" width="18" height="11" rx="2" />
                                  <path d="M7 11V7a5 5 0 0 1 10 0v4" fill="none" stroke="currentColor" strokeWidth="3" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="card-title text-[15px] group-hover:text-white transition-colors truncate">
                              {room.name}
                            </h3>
                            <p className="text-text-muted text-[11px] mt-0.5">
                              {memberCount}/{room.maxMembers} oyuncu
                              {room.type === 'PRIVATE' && <span className="ml-1.5 text-amber-400/80">· Şifreli</span>}
                            </p>
                          </div>
                        </div>
                        {hasActiveGame && (
                          <span className="game-active-pill animate-pulse-glow">
                            <span className="w-1.5 h-1.5 rounded-full bg-status-online" />
                            Canlı
                          </span>
                        )}
                      </div>

                      {/* Members */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex -space-x-2">
                          {room.members.slice(0, 5).map((m, i) => (
                            <div
                              key={m.id || i}
                              className={`w-7 h-7 rounded-full bg-gradient-to-br ${accent} ring-2 ring-[#151c2c] flex items-center justify-center text-[9px] text-white font-bold`}
                              title={m.user.displayName}
                              style={{ zIndex: 10 - i }}
                            >
                              {m.user.displayName.charAt(0).toUpperCase()}
                            </div>
                          ))}
                          {memberCount > 5 && (
                            <div className="w-7 h-7 rounded-full bg-bg-elevated ring-2 ring-[#151c2c] flex items-center justify-center text-[9px] text-text-muted font-bold">
                              +{memberCount - 5}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Game type badge */}
                      {hasActiveGame && room.games && (
                        <div className="mb-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent-primary/10 text-accent-primary text-[11px] font-medium border border-accent-primary/20">
                            {room.games[0].gameType?.replace(/_/g, ' ') || room.games[0].type?.replace(/_/g, ' ')}
                          </span>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJoinRoom(room);
                      }}
                      fullWidth
                    >
                      {hasActiveGame ? 'İzle' : room.type === 'PRIVATE' && !room.members?.some((m) => m.user.id === user?.id) ? 'Şifre ile Katıl' : 'Odaya Katıl'}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Password Modal */}
        {passwordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-sm mx-4 bg-bg-card border border-border-default rounded-2xl shadow-2xl p-6">
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <h3 className="text-white font-semibold text-lg">{passwordModal.roomName}</h3>
                <p className="text-text-muted text-sm mt-1">Bu oda şifre korumalı</p>
              </div>
              <div className="space-y-4">
                <Input
                  type="password"
                  placeholder="Oda şifresi"
                  value={roomPassword}
                  onChange={(e) => setRoomPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                  autoComplete="new-password"
                  autoFocus
                />
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => setPasswordModal(null)}
                    className="flex-1"
                  >
                    İptal
                  </Button>
                  <Button
                    onClick={handlePasswordSubmit}
                    disabled={!roomPassword.trim() || isVerifying}
                    className="flex-1"
                  >
                    {isVerifying ? 'Doğrulanıyor...' : 'Katıl'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
