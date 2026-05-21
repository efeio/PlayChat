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
        <div className="h-16 flex items-center px-6 sm:px-8 border-b border-border-default shrink-0 bg-bg-surface/50 backdrop-blur-md sticky top-0 z-20">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 p-2 rounded-lg hover:bg-white/5 transition-colors text-text-muted hover:text-white cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="page-title">Oda Oluştur</h1>
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
                className="w-full bg-bg-base/60 border border-border-default rounded-xl text-white text-sm placeholder-text-muted px-4 py-3 focus:outline-none focus:border-accent-primary/50 focus:ring-2 focus:ring-accent-primary/10 transition-all duration-200 resize-none"
              />
            </div>

            {/* Room type */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-medium text-text-secondary">Oda Türü</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType('PUBLIC')}
                  className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                    type === 'PUBLIC'
                      ? 'border-accent-primary/50 bg-accent-primary/5'
                      : 'border-border-default hover:border-border-default/80 bg-bg-card/40'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={type === 'PUBLIC' ? 'text-accent-primary' : 'text-text-muted'}>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                    <span className={`text-sm font-medium ${type === 'PUBLIC' ? 'text-white' : 'text-text-secondary'}`}>Herkese Açık</span>
                  </div>
                  <p className="text-[11px] text-text-muted">Herkes katılabilir</p>
                </button>

                <button
                  type="button"
                  onClick={() => setType('PRIVATE')}
                  className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                    type === 'PRIVATE'
                      ? 'border-accent-primary/50 bg-accent-primary/5'
                      : 'border-border-default hover:border-border-default/80 bg-bg-card/40'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={type === 'PRIVATE' ? 'text-accent-primary' : 'text-text-muted'}>
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span className={`text-sm font-medium ${type === 'PRIVATE' ? 'text-white' : 'text-text-secondary'}`}>Özel</span>
                  </div>
                  <p className="text-[11px] text-text-muted">Şifre gerekli</p>
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

            {/* Max members */}
            <div className="flex flex-col gap-2">
              <label htmlFor="max-members" className="text-[13px] font-medium text-text-secondary">
                Maks. Oyuncu
              </label>
              <div className="flex items-center gap-3">
                {['2', '4', '6', '10'].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setMaxMembers(val)}
                    className={`w-12 h-10 rounded-lg border text-sm font-medium transition-all duration-200 cursor-pointer ${
                      maxMembers === val
                        ? 'border-accent-primary/50 bg-accent-primary/10 text-white'
                        : 'border-border-default bg-bg-card/40 text-text-muted hover:text-text-secondary'
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
