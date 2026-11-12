import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

const ThemeContext = createContext(null);

const applyThemeToDOM = (themeName) => {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', themeName);
  document.documentElement.classList.toggle('dark', themeName === 'dark');
  document.documentElement.classList.toggle('light', themeName === 'light');
  try {
    localStorage.setItem('mandi-theme', themeName);
  } catch {
    // Ignore storage errors in restricted contexts
  }

  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', themeName === 'dark' ? '#0a0e17' : '#EEF3F8');
  }
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return (typeof localStorage !== 'undefined' && localStorage.getItem('mandi-theme')) || 'dark';
  });

  const isTransitioningRef = useRef(false);

  // Sync initial and external theme changes to the DOM immediately
  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  const toggleTheme = (e) => {
    if (isTransitioningRef.current) return;
    const nextTheme = theme === 'dark' ? 'light' : 'dark';

    // 1. Determine origin coordinates (x, y) for circular reveal ripple
    let x = typeof window !== 'undefined' ? window.innerWidth / 2 : 0;
    let y = typeof window !== 'undefined' ? window.innerHeight / 2 : 0;

    const target =
      (e && e.currentTarget) ||
      (e && e.target) ||
      (typeof document !== 'undefined' && document.getElementById('theme-toggle-btn'));

    if (target && typeof target.getBoundingClientRect === 'function') {
      const rect = target.getBoundingClientRect();
      x = Math.round(rect.left + rect.width / 2);
      y = Math.round(rect.top + rect.height / 2);
    } else if (e && typeof e.clientX === 'number' && (e.clientX !== 0 || e.clientY !== 0)) {
      x = Math.round(e.clientX);
      y = Math.round(e.clientY);
    }

    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--x', `${x}px`);
      document.documentElement.style.setProperty('--y', `${y}px`);
    }

    // 2. If View Transitions API is supported, run GPU-accelerated circular reveal
    const supportsViewTransition =
      typeof document !== 'undefined' &&
      typeof document.startViewTransition === 'function' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (supportsViewTransition) {
      isTransitioningRef.current = true;

      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      try {
        const transition = document.startViewTransition(() => {
          // Synchronously commit DOM changes so the view transition snapshot
          // captures the finished new theme without tearing or deferred effect lag
          flushSync(() => {
            applyThemeToDOM(nextTheme);
            setTheme(nextTheme);
          });
        });

        transition.ready.then(() => {
          const anim = document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${endRadius}px at ${x}px ${y}px)`
              ]
            },
            {
              duration: 380,
              easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
              pseudoElement: '::view-transition-new(root)'
            }
          );

          anim.onfinish = () => {
            isTransitioningRef.current = false;
          };
          anim.oncancel = () => {
            isTransitioningRef.current = false;
          };
        }).catch(() => {
          isTransitioningRef.current = false;
        });

        transition.finished.finally(() => {
          isTransitioningRef.current = false;
        });
      } catch {
        // Safe synchronous fallback if startViewTransition throws
        applyThemeToDOM(nextTheme);
        setTheme(nextTheme);
        isTransitioningRef.current = false;
      }
    } else {
      // Instant synchronous fallback for unsupported browsers
      applyThemeToDOM(nextTheme);
      setTheme(nextTheme);
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
