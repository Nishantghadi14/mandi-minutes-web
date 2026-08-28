import { Star, MapPin, ShoppingBag, Zap } from 'lucide-react';
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
    'Top Rated': 'bg-yellow-500 text-black',
    'Popular': 'bg-mandi-green text-black',
    'Fast Delivery': 'bg-blue-500 text-white',
    'New': 'bg-purple-500 text-white',
    'Trusted': 'bg-orange-500 text-black',
    'Organic': 'bg-emerald-600 text-white',
  };

  return (
    <div onClick={handleClick} className="card-hover overflow-hidden group">
      {/* Cover image */}
      <div className="relative h-36 overflow-hidden">
        <LazyImage
          src={store.coverImage || store.image}
          alt={store.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          containerClass="w-full h-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-mandi-card via-transparent to-transparent" />
        {store.badge && (
          <div className={`absolute top-2 left-2 text-xs font-bold px-2 py-1 rounded-full ${badgeColors[store.badge] || 'bg-mandi-green text-black'}`}>
            {store.badge}
          </div>
        )}
        {!store.isOpen && (
          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
            <span className="bg-mandi-card text-mandi-muted text-sm font-semibold px-3 py-1.5 rounded-full border border-mandi-border">Currently Closed</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-bold text-mandi-text text-base leading-tight flex-1 pr-2">{store.name}</h3>
          <div className="flex items-center gap-1 bg-mandi-green-muted px-2 py-0.5 rounded-lg flex-shrink-0">
            <Star size={12} className="text-mandi-green fill-mandi-green" />
            <span className="text-mandi-green text-xs font-semibold">{store.rating}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-mandi-muted text-xs mb-3">
          <MapPin size={11} />
          <span>{store.address}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-mandi-surface px-2.5 py-1.5 rounded-lg">
            <Zap size={12} className="text-mandi-green" />
            <span className="text-mandi-text text-xs font-semibold">{store.deliveryTime}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-mandi-surface px-2.5 py-1.5 rounded-lg">
            <ShoppingBag size={12} className="text-mandi-muted" />
            <span className="text-mandi-muted text-xs">Min ₹{store.minOrder}</span>
          </div>
          <div className="ml-auto">
            <span className={`text-xs font-medium ${store.deliveryCharge === 0 ? 'text-mandi-green' : 'text-mandi-muted'}`}>
              {store.deliveryCharge === 0 ? 'Free delivery' : `₹${store.deliveryCharge} delivery`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
