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
    <div className="min-h-screen flex bg-black">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center items-center p-12 bg-[#111111] border-r border-white/5 relative">
        <div className="absolute top-8 left-8 flex items-center gap-2.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-primary">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="text-text-primary font-semibold text-xl tracking-tight">PlayChat</span>
        </div>

        <div className="w-full max-w-md flex flex-col items-start">
          <div className="w-12 h-0.5 bg-text-primary mb-10" />

          <h2 className="text-5xl xl:text-6xl font-semibold text-text-primary leading-tight tracking-tight mb-6">
            Chat, play,<br />
            <span className="text-text-secondary">compete</span><br />
            together.
          </h2>

          <p className="text-text-secondary text-lg leading-relaxed">
            Join rooms, challenge friends to classic games, and chat in real time. Your next move is just a click away.
          </p>
        </div>
      </div>

      {/* Right panel (form) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-12 bg-black relative">
        <div className="w-full max-w-sm bg-[#161618]/80 backdrop-blur-2xl p-8 rounded-[2rem] border border-white/10 shadow-2xl">
          <h1 className="text-3xl lg:text-4xl font-semibold text-text-primary mb-2 tracking-tight">
            Create account.
          </h1>
          <p className="text-text-secondary text-sm mb-8">
            Join rooms, chat, and start playing.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
          {displayError && (
            <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-sm">{displayError}</p>
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

          <p className="text-[11px] text-text-muted">
            By registering, you agree to the Terms of Service and Privacy Policy.
          </p>

          <div className="pt-2">
            <Button type="submit" fullWidth disabled={isSubmitting}>
              {isSubmitting ? 'Creating account...' : 'CREATE ACCOUNT'}
            </Button>
          </div>

          <p className="text-center text-xs text-text-secondary pt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </form>
        </div>
      </div>
    </div>
  );
}
