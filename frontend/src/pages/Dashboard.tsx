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
    <div className="flex h-screen bg-black">
      <Sidebar />

      <main className="flex-1 overflow-y-auto bg-black">
        {/* Header */}
        <div className="h-14 sm:h-16 flex items-center justify-between px-4 sm:px-8 border-b border-white/5 shrink-0">
          <h1 className="text-lg sm:text-xl font-semibold text-white">Rooms</h1>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-white text-black font-semibold rounded-full px-6 py-3 hover:scale-[1.02] hover:bg-gray-100 transition-all duration-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="hidden sm:inline">Create Room</span>
            <span className="sm:hidden">Create</span>
          </button>
        </div>

        <div className="p-4 sm:p-8">
          {/* Create room modal */}
          {showCreate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
              <div className="w-full max-w-lg bg-[#1a1a1a] border border-white/20 rounded-3xl p-10 shadow-2xl flex flex-col gap-8">
                <h2 className="text-2xl font-bold text-white">Create Room</h2>

                <input
                  id="room-name"
                  placeholder="Room name"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
                  autoFocus
                  className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-white text-base placeholder-zinc-500 focus:outline-none focus:border-white/40 focus:bg-white/[0.15] transition-all duration-200"
                />

                <div className="flex justify-end gap-3 w-full">
                  <button
                    onClick={() => setShowCreate(false)}
                    className="bg-transparent text-zinc-400 font-semibold rounded-full px-8 py-3.5 hover:text-white hover:bg-white/5 transition-all border border-white/20"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateRoom}
                    disabled={!newRoomName.trim()}
                    className="bg-white text-black font-bold rounded-full px-8 py-3.5 hover:scale-[1.02] hover:bg-gray-100 transition-all duration-200 shadow-[0_0_30px_rgba(255,255,255,0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <RoomCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && rooms.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-bg-surface border border-border flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <p className="text-text-secondary text-sm mb-1">No rooms yet</p>
              <p className="text-text-muted text-xs">Create a room to get started!</p>
            </div>
          )}

          {/* Room grid */}
          {!isLoading && rooms.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl mx-auto p-8">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="flex flex-col justify-between bg-[#1a1a1a] border border-white/10 rounded-3xl p-8 transition-all duration-200 hover:bg-[#222] hover:border-white/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]"
                >
                  <div>
                    <div className="flex items-start justify-between mb-5">
                      <div>
                        <h3 className="text-2xl font-bold tracking-tight text-white">
                          {room.name}
                        </h3>
                        <p className="text-sm text-zinc-500 mt-3">
                          {room.members.length}/{room.maxMembers} members
                        </p>
                      </div>
                      {room.games && room.games.length > 0 && (
                        <span className="text-[10px] px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-semibold">
                          LIVE
                        </span>
                      )}
                    </div>

                    {/* Members preview */}
                    <div className="flex -space-x-2 mb-8">
                      {room.members.slice(0, 5).map((m) => (
                        <div
                          key={m.id}
                          className="w-9 h-9 rounded-full bg-white/10 border-2 border-[#1a1a1a] flex items-center justify-center text-xs text-zinc-300 font-semibold"
                          title={m.user.displayName}
                        >
                          {m.user.displayName.charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {room.members.length > 5 && (
                        <div className="w-9 h-9 rounded-full bg-white/10 border-2 border-[#1a1a1a] flex items-center justify-center text-xs text-zinc-500 font-semibold">
                          +{room.members.length - 5}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/room/${room.id}`)}
                    className="w-full py-4 rounded-full bg-white text-black font-bold hover:scale-[1.02] hover:bg-gray-100 text-center transition-all duration-200 shadow-[0_0_30px_rgba(255,255,255,0.15)]"
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
