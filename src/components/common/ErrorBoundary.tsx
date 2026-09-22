import React, { Component, ErrorInfo, ReactNode } from "react";

interface EBProps {
  children: ReactNode;
}

interface EBState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<EBProps, EBState> {
  constructor(props: EBProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): EBState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, info);
  }

  handleTryAgain = () => {
    this.setState({ hasError: false, error: undefined });
  };

  handleResetState = () => {
    try {
      localStorage.removeItem('rr_services');
      localStorage.removeItem('rr_bookings');
      localStorage.removeItem('rr_work_orders');
      localStorage.removeItem('rr_customers');
      localStorage.removeItem('rr_staff');
      localStorage.removeItem('rr_invoices');
      localStorage.removeItem('rr_notifications');
      localStorage.removeItem('rr_vehicles');
      localStorage.removeItem('rr_visualizer_draft');
    } catch {}
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div id="error-boundary-screen" className="min-h-screen bg-ink text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-panel border border-rose-500/40 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="space-y-1">
              <h2 className="font-black text-lg text-cream">Something went wrong</h2>
              <p className="text-xs text-white/70">{this.state.error?.message || "An unexpected error occurred."}</p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button 
                id="error-boundary-retry-btn"
                onClick={this.handleTryAgain} 
                className="w-full py-2.5 rounded-xl bg-gold hover:bg-gold-hoverhover: text-ink font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Try Again
              </button>
              <button 
                id="error-boundary-reset-btn"
                onClick={this.handleResetState} 
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Clear Local Cache & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
