import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function Register() {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const { register, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    if (password !== confirmPassword) {
      setLocalError('Şifreler eşleşmiyor');
      return;
    }

    if (password.length < 6) {
      setLocalError('Şifre en az 6 karakter olmalıdır');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(username, displayName, email, password);
      navigate('/dashboard');
    } catch {
      /* error is set in context */
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen flex bg-bg-base relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-accent-secondary/8 blur-[120px] animate-float" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-accent-primary/10 blur-[100px] animate-float" style={{ animationDelay: '1.5s' }} />

      {/* Left panel — branding */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center items-center p-12 relative">
        <div className="absolute top-8 left-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center shadow-lg shadow-accent-primary/25">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <span className="text-gradient font-bold text-xl tracking-tight" style={{ fontFamily: 'var(--font-family-display)' }}>PlayChat</span>
        </div>

        <div className="w-full max-w-lg flex flex-col items-start">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-2 h-2 rounded-full bg-accent-secondary animate-pulse-glow" />
            <div className="w-12 h-[2px] bg-gradient-to-r from-accent-secondary to-transparent" />
          </div>

          <h2 className="text-5xl xl:text-6xl font-bold text-white leading-[1.1] tracking-tight mb-6" style={{ fontFamily: 'var(--font-family-display)' }}>
            Arenaya<br />
            <span className="text-gradient">katıl.</span>
          </h2>

          <p className="text-text-secondary text-lg leading-relaxed max-w-md">
            Oyuncu profilini oluştur ve arkadaşlarına meydan oku. XOX, Connect Four, Taş Kağıt Makas ve daha fazlası seni bekliyor.
          </p>

          <div className="mt-12 flex items-center gap-6">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-family-display)' }}>7</span>
              <span className="text-xs text-text-muted">Oyun</span>
            </div>
            <div className="w-px h-8 bg-border-default" />
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-family-display)' }}>Anlık</span>
              <span className="text-xs text-text-muted">Çok Oyunculu</span>
            </div>
            <div className="w-px h-8 bg-border-default" />
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-family-display)' }}>Canlı</span>
              <span className="text-xs text-text-muted">Sohbet</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-8 lg:p-16 relative z-10">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <span className="text-gradient font-bold text-xl" style={{ fontFamily: 'var(--font-family-display)' }}>PlayChat</span>
          </div>

          <div className="bg-bg-surface/80 backdrop-blur-xl p-8 sm:p-10 rounded-2xl border border-border-default shadow-2xl shadow-black/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent-secondary/50 to-transparent" />

            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight" style={{ fontFamily: 'var(--font-family-display)' }}>
              Hesap oluştur
            </h1>
            <p className="text-text-secondary text-sm mb-8">
              Oyuncu profilini oluşturarak başla
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {displayError && (
                <div className="rounded-xl bg-status-error/8 border border-status-error/20 p-4 flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-status-error/20 flex items-center justify-center shrink-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-status-error">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </div>
                  <p className="text-status-error text-sm">{displayError}</p>
                </div>
              )}

              <Input
                id="register-display-name"
                placeholder="Görünen ad"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />

              <Input
                id="register-username"
                placeholder="@kullanıcıadı"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />

              <Input
                id="register-email"
                type="email"
                placeholder="E-posta adresi"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                id="register-password"
                type="password"
                placeholder="Şifre (en az 6 karakter)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Input
                id="register-confirm-password"
                type="password"
                placeholder="Şifre tekrar"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <div className="pt-4">
                <Button type="submit" fullWidth disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Hesap oluşturuluyor...
                    </span>
                  ) : 'Hesap Oluştur'}
                </Button>
              </div>

              <p className="text-center text-sm text-text-muted pt-4">
                Zaten hesabın var mı?{' '}
                <Link to="/login" className="text-accent-primary font-semibold hover:text-accent-secondary transition-colors">
                  Giriş yap
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
