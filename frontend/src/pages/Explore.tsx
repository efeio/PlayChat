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
  const abortRef = useRef<AbortController | null>(null);

  const fetchRooms = useCallback(async () => {
    if (!token) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const data = await api.get<Room[]>('/api/rooms', token);
      if (!controller.signal.aborted) {
        setRooms(data);
        setFilteredRooms(data);
      }
    } catch {
      if (!controller.signal.aborted) {
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
    const interval = setInterval(fetchRooms, 10000);
    return () => {
      clearInterval(interval);
      abortRef.current?.abort();
    };
  }, [fetchRooms]);

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
        <div className="h-14 flex items-center justify-between px-6 sm:px-8 border-b border-border-default/50 shrink-0 bg-bg-surface/40 backdrop-blur-xl sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <h1 className="page-title text-[22px]">Keşfet</h1>
            <span className="text-text-muted text-[13px] hidden sm:inline font-medium">
              {filteredRooms.length} oda mevcut
            </span>
          </div>
          {filteredRooms.length > 0 && (
            <div className="flex items-center gap-2">
              <Button onClick={() => navigate('/create-room')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span className="hidden sm:inline">Oda Oluştur</span>
              </Button>
            </div>
          )}
        </div>

        <div className="p-6 sm:p-8">
          {/* Search bar */}
          <div className="max-w-md mb-8">
            <div className="relative group">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent-primary transition-colors duration-200"
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

          {/* Empty state — gaming themed */}
          {!isLoading && filteredRooms.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 animate-fade-in">
              <div className="relative">
                <div className="w-24 h-24 rounded-3xl bg-accent-primary/8 border border-accent-primary/12 flex items-center justify-center">
                  {searchQuery ? (
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent-primary">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  ) : (
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent-primary">
                      <polygon points="3 11 22 2 13 21 11 13 3 11" />
                    </svg>
                  )}
                </div>
              </div>
              <div className="text-center">
                <p className="text-text-primary text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-family-display)' }}>
                  {searchQuery ? 'Oda bulunamadı' : 'Henüz açık oda yok'}
                </p>
                <p className="text-text-muted text-sm max-w-xs">
                  {searchQuery
                    ? 'Farklı bir arama terimi deneyin'
                    : 'İlk odayı sen oluştur ve oyuncuları topla'}
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
                  'from-violet-500 to-purple-600',
                  'from-emerald-400 to-teal-500',
                  'from-cyan-400 to-blue-500',
                  'from-amber-400 to-orange-500',
                  'from-pink-400 to-rose-500',
                  'from-indigo-400 to-violet-500',
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
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center text-text-inverse text-sm font-bold shrink-0 shadow-lg relative`}>
                            {room.name.charAt(0).toUpperCase()}
                            {room.type === 'PRIVATE' && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-bg-card border border-accent-warm/30 flex items-center justify-center">
                                <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" className="text-accent-warm">
                                  <rect x="3" y="11" width="18" height="11" rx="2" />
                                  <path d="M7 11V7a5 5 0 0 1 10 0v4" fill="none" stroke="currentColor" strokeWidth="3" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="card-title text-[15px] group-hover:text-text-primary transition-colors truncate">
                              {room.name}
                            </h3>
                            <p className="text-text-muted text-[11px] mt-0.5">
                              {memberCount}/{room.maxMembers} oyuncu
                              {room.type === 'PRIVATE' && <span className="ml-1.5 text-accent-warm/80">· Şifreli</span>}
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
                              className={`w-7 h-7 rounded-full bg-gradient-to-br ${accent} ring-2 ring-bg-card flex items-center justify-center text-[9px] text-text-inverse font-bold`}
                              title={m.user.displayName}
                              style={{ zIndex: 10 - i }}
                            >
                              {m.user.displayName.charAt(0).toUpperCase()}
                            </div>
                          ))}
                          {memberCount > 5 && (
                            <div className="w-7 h-7 rounded-full bg-bg-elevated ring-2 ring-bg-card flex items-center justify-center text-[9px] text-text-muted font-bold">
                              +{memberCount - 5}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Game type badge */}
                      {hasActiveGame && room.games && (
                        <div className="mb-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent-primary/8 text-accent-primary text-[11px] font-medium border border-accent-primary/15">
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
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-label="Oda şifresi"
            onKeyDown={(e) => e.key === 'Escape' && setPasswordModal(null)}
            onClick={(e) => e.target === e.currentTarget && setPasswordModal(null)}
          >
            <div className="w-full max-w-sm mx-4 bg-bg-surface/90 backdrop-blur-2xl border border-accent-warm/15 rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.2)] p-6 animate-modal-in relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent-warm/40 to-transparent" />
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-accent-warm/8 border border-accent-warm/15 flex items-center justify-center mx-auto mb-3">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-warm">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <h3 className="text-text-primary font-bold text-lg" style={{ fontFamily: 'var(--font-family-display)' }}>{passwordModal.roomName}</h3>
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
