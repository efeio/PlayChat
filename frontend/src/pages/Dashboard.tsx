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
    <div className="flex h-screen">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="h-14 sm:h-16 flex items-center justify-between px-4 sm:px-8 border-b border-border shrink-0">
          <h1 className="text-lg sm:text-xl font-semibold text-text-primary">Rooms</h1>
          <Button onClick={() => setShowCreate(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="hidden sm:inline">Create Room</span>
            <span className="sm:hidden">Create</span>
          </Button>
        </div>

        <div className="p-4 sm:p-8">
          {/* Create room modal */}
          {showCreate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <div className="bg-bg-surface border border-border rounded-xl p-5 sm:p-6 w-full max-w-md space-y-4">
                <h2 className="text-base sm:text-lg font-semibold text-text-primary">Create Room</h2>

                <Input
                  id="room-name"
                  placeholder="Room name"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
                  autoFocus
                />

                <div className="flex justify-end gap-3">
                  <Button variant="outlined" onClick={() => setShowCreate(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateRoom} disabled={!newRoomName.trim()}>
                    Create
                  </Button>
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="bg-bg-surface border border-border rounded-xl p-5 flex flex-col gap-4 hover:border-text-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-text-primary font-semibold text-sm">
                        {room.name}
                      </h3>
                      <p className="text-text-muted text-xs mt-0.5">
                        {room.members.length}/{room.maxMembers} members
                      </p>
                    </div>
                    {room.games && room.games.length > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-green/10 text-accent-green border border-accent-green/20">
                        LIVE
                      </span>
                    )}
                  </div>

                  {/* Members preview */}
                  <div className="flex -space-x-2">
                    {room.members.slice(0, 5).map((m) => (
                      <div
                        key={m.id}
                        className="w-7 h-7 rounded-full bg-bg-elevated border-2 border-bg-surface flex items-center justify-center text-[10px] text-text-secondary font-medium"
                        title={m.user.displayName}
                      >
                        {m.user.displayName.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {room.members.length > 5 && (
                      <div className="w-7 h-7 rounded-full bg-bg-elevated border-2 border-bg-surface flex items-center justify-center text-[10px] text-text-muted">
                        +{room.members.length - 5}
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outlined"
                    onClick={() => navigate(`/room/${room.id}`)}
                    className="text-xs h-9"
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
