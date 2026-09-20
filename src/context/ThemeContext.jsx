import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('mandi-theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mandi-theme', theme);
  }, [theme]);

  const toggleTheme = (e) => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';

    // Calculate click / button position for dynamic circular reveal center
    let x = window.innerWidth - 60;
    let y = 30;

    if (e && typeof e.clientX === 'number' && (e.clientX !== 0 || e.clientY !== 0)) {
      x = e.clientX;
      y = e.clientY;
    } else {
      const btn = document.getElementById('theme-toggle-btn');
      if (btn) {
        const rect = btn.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      }
    }

    document.documentElement.style.setProperty('--x', `${x}px`);
    document.documentElement.style.setProperty('--y', `${y}px`);

    if (typeof document.startViewTransition === 'function') {
      const transition = document.startViewTransition(() => {
        setTheme(nextTheme);
      });

      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      transition.ready.then(() => {
        // Both directions expand cleanly outward from the button position
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`
            ]
          },
          {
            duration: 850, // Smooth 850ms transition
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            pseudoElement: '::view-transition-new(root)'
          }
        );
      });
    } else {
      document.documentElement.classList.add('theme-transitioning');
      setTheme(nextTheme);
      setTimeout(() => {
        document.documentElement.classList.remove('theme-transitioning');
      }, 850);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
