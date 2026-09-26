import React from 'react';
import { ArrowUpRight, LogOut } from 'lucide-react';
import { Logo } from './Logo';

type WorkspaceHeaderProps = {
  workspace: 'driver' | 'workshop';
  name: string;
  onWebsite: () => void;
  onSignOut: () => void;
};

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({ workspace, name, onWebsite, onSignOut }) => (
  <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-deep/95 text-cream shadow-lg backdrop-blur-xl">
    <div className="mx-auto flex min-h-[68px] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" onClick={onWebsite} aria-label="Rolling Razors Customs home" className="shrink-0 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold">
          <Logo variant="light" size="sm" showTagline={false} />
        </button>
        <span className="hidden h-8 w-px bg-white/15 sm:block" aria-hidden="true" />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white">{workspace === 'driver' ? 'Driver Portal' : 'Workshop Hub'}</p>
          <p className="hidden truncate text-[11px] text-cream-muted sm:block">{name}</p>
        </div>
      </div>

      <nav aria-label={`${workspace === 'driver' ? 'Driver' : 'Workshop'} workspace actions`} className="flex shrink-0 items-center gap-2">
        <button type="button" onClick={onWebsite} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 px-3 text-xs font-semibold text-cream transition-colors hover:border-gold hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:px-4">
          <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          <span>Website</span>
        </button>
        <button type="button" onClick={onSignOut} aria-label="Sign out" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gold px-3 text-xs font-bold text-ink transition-colors hover:bg-gold-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream sm:px-4">
          <LogOut aria-hidden="true" className="h-4 w-4" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </nav>
    </div>
  </header>
);
