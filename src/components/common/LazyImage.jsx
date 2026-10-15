import { useState, useEffect, useMemo } from 'react';
import { ImageOff } from 'lucide-react';

export default function LazyImage({
  src,
  alt,
  className = '',
  containerClass = '',
  width = 400,
  quality = 60,
  fallbackSrc = null,
  fallbackText = 'Image not available',
  category = null,
  priority = false,
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
    setLoaded(false);
  }, [src]);

  // Auto-optimize Unsplash images for payload reduction on mobile networks
  const optimizedSrc = useMemo(() => {
    if (src && typeof src === 'string' && src.includes('unsplash.com') && !src.includes('w=')) {
      return `${src}&auto=format&fit=crop&w=${width}&q=${quality}`;
    }
    return src;
  }, [src, width, quality]);

  const hasValidSrc = Boolean(src && typeof src === 'string' && src.trim().length > 0);

  // Category fallback configs
  const categoryStyles = {
    'cat-rice': { emoji: '🍚', bg: 'from-amber-500/20 via-orange-500/10 to-amber-700/20', text: 'Rice & Grains' },
    'cat-daal': { emoji: '🥣', bg: 'from-emerald-500/20 via-teal-500/10 to-emerald-700/20', text: 'Dals & Pulses' },
    'cat-grains': { emoji: '🥜', bg: 'from-purple-500/20 via-violet-500/10 to-indigo-700/20', text: 'Kirana Staples' },
    'cat-3': { emoji: '🌾', bg: 'from-orange-500/20 via-amber-500/10 to-orange-700/20', text: 'Atta & Flours' },
    'cat-2': { emoji: '🥛', bg: 'from-blue-500/20 via-sky-500/10 to-blue-700/20', text: 'Dairy & Eggs' },
    'cat-4': { emoji: '🍪', bg: 'from-yellow-500/20 via-amber-500/10 to-orange-700/20', text: 'Snacks & Poha' },
    'cat-5': { emoji: '🌶️', bg: 'from-rose-500/20 via-pink-500/10 to-red-700/20', text: 'Spices & Masala' },
    'cat-6': { emoji: '🧼', bg: 'from-cyan-500/20 via-teal-500/10 to-cyan-700/20', text: 'Home Cleaning' },
  };

  const currentCatStyle = category && categoryStyles[category] ? categoryStyles[category] : null;

  if (!hasValidSrc || (error && !fallbackSrc)) {
    if (currentCatStyle) {
      return (
        <div
          className={`relative flex flex-col items-center justify-center bg-gradient-to-br ${currentCatStyle.bg} text-mandi-text border border-mandi-border/40 select-none p-2 text-center overflow-hidden ${containerClass || ''} ${!containerClass ? className : ''}`}
          role="img"
          aria-label={alt || currentCatStyle.text}
        >
          <span className="text-3xl sm:text-4xl filter drop-shadow-sm mb-1 transform hover:scale-110 transition-transform">
            {currentCatStyle.emoji}
          </span>
          <span className="text-[10px] sm:text-xs font-bold text-mandi-text/90 leading-tight line-clamp-1">
            {alt || currentCatStyle.text}
          </span>
        </div>
      );
    }

    return (
      <div
        className={`relative flex flex-col items-center justify-center bg-gradient-to-b from-mandi-surface/95 to-mandi-card text-mandi-muted border border-mandi-border/40 select-none p-1.5 text-center overflow-hidden ${containerClass || ''} ${!containerClass ? className : ''}`}
        role="img"
        aria-label={alt || fallbackText}
        title={fallbackText}
      >
        <ImageOff className="opacity-45 shrink-0 w-4 h-4 sm:w-5 sm:h-5 max-w-[40%] max-h-[40%] mb-1" />
        <span className="text-[9px] sm:text-[11px] font-medium tracking-tight text-mandi-muted/80 leading-tight text-center px-1 line-clamp-2">
          {fallbackText}
        </span>
      </div>
    );
  }

  const displaySrc = error && fallbackSrc ? fallbackSrc : (optimizedSrc || src);

  return (
    <div className={`relative overflow-hidden ${containerClass}`}>
      {/* Shimmer skeleton while loading */}
      {!loaded && (
        <div className="absolute inset-0 bg-mandi-surface flex items-center justify-center">
          <div className="w-full h-full shimmer" />
          {currentCatStyle && (
            <span className="absolute text-2xl opacity-20 filter grayscale">
              {currentCatStyle.emoji}
            </span>
          )}
        </div>
      )}
      <img
        src={displaySrc}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => { setError(true); setLoaded(true); }}
        className={`transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
      />
    </div>
  );
}
