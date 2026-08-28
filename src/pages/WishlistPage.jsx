import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import ProductCard from '../components/common/ProductCard';
import { Heart, Package, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function WishlistPage() {
  const { user, openAuthModal } = useAuth();
  const { products } = useData();

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <Heart size={48} className="text-mandi-subtle mx-auto mb-4" />
        <h2 className="text-mandi-text font-bold text-2xl mb-2">Login Required</h2>
        <p className="text-mandi-muted text-sm mb-6">Please log in to view your wishlisted items</p>
        <button onClick={() => openAuthModal('login')} className="btn-primary">Login Now</button>
      </div>
    );
  }

  const wishlistedProducts = products.filter(p => user.wishlist?.includes(p.id));

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="flex items-center gap-2 mb-6">
        <Heart size={24} className="text-red-500 fill-red-500" />
        <h1 className="text-mandi-text font-black text-2xl">My Favourites ({wishlistedProducts.length})</h1>
      </div>

      {wishlistedProducts.length === 0 ? (
        <div className="card p-12 text-center max-w-md mx-auto">
          <Heart size={40} className="text-mandi-subtle mx-auto mb-3" />
          <h2 className="text-mandi-text font-bold text-lg mb-1">No wishlist items</h2>
          <p className="text-mandi-muted text-sm mb-6">Save your favorite grocery items by tapping the heart icon!</p>
          <Link to="/" className="btn-primary inline-flex items-center gap-2">Explore Products <ArrowRight size={16} /></Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {wishlistedProducts.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
