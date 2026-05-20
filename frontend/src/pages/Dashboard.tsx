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
    <div className="flex h-screen bg-transparent">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="h-14 sm:h-16 flex items-center justify-between px-4 sm:px-8 border-b border-border-default shrink-0 bg-transparent">
          <h1 className="page-title">Rooms</h1>
          <Button onClick={() => setShowCreate(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="hidden sm:inline">Create Room</span>
            <span className="sm:hidden">Create</span>
          </Button>
        </div>

        <div className="p-4 sm:p-8 relative z-10">
          {/* Create room modal */}
          {showCreate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay backdrop-blur-[4px] p-4">
              <div className="w-full max-w-md bg-bg-surface border border-border-default rounded-[12px] p-8 shadow-2xl flex flex-col gap-6 animate-modal-in">
                <h2 className="section-title">Create Room</h2>

                <Input
                  id="room-name"
                  placeholder="Room name"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
                  autoFocus
                />

                <div className="flex justify-end gap-3 w-full">
                  <Button variant="outlined" onClick={() => setShowCreate(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateRoom}
                    disabled={!newRoomName.trim()}
                  >
                    Create Room
                  </Button>
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
              <div className="w-16 h-16 rounded-full bg-bg-elevated border border-border-default flex items-center justify-center mb-2">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <p className="body-text text-lg">No rooms yet</p>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-4 px-6 py-3 rounded-xl border border-dashed border-purple-500/30 text-text-muted hover:border-purple-500/60 hover:text-white transition-all duration-200 cursor-pointer text-sm font-medium bg-[#1B132B]/40 hover:bg-[#1B132B]/60 backdrop-blur-sm"
              >
                + Create new room
              </button>
            </div>
          )}

          {/* Room grid */}
          {!isLoading && rooms.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl mx-auto animate-fade-in">
              <button
                onClick={() => setShowCreate(true)}
                className="flex flex-col items-center justify-center gap-3 bg-[#1B132B]/40 border border-dashed border-purple-500/30 text-text-muted hover:border-purple-500/60 hover:text-white hover:bg-[#1B132B]/60 backdrop-blur-sm transition-all duration-200 rounded-[12px] min-h-[220px] cursor-pointer"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span className="font-medium text-sm">Create new room</span>
              </button>

              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="room-card p-6 flex flex-col justify-between min-h-[220px] group hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(56,189,248,0.15)] hover:border-cyan-500/30 transition-all duration-300"
                >
                  <div>
                    <div className="flex items-start justify-between mb-5">
                      <div>
                        <h3 className="card-title group-hover:text-cyan-400 transition-colors">
                          {room.name}
                        </h3>
                      </div>
                      {room.games && room.games.length > 0 && (
                        <span className="game-active-pill animate-pulse-glow">
                          Active Game
                        </span>
                      )}
                    </div>

                    {/* Members preview */}
                    <div className="flex items-center gap-3 mb-8">
                      <div className="flex -space-x-2.5">
                        {room.members.slice(0, 5).map((m) => (
                          <div
                            key={m.id}
                            className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 ring-2 ring-[#1B132B] flex items-center justify-center text-[10px] text-white font-bold shadow-sm relative hover:z-20 hover:scale-110 transition-transform"
                            title={m.user.displayName}
                          >
                            {m.user.displayName.charAt(0).toUpperCase()}
                          </div>
                        ))}
                        {room.members.length > 5 && (
                          <div className="w-8 h-8 rounded-full bg-[#231840] ring-2 ring-[#1B132B] flex items-center justify-center text-[10px] text-text-muted font-bold shadow-sm relative z-10">
                            +{room.members.length - 5}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-text-muted font-medium">{room.members.length} {room.members.length === 1 ? 'Player' : 'Players'}</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => navigate(`/room/${room.id}`)}
                    fullWidth
                  >
                    Join Room
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
