import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

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
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center px-16 xl:px-24 bg-bg-surface border-r border-border relative">
        <div className="absolute top-8 left-16 xl:left-24 flex items-center gap-2.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-primary">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="text-text-primary font-semibold text-xl tracking-tight">PlayChat</span>
        </div>

        <div className="w-12 h-0.5 bg-text-primary mb-10" />

        <h2 className="text-5xl xl:text-6xl font-semibold text-text-primary leading-tight tracking-tight mb-4">
          Chat, play,<br />
          <span className="text-text-secondary">compete</span><br />
          together.
        </h2>

        <p className="text-text-secondary text-lg leading-relaxed max-w-md">
          Join rooms, challenge friends to classic games, and chat in real time. Your next move is just a click away.
        </p>
      </div>

      {/* Right panel (form) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 xl:px-24">
        <h1 className="text-3xl lg:text-4xl font-semibold text-text-primary mb-2 tracking-tight">
          Welcome back.
        </h1>
        <p className="text-text-secondary text-sm mb-6">
          Pick up where you left off.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3 max-w-sm">
          {error && (
            <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <Input
            id="login-email"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            id="login-password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="pt-1">
            <Button type="submit" fullWidth disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'SIGN IN'}
            </Button>
          </div>

          <p className="text-center text-xs text-text-secondary pt-4">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-text-primary font-semibold hover:underline">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
