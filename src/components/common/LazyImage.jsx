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

  if (!hasValidSrc || (error && !fallbackSrc)) {
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
        <div className="absolute inset-0 bg-mandi-surface">
          <div className="w-full h-full shimmer" />
        </div>
      )}
      <img
        src={displaySrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => { setError(true); setLoaded(true); }}
        className={`transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
      />
    </div>
  );
}
