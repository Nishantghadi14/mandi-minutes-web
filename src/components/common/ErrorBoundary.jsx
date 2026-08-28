import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled Application Render Error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
          <div className="bg-mandi-card border border-mandi-border rounded-3xl p-8 max-w-lg w-full text-center shadow-card animate-fade-in">
            <div className="w-16 h-16 bg-red-950 bg-opacity-40 border border-red-800 rounded-2xl flex items-center justify-center mx-auto mb-5 text-red-400">
              <AlertTriangle size={32} />
            </div>

            <h2 className="text-2xl font-black text-mandi-text mb-2">
              Something went wrong
            </h2>
            <p className="text-mandi-muted text-sm mb-6">
              An unexpected error occurred while loading this section of Mandi Minutes.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="btn-primary py-3 px-6 text-sm font-bold flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} />
                Reload App
              </button>
              <button
                onClick={this.handleReset}
                className="btn-outline py-3 px-6 text-sm font-semibold flex items-center justify-center gap-2"
              >
                <Home size={16} />
                Return to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
