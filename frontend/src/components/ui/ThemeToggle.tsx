import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

function getInitialTheme(): 'dark' | 'light' {
  const stored = localStorage.getItem('playchat-theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return 'dark';
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('playchat-theme', theme);
  }, [theme]);

  const toggle = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  return (
    <button
      onClick={toggle}
      className="relative w-10 h-10 rounded-xl border border-accent-primary/15 bg-bg-card/60 backdrop-blur-md flex items-center justify-center cursor-pointer overflow-hidden transition-all duration-300 hover:border-accent-primary/40 hover:bg-accent-primary/5 hover:shadow-[0_0_20px_var(--glow-primary)] hover:scale-105 active:scale-95"
      aria-label={theme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'}
      title={theme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'}
    >
      <Sun
        size={18}
        className={`absolute text-amber-400 transition-all duration-500 ease-[cubic-bezier(0.68,-0.55,0.27,1.55)] ${
          theme === 'light'
            ? 'rotate-0 scale-100 opacity-100'
            : 'rotate-90 scale-0 opacity-0'
        }`}
      />
      <Moon
        size={18}
        className={`absolute text-accent-primary transition-all duration-500 ease-[cubic-bezier(0.68,-0.55,0.27,1.55)] ${
          theme === 'dark'
            ? 'rotate-0 scale-100 opacity-100'
            : '-rotate-90 scale-0 opacity-0'
        }`}
      />
    </button>
  );
}
