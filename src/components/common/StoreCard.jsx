import { Star, MapPin, ShoppingBag, Zap, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from '../../context/LocationContext';
import LazyImage from './LazyImage';

export default function StoreCard({ store }) {
  const navigate = useNavigate();
  const { setSelectedStore } = useLocation();

  const handleClick = () => {
    setSelectedStore(store);
    navigate(`/store/${store.id}`);
  };

  const badgeColors = {
    'Top Rated':    'bg-mandi-amber text-black',
    'Popular':      'bg-mandi-green text-black',
    'Fast Delivery':'bg-mandi-blue text-white',
    'New':          'bg-purple-500 text-white',
    'Trusted':      'bg-orange-500 text-black',
    'Organic':      'bg-emerald-600 text-white',
  };

  return (
    <div
      onClick={handleClick}
      className="card overflow-hidden group cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover hover:border-mandi-green/50"
    >
      {/* Cover image — taller, with overlaid info */}
      <div className="relative h-36 sm:h-44 overflow-hidden">
        <LazyImage
          src={store.coverImage}
          alt={store.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          containerClass="w-full h-full"
        />

        {/* Strong bottom gradient — info lives on top of image */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />

        {/* Badge - top left */}
        {store.badge && (
          <div className={`absolute top-2.5 left-2.5 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm ${badgeColors[store.badge] || 'bg-mandi-green text-black'}`}>
            {store.badge}
          </div>
        )}

        {/* Rating - top right: show rating if reviewed, otherwise show New / Unrated */}
        {store.totalRatings > 0 && store.rating > 0 ? (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm">
            <Star size={11} className="text-mandi-amber fill-mandi-amber" />
            <span className="text-white text-xs font-bold">{Number(store.rating).toFixed(1)}</span>
            {store.totalRatings && (
              <span className="text-white/60 text-[10px]">({store.totalRatings})</span>
            )}
          </div>
        ) : (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-full shadow-sm border border-emerald-500/25">
            <span className="w-1.5 h-1.5 rounded-full bg-mandi-green animate-pulse" />
            <span className="text-mandi-green text-[10px] font-extrabold uppercase tracking-wider">New</span>
            <span className="text-white/80 text-[10px] font-medium">• Unrated</span>
          </div>
        )}

        {/* Closed overlay */}
        {(store.isOpen === false || store.status === 'closed') && (
          <div className="absolute inset-0 bg-black/65 flex items-center justify-center backdrop-blur-[1px]">
            <span className="bg-mandi-card/90 text-mandi-muted text-xs sm:text-sm font-semibold px-3 py-1 rounded-full border border-mandi-border">
              Currently Closed
            </span>
          </div>
        )}

        {/* Store name & store picture overlaid at bottom of image */}
        <div className="absolute bottom-0 left-0 right-0 px-3.5 sm:px-4 pb-2.5 sm:pb-3 flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-white/20 bg-mandi-surface shadow-md flex-shrink-0">
            <LazyImage
              src={store.image}
              alt={store.name}
              className="w-full h-full object-cover"
              containerClass="w-full h-full"
              fallbackText="No Image"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-white text-sm sm:text-base leading-tight drop-shadow-sm truncate">{store.name}</h3>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin size={10} className="text-white/60 flex-shrink-0" />
              <span className="text-white/60 text-[11px] sm:text-xs truncate">{store.address}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom info strip */}
      <div className="px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 bg-mandi-green/10 border border-mandi-green/20 px-2 py-1 rounded-lg">
            <Clock size={11} className="text-mandi-green" />
            <span className="text-mandi-green text-[11px] sm:text-xs font-semibold">{store.deliveryTime}</span>
          </div>
          <div className="flex items-center gap-1 bg-mandi-surface px-2 py-1 rounded-lg">
            <ShoppingBag size={11} className="text-mandi-muted" />
            <span className="text-mandi-muted text-[11px] sm:text-xs">Min ₹{store.minOrder}</span>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-[11px] sm:text-xs font-semibold ${store.deliveryCharge === 0 ? 'text-mandi-green' : 'text-mandi-muted'}`}>
            {store.deliveryCharge === 0 ? '🆓 Free delivery' : `₹${store.deliveryCharge} delivery`}
          </span>
        </div>
      </div>
    </div>
  );
}
