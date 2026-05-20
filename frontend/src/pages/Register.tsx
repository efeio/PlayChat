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
      setLocalError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
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
    <div className="min-h-screen flex bg-bg-base">
      {/* Left panel — branding */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center items-center p-12 bg-transparent relative">
        <div className="absolute top-8 left-8 flex items-center gap-2.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="url(#accentGradientReg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <defs>
              <linearGradient id="accentGradientReg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FACC15" />
                <stop offset="100%" stopColor="#A855F7" />
              </linearGradient>
            </defs>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="text-gradient font-semibold text-xl tracking-tight">PlayChat</span>
        </div>

        <div className="w-full max-w-md flex flex-col items-start">
          <div className="w-12 h-0.5 bg-border-focus mb-10" />

          <h2 className="text-5xl xl:text-6xl font-semibold text-white leading-tight tracking-tight mb-6">
            Chat, play,<br />
            <span className="text-text-secondary">compete</span><br />
            together.
          </h2>

          <p className="text-text-secondary text-lg leading-relaxed">
            Join rooms, challenge friends to classic games, and chat in real time. Your next move is just a click away.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-16 bg-transparent relative z-10 backdrop-blur-sm">
        <div className="w-full max-w-md animate-fade-in bg-[#1B132B]/80 backdrop-blur-2xl p-8 sm:p-10 rounded-[24px] border border-white/5 shadow-[0_0_80px_rgba(56,189,248,0.15),0_25px_50px_-12px_rgba(0,0,0,0.5)] relative">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3 tracking-tight">
            Create account.
          </h1>
          <p className="text-text-secondary text-base mb-10">
            Join rooms, chat, and start playing.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {displayError && (
              <div className="rounded-xl bg-status-error/10 border border-status-error/30 p-4">
                <p className="text-status-error text-sm">{displayError}</p>
              </div>
            )}

            <Input
              id="register-display-name"
              placeholder="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />

            <Input
              id="register-username"
              placeholder="@username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <Input
              id="register-email"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              id="register-password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Input
              id="register-confirm-password"
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <p className="text-xs text-text-muted pt-2">
              By registering, you agree to the Terms of Service and Privacy Policy.
            </p>

            <div className="pt-3">
              <Button type="submit" fullWidth disabled={isSubmitting}>
                {isSubmitting ? 'Creating account...' : 'Create account'}
              </Button>
            </div>

            <p className="text-center text-sm text-text-muted pt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-white font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
