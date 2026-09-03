// @ts-nocheck
import React from "react";
interface EBState { hasError: boolean; error?: Error }
export class ErrorBoundary extends React.Component<any, EBState> {
  state: EBState = { hasError: false };
  static getDerivedStateFromError(error: Error): EBState { return { hasError: true, error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) { console.error("ErrorBoundary:", error, info); }
  render() {
    if ((this.state as EBState).hasError) return (
      <div className="min-h-screen bg-[#073B32] text-white flex items-center justify-center p-6">
        <div className="max-w-md bg-[#0B4035] border border-rose-500/40 rounded-2xl p-6 text-center space-y-3">
          <h2 className="font-black text-lg">Something went wrong</h2>
          <p className="text-sm text-white/70">{(this.state as EBState).error?.message || "An unexpected error occurred."}</p>
          <button onClick={() => location.reload()} className="w-full py-2.5 rounded-xl bg-[#D6A62E] text-[#073B32] font-black text-xs">Reload Page</button>
        </div>
      </div>
    );
    return (this.props as any).children;
  }
}
