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
      <div className="relative h-44 overflow-hidden">
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
          <div className={`absolute top-2.5 left-2.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${badgeColors[store.badge] || 'bg-mandi-green text-black'}`}>
            {store.badge}
          </div>
        )}

        {/* Rating - top right */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
          <Star size={11} className="text-mandi-amber fill-mandi-amber" />
          <span className="text-white text-xs font-bold">{store.rating}</span>
        </div>

        {/* Closed overlay */}
        {(store.isOpen === false || store.status === 'closed') && (
          <div className="absolute inset-0 bg-black/65 flex items-center justify-center backdrop-blur-[1px]">
            <span className="bg-mandi-card/90 text-mandi-muted text-sm font-semibold px-4 py-1.5 rounded-full border border-mandi-border">
              Currently Closed
            </span>
          </div>
        )}

        {/* Store name & store picture overlaid at bottom of image */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/20 bg-mandi-surface shadow-md flex-shrink-0">
            <LazyImage
              src={store.image}
              alt={store.name}
              className="w-full h-full object-cover"
              containerClass="w-full h-full"
              fallbackText="No Image"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-white text-base leading-tight drop-shadow-sm truncate">{store.name}</h3>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin size={10} className="text-white/60" />
              <span className="text-white/60 text-xs truncate">{store.address}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom info strip */}
      <div className="px-4 py-3 flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-mandi-green/10 border border-mandi-green/20 px-2.5 py-1.5 rounded-lg">
          <Clock size={11} className="text-mandi-green" />
          <span className="text-mandi-green text-xs font-semibold">{store.deliveryTime}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-mandi-surface px-2.5 py-1.5 rounded-lg">
          <ShoppingBag size={11} className="text-mandi-muted" />
          <span className="text-mandi-muted text-xs">Min ₹{store.minOrder}</span>
        </div>
        <div className="ml-auto">
          <span className={`text-xs font-semibold ${store.deliveryCharge === 0 ? 'text-mandi-green' : 'text-mandi-muted'}`}>
            {store.deliveryCharge === 0 ? '🆓 Free delivery' : `₹${store.deliveryCharge} delivery`}
          </span>
        </div>
      </div>
    </div>
  );
}
