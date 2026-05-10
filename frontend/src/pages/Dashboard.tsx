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
          addToast('error', 'Failed to load rooms - timeout');
        }
      }, 5000);

      const data = await api.get<Room[]>('/api/rooms', token || undefined);
      clearTimeout(timeoutId);
      setRooms(data);
    } catch {
      addToast('error', 'Failed to load rooms');
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

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="h-14 sm:h-16 flex items-center justify-between px-4 sm:px-8 border-b border-border-subtle shrink-0">
          <h1 className="text-lg sm:text-xl font-bold text-white">Rooms</h1>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-white text-black font-semibold rounded-full hover:bg-neutral-200 active:scale-[0.98] transition-all duration-200 flex items-center gap-2 text-sm cursor-pointer"
            style={{ paddingLeft: '24px', paddingRight: '24px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="hidden sm:inline">Create Room</span>
            <span className="sm:hidden">Create</span>
          </button>
        </div>

        <div className="p-4 sm:p-8">
          {/* Create room modal — Glassmorphic */}
          {showCreate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="w-full max-w-md bg-bg-elevated border border-border-default rounded-3xl p-8 shadow-2xl flex flex-col gap-6 animate-modal-in">
                <h2 className="text-2xl font-bold text-white">Create Room</h2>

                <input
                  id="room-name"
                  placeholder="Room name"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
                  autoFocus
                  style={{ paddingTop: '16px', paddingBottom: '16px', paddingLeft: '20px', paddingRight: '20px' }}
                  className="w-full bg-input-bg border border-input-border rounded-xl text-white text-base placeholder-text-muted focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-border-strong transition-all duration-200"
                />

                <div className="flex justify-end gap-3 w-full">
                  <button
                    onClick={() => setShowCreate(false)}
                    className="bg-transparent text-text-secondary font-semibold rounded-full hover:text-white hover:bg-bg-card transition-all border border-border-default cursor-pointer"
                    style={{ paddingLeft: '32px', paddingRight: '32px', paddingTop: '12px', paddingBottom: '12px' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateRoom}
                    disabled={!newRoomName.trim()}
                    className="bg-white text-black font-semibold rounded-full hover:bg-neutral-200 active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    style={{ paddingLeft: '32px', paddingRight: '32px', paddingTop: '12px', paddingBottom: '12px' }}
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <RoomCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && rooms.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full w-full min-h-[400px] gap-4 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-bg-elevated border border-border-subtle flex items-center justify-center mb-2">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-faint">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <p className="text-text-secondary text-lg font-medium tracking-wide">No rooms yet</p>
              <p className="text-text-muted text-sm">Create a room to get started!</p>
            </div>
          )}

          {/* Room grid */}
          {!isLoading && rooms.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl mx-auto animate-fade-in">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="flex flex-col justify-between bg-bg-elevated border border-border-subtle rounded-3xl p-8 transition-all duration-300 hover:bg-bg-card hover:border-border-default hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <div>
                    <div className="flex items-start justify-between mb-5">
                      <div>
                        <h3 className="text-2xl font-bold tracking-tight text-white">
                          {room.name}
                        </h3>
                        <p className="text-sm text-text-secondary mt-3">
                          {room.members.length}/{room.maxMembers} members
                        </p>
                      </div>
                      {room.games && room.games.length > 0 && (
                        <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30 font-semibold animate-pulse-glow">
                          LIVE
                        </span>
                      )}
                    </div>

                    {/* Members preview */}
                    <div className="flex -space-x-2 mb-8">
                      {room.members.slice(0, 5).map((m) => (
                        <div
                          key={m.id}
                          className="w-9 h-9 rounded-full bg-bg-card border-2 border-bg-elevated flex items-center justify-center text-xs text-text-secondary font-semibold"
                          title={m.user.displayName}
                        >
                          {m.user.displayName.charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {room.members.length > 5 && (
                        <div className="w-9 h-9 rounded-full bg-bg-card border-2 border-bg-elevated flex items-center justify-center text-xs text-text-muted font-semibold">
                          +{room.members.length - 5}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/room/${room.id}`)}
                    className="w-full rounded-full bg-white text-black font-semibold hover:bg-neutral-200 active:scale-[0.98] text-center transition-all duration-200 text-sm cursor-pointer"
                    style={{ paddingTop: '14px', paddingBottom: '14px' }}
                  >
                    Join Room
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
