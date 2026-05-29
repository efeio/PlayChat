import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Sidebar } from '../components/layout/Sidebar';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

import { api } from '../services/api';
import type { Room } from '../types/room.types';

type RoomType = 'PUBLIC' | 'PRIVATE';

export function CreateRoom() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<RoomType>('PUBLIC');
  const [password, setPassword] = useState('');
  const [maxMembers, setMaxMembers] = useState('10');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { token } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      addToast('error', 'Oda adı gereklidir');
      return;
    }

    if (type === 'PRIVATE' && !password.trim()) {
      addToast('error', 'Özel odalar için şifre gereklidir');
      return;
    }

    setIsSubmitting(true);

    try {
      const room = await api.post<Room>(
        '/api/rooms',
        {
          name: name.trim(),
          description: description.trim() || undefined,
          type,
          password: type === 'PRIVATE' ? password : undefined,
          maxMembers: parseInt(maxMembers) || 10,
        },
        token || undefined
      );
      addToast('success', 'Oda başarıyla oluşturuldu');
      navigate(`/room/${room.id}`);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen bg-bg-base">
      <Sidebar />

      <main className="flex-1 overflow-y-auto relative">
        <div className="h-14 flex items-center justify-between px-6 sm:px-8 border-b border-border-default/50 shrink-0 bg-bg-surface/40 backdrop-blur-xl sticky top-0 z-20">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="mr-4 p-2 rounded-xl hover:bg-accent-primary/5 transition-all duration-200 text-text-muted hover:text-text-primary cursor-pointer hover:scale-105"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="page-title text-[22px]">Oda Oluştur</h1>
          </div>
        </div>

        <div className="p-6 sm:p-8 max-w-xl mx-auto">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6 animate-fade-in">
            {/* Room name */}
            <Input
              id="room-name"
              label="Oda Adı"
              placeholder="Bir oda adı girin..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />

            {/* Description */}
            <div className="flex flex-col">
              <label htmlFor="room-desc" className="text-[13px] font-medium text-text-secondary mb-1.5">
                Açıklama (isteğe bağlı)
              </label>
              <textarea
                id="room-desc"
                placeholder="Bu oda ne hakkında?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-bg-base/70 border border-border-default rounded-xl text-text-primary text-sm placeholder-text-muted px-4 py-3 focus:outline-none focus:border-accent-primary/40 focus:ring-2 focus:ring-accent-primary/10 focus:shadow-[0_0_20px_rgba(139,92,246,0.08)] transition-all duration-250 resize-none"
              />
            </div>

            {/* Room type */}
            <div className="flex flex-col gap-2.5">
              <label className="text-[13px] font-medium text-text-secondary">Oda Türü</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType('PUBLIC')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all duration-250 cursor-pointer group ${
                    type === 'PUBLIC'
                      ? 'border-accent-primary/40 bg-accent-primary/5 shadow-[0_0_24px_rgba(139,92,246,0.1)]'
                      : 'border-border-default hover:border-accent-primary/20 bg-bg-card hover:bg-bg-elevated/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
                      type === 'PUBLIC' ? 'bg-accent-primary/15' : 'bg-bg-elevated group-hover:bg-accent-primary/8'
                    }`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={type === 'PUBLIC' ? 'text-accent-primary' : 'text-text-muted'}>
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                    </div>
                    <span className={`text-sm font-semibold ${type === 'PUBLIC' ? 'text-text-primary' : 'text-text-secondary'}`}>Herkese Açık</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setType('PRIVATE')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all duration-250 cursor-pointer group ${
                    type === 'PRIVATE'
                      ? 'border-accent-warm/30 bg-accent-warm/5 shadow-[0_0_24px_rgba(251,191,36,0.08)]'
                      : 'border-border-default hover:border-accent-warm/15 bg-bg-card hover:bg-bg-elevated/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
                      type === 'PRIVATE' ? 'bg-accent-warm/15' : 'bg-bg-elevated group-hover:bg-accent-warm/8'
                    }`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={type === 'PRIVATE' ? 'text-accent-warm' : 'text-text-muted'}>
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </div>
                    <span className={`text-sm font-semibold ${type === 'PRIVATE' ? 'text-text-primary' : 'text-text-secondary'}`}>Özel</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Password (only for private) */}
            {type === 'PRIVATE' && (
              <div className="animate-fade-in">
                <Input
                  id="room-password"
                  label="Oda Şifresi"
                  type="password"
                  placeholder="Bu oda için bir şifre belirleyin..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}

            {/* Max members — arcade buttons */}
            <div className="flex flex-col gap-3">
              <label className="text-[13px] font-medium text-text-secondary">
                Maks. Oyuncu
              </label>
              <div className="flex items-center gap-3">
                {['2', '4', '6', '10'].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setMaxMembers(val)}
                    className={`player-count-btn ${
                      maxMembers === val ? 'player-count-btn-active' : ''
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center gap-3 pt-4">
              <Button
                variant="ghost"
                type="button"
                onClick={() => navigate(-1)}
              >
                İptal
              </Button>
              <Button
                type="submit"
                disabled={!name.trim() || isSubmitting || (type === 'PRIVATE' && !password.trim())}
              >
                {isSubmitting ? 'Oluşturuluyor...' : 'Oda Oluştur'}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
