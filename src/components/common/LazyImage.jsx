import { useState, useEffect, useMemo } from 'react';

export default function LazyImage({
  src,
  alt,
  className = '',
  containerClass = '',
  width = 400,
  quality = 60,
  fallbackSrc = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=60'
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
    setLoaded(false);
  }, [src]);

  // Auto-optimize Unsplash images for payload reduction on mobile networks
  const optimizedSrc = useMemo(() => {
    if (src && src.includes('unsplash.com') && !src.includes('w=')) {
      return `${src}&auto=format&fit=crop&w=${width}&q=${quality}`;
    }
    return src;
  }, [src, width, quality]);

  const displaySrc = error ? fallbackSrc : (optimizedSrc || src);

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
