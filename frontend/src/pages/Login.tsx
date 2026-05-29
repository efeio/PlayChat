import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ThemeToggle } from '../components/ui/ThemeToggle';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      /* error is set in context */
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-bg-base relative overflow-hidden">
      {/* Theme toggle */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Animated background orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-accent-primary/10 blur-[120px] animate-float" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-accent-secondary/8 blur-[100px] animate-float" style={{ animationDelay: '1.5s' }} />

      {/* Left panel — branding */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center items-center p-12 relative">
        {/* Logo */}
        <div className="absolute top-8 left-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center shadow-lg shadow-accent-primary/25">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <span className="text-gradient font-bold text-xl tracking-tight" style={{ fontFamily: 'var(--font-family-display)' }}>PlayChat</span>
        </div>

        <div className="w-full max-w-lg flex flex-col items-start">
          {/* Decorative element */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-2 h-2 rounded-full bg-accent-primary animate-pulse-glow" />
            <div className="w-12 h-[2px] bg-gradient-to-r from-accent-primary to-transparent" />
          </div>

          <h2 className="text-5xl xl:text-6xl font-bold text-text-primary leading-[1.1] tracking-tight mb-6" style={{ fontFamily: 'var(--font-family-display)' }}>
            Oyna.<br />
            <span className="text-gradient">Sohbet et.</span><br />
            <span className="text-text-secondary">Birlikte kazan.</span>
          </h2>

          <p className="text-text-secondary text-lg leading-relaxed max-w-md">
            Odalara katıl, arkadaşlarını klasik oyunlara davet et ve anlık sohbetin keyfini çıkar. En iyi çok oyunculu platform.
          </p>

          {/* Game icons showcase */}
          <div className="flex items-center gap-4 mt-12">
            {[
              <svg key="ttt" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>,
              <svg key="c4" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="8" cy="8" r="2.5"/><circle cx="16" cy="8" r="2.5"/><circle cx="8" cy="16" r="2.5"/><circle cx="16" cy="16" r="2.5"/></svg>,
              <svg key="rps" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 12.5V10a2 2 0 0 0-2-2 2 2 0 0 0-2 2v1.4"/><path d="M14 11V9a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2"/><path d="M10 10.5V5a2 2 0 0 0-2-2 2 2 0 0 0-2 2v9"/><path d="M18 12a2 2 0 0 1 2 2v1a8 8 0 0 1-8 8h-2a8 8 0 0 1-4-1.5"/></svg>,
              <svg key="wordle" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="5" height="5" rx="1"/><rect x="9.5" y="5" width="5" height="5" rx="1"/><rect x="16" y="5" width="5" height="5" rx="1"/><rect x="3" y="14" width="5" height="5" rx="1"/><rect x="9.5" y="14" width="5" height="5" rx="1"/><rect x="16" y="14" width="5" height="5" rx="1"/></svg>,
            ].map((icon, i) => (
              <div
                key={i}
                className="w-12 h-12 rounded-xl bg-bg-surface border border-border-default flex items-center justify-center text-text-muted hover:text-accent-primary hover:border-accent-primary/30 hover:scale-110 transition-all duration-300 cursor-default"
              >
                {icon}
              </div>
            ))}
            <span className="text-text-muted text-sm ml-2">7 oyun ve artıyor</span>
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

          {/* Form card */}
          <div className="bg-bg-surface/80 backdrop-blur-xl p-8 sm:p-10 rounded-2xl border border-border-default shadow-2xl shadow-black/20 relative overflow-hidden">
            {/* Top glow line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent-primary/50 to-transparent" />

            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2 tracking-tight" style={{ fontFamily: 'var(--font-family-display)' }}>
              Tekrar hoş geldin
            </h1>
            <p className="text-text-secondary text-sm mb-8">
              Oturumuna devam etmek için giriş yap
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-xl bg-status-error/8 border border-status-error/20 p-4 flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-status-error/20 flex items-center justify-center shrink-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-status-error">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </div>
                  <p className="text-status-error text-sm">{error}</p>
                </div>
              )}

              <Input
                id="login-email"
                type="email"
                placeholder="E-posta adresi"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                id="login-password"
                type="password"
                placeholder="Şifre"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                      Giriş yapılıyor...
                    </span>
                  ) : 'Giriş Yap'}
                </Button>
              </div>

              <p className="text-center text-sm text-text-muted pt-6">
                Hesabın yok mu?{' '}
                <Link to="/register" className="text-accent-primary font-semibold hover:text-accent-secondary transition-colors">
                  Kayıt ol
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
