import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Home, Search, ShoppingBag, ArrowLeft } from 'lucide-react';
import { getAppHomePath } from '../utils/platform';

export default function NotFoundPage() {
  const homePath = getAppHomePath();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <Helmet>
        <title>Page Not Found (404) — Mandi Minutes</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <div className="card p-8 sm:p-12 max-w-lg w-full text-center shadow-card animate-fade-in border-mandi-border">
        <div className="w-20 h-20 bg-mandi-green/10 border border-mandi-green/30 rounded-3xl flex items-center justify-center mx-auto mb-6 text-mandi-green">
          <ShoppingBag size={40} />
        </div>

        <span className="badge-green text-xs font-bold px-3 py-1 mb-3 inline-block">
          Error 404
        </span>

        <h1 className="text-2xl sm:text-3xl font-black text-mandi-text mb-3">
          Page Not Found
        </h1>

        <p className="text-mandi-muted text-sm sm:text-base mb-8 max-w-sm mx-auto leading-relaxed">
          Looks like this grocery aisle doesn't exist or has moved. Let's get you back to shopping fresh produce!
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to={homePath}
            className="btn-primary py-3 px-6 text-sm font-bold flex items-center justify-center gap-2 shadow-lg"
          >
            <Home size={16} />
            <span>Go to Home</span>
          </Link>
          <Link
            to="/search"
            className="btn-outline py-3 px-6 text-sm font-semibold flex items-center justify-center gap-2"
          >
            <Search size={16} />
            <span>Search Products</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
