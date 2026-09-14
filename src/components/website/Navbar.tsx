import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Menu, X, UserRound, ShieldAlert, Car, ChevronDown, LogOut, PhoneCall, Home, LayoutDashboard } from 'lucide-react';
import { useApp, canAccessAdmin } from '../../context/AppContext';
import { Logo } from '../common/Logo';
import { BUSINESS_CONFIG } from '../../config/business';

const NAV_ITEMS = [
  ['Services', 'services-section'],
  ['Build spec', 'spec-section'],
  ['How it works', 'booking-route'],
  ['Our work', 'portfolio-section'],
  ['Workshop', 'arrival-section'],
] as const;

export const Navbar: React.FC = () => {
  const {
    view,
    setView,
    setCustomerTab,
    setAdminTab,
    isLoggedIn,
    currentUser,
    openAuth,
    logout,
    setBookingWizardInitialServiceId,
  } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authDropdownOpen, setAuthDropdownOpen] = useState(false);

  // Close the sidebar with Escape and lock body scroll while it is open.
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileMenuOpen]);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const goHome = () => {
    closeMobileMenu();
    setView('website');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (id: string) => {
    closeMobileMenu();
    if (view !== 'website') {
      setView('website');
      window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 120);
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const startBooking = () => {
    setBookingWizardInitialServiceId(null);
    setView('booking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openDashboard = () => {
    closeMobileMenu();
    if (currentUser && canAccessAdmin(currentUser.role)) {
      setAdminTab('overview');
      setView('admin_dashboard');
    } else {
      setCustomerTab('dashboard');
      setView('customer_dashboard');
    }
  };

  return (
    <>
      <header className="fixed inset-x-0 top-3 z-40 px-3 sm:px-5">
        <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between gap-4 rounded-full border border-[#F5F1E8]/12 bg-[#052822]/88 px-3 shadow-[0_8px_30px_rgba(0,0,0,.16)] backdrop-blur-xl sm:px-4 lg:gap-6 lg:px-5">
          <button type="button" onClick={goHome} aria-label="Rolling Razors Customs home" className="rr-header-brand flex min-h-11 shrink-0 items-center rounded-full px-1.5 text-left transition-colors hover:bg-white/5">
            <Logo variant="light" size="sm" showTagline={false} className="rr-header-logo" />
          </button>

          <nav aria-label="Primary navigation" className="hidden items-center gap-6 text-[12px] font-semibold text-[#F5F1E8]/75 lg:flex">
            {NAV_ITEMS.map(([label, id]) => (
              <button key={id} type="button" onClick={() => scrollToSection(id)} className="min-h-11 transition-colors hover:text-[#D6A62E]">{label}</button>
            ))}
          </nav>

          <div className="hidden items-center gap-2 sm:flex">
            {isLoggedIn && currentUser ? (
              <button id="header-active-dashboard-link-btn" type="button" onClick={() => setView(canAccessAdmin(currentUser.role) ? 'admin_dashboard' : 'customer_dashboard')} className="hidden min-h-11 items-center gap-2 rounded-full border border-[#F5F1E8]/25 px-4 py-2 text-[11px] font-bold text-[#F5F1E8] transition-colors hover:border-[#D6A62E] hover:text-[#D6A62E] md:inline-flex">
                {canAccessAdmin(currentUser.role) ? <ShieldAlert aria-hidden="true" className="h-3.5 w-3.5" /> : <Car aria-hidden="true" className="h-3.5 w-3.5" />}
                {canAccessAdmin(currentUser.role) ? 'Workshop hub' : 'Driver garage'}
              </button>
            ) : (
              <>
                <button id="nav-driver-signin-btn" type="button" onClick={() => openAuth('customer')} className="hidden min-h-11 items-center gap-2 rounded-full border border-[#F5F1E8]/25 px-4 py-2 text-[12px] font-bold text-[#F5F1E8] transition-colors hover:border-[#D6A62E] hover:text-[#D6A62E] md:inline-flex"><UserRound aria-hidden="true" className="h-3.5 w-3.5" />Driver sign in</button>
                <button id="nav-workshop-staff-btn" type="button" onClick={() => openAuth('admin')} aria-label="Workshop staff sign in" title="Workshop staff sign in" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#F5F1E8]/15 text-[#F5F1E8]/65 transition-colors hover:border-[#D6A62E] hover:text-[#D6A62E]"><ShieldAlert aria-hidden="true" className="h-4 w-4" /></button>
              </>
            )}
            <button type="button" onClick={startBooking} className="rr-button-gold inline-flex h-11 items-center gap-2 px-5 text-[12px] font-black tracking-[.08em]">BOOK A FITTING <ArrowUpRightIcon /></button>
            {isLoggedIn && currentUser && (
              <div className="relative">
                <button id="user-profile-menu-btn" type="button" onClick={() => setAuthDropdownOpen((open) => !open)} aria-expanded={authDropdownOpen} aria-label="Account menu" className="flex h-11 items-center gap-2 rounded-full border border-[#F5F1E8]/15 px-2 text-[11px] text-[#F5F1E8]">
                  <span className="grid h-6 w-6 place-items-center bg-[#D6A62E] text-[10px] font-black text-[#073B32]">{currentUser.name.slice(0, 1).toUpperCase()}</span>
                  <span className="hidden max-w-[80px] truncate xl:inline">{currentUser.name.split(' ')[0]}</span>
                  <ChevronDown aria-hidden="true" className="h-3.5 w-3.5 text-[#D6A62E]" />
                </button>
                {authDropdownOpen && (
                  <div id="auth-profile-dropdown" className="absolute right-0 top-12 w-56 border border-[#D6A62E]/30 bg-[#073B32] p-2 shadow-2xl">
                    <p className="border-b border-[#F5F1E8]/10 px-3 py-2 text-xs font-bold text-[#F5F1E8]">{currentUser.name}</p>
                    <button type="button" onClick={() => { setAuthDropdownOpen(false); if (canAccessAdmin(currentUser.role)) { setAdminTab('overview'); setView('admin_dashboard'); } else { setCustomerTab('dashboard'); setView('customer_dashboard'); } }} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs text-[#F5F1E8]/85 hover:bg-[#0B4035]"><Car aria-hidden="true" className="h-3.5 w-3.5 text-[#D6A62E]" />Open dashboard</button>
                    <button id="navbar-signout-btn" type="button" onClick={() => { setAuthDropdownOpen(false); logout(); }} className="flex w-full items-center gap-2 border-t border-[#F5F1E8]/10 px-3 py-2.5 text-left text-xs font-bold text-rose-300 hover:bg-rose-500/10"><LogOut aria-hidden="true" className="h-3.5 w-3.5" />Sign out</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile control cluster */}
          <div className="flex items-center gap-2 lg:hidden">
            <button type="button" onClick={startBooking} className="rr-button-gold h-11 px-4 text-[12px] font-black uppercase">Book</button>
            <button
              id="mobile-menu-toggle-btn"
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation-sidebar"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="grid h-11 w-11 place-items-center rounded-full border border-[#F5F1E8]/20 text-[#F5F1E8] transition-colors hover:border-[#D6A62E]"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Backdrop */}
      <div
        onClick={closeMobileMenu}
        className={`fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${mobileMenuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        aria-hidden="true"
      />

      {/* Mobile Slide-in Sidebar */}
      <aside
        id="mobile-navigation-sidebar"
        aria-label="Mobile navigation"
        aria-hidden={!mobileMenuOpen}
        className={`fixed bottom-0 left-0 top-0 z-[70] flex w-80 max-w-[85vw] flex-col bg-[#073B32] text-[#F5F1E8] shadow-2xl outline-none transition-[transform,visibility] duration-300 ease-out lg:hidden ${mobileMenuOpen ? 'visible translate-x-0' : 'invisible -translate-x-full'}`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between border-b border-[#D6A62E]/25 px-5 py-4">
          <button type="button" onClick={goHome} aria-label="Rolling Razors Customs home" className="flex items-center">
            <Logo variant="light" size="sm" showTagline={false} />
          </button>
          <button
            type="button"
            onClick={closeMobileMenu}
            aria-label="Close navigation menu"
            className="grid h-11 w-11 place-items-center rounded-full border border-[#F5F1E8]/20 text-[#F5F1E8] transition-colors hover:border-[#D6A62E] hover:text-[#D6A62E]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav aria-label="Mobile primary navigation" className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-[10px] font-black uppercase tracking-widest text-[#D6A62E]">Menu</p>
          <div className="space-y-1">
            <button type="button" onClick={goHome} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-[#F5F1E8]/90 transition-colors hover:bg-[#0B4035] hover:text-white">
              <Home className="h-5 w-5 text-[#D6A62E]" />
              Home
            </button>
            {NAV_ITEMS.map(([label, id]) => (
              <button key={id} type="button" onClick={() => scrollToSection(id)} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-[#F5F1E8]/90 transition-colors hover:bg-[#0B4035] hover:text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-[#D6A62E]/70" />
                {label}
              </button>
            ))}
            <button type="button" onClick={() => { closeMobileMenu(); startBooking(); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-black text-[#073B32] transition-colors hover:bg-[#D6A62E] bg-[#D6A62E]/90">
              <ArrowUpRight className="h-5 w-5" />
              Book a Fitting
            </button>
          </div>

          {/* Account Area */}
          {isLoggedIn && currentUser ? (
            <div className="mt-6 border-t border-[#F5F1E8]/10 pt-4">
              <p className="px-3 pb-2 text-[10px] font-black uppercase tracking-widest text-[#D6A62E]">Account</p>
              <div className="flex items-center gap-3 px-3 pb-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#D6A62E] text-sm font-black text-[#073B32]">{currentUser.name.slice(0, 1).toUpperCase()}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">{currentUser.name}</p>
                  <p className="truncate text-xs text-white/50">{currentUser.phone}</p>
                </div>
              </div>
              <div className="space-y-1">
                <button type="button" onClick={openDashboard} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-[#F5F1E8]/90 transition-colors hover:bg-[#0B4035] hover:text-white">
                  <LayoutDashboard className="h-5 w-5 text-[#D6A62E]" />
                  {canAccessAdmin(currentUser.role) ? 'Workshop Hub' : 'Driver Garage'}
                </button>
                <button type="button" onClick={() => { closeMobileMenu(); logout(); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-rose-300 transition-colors hover:bg-rose-500/10">
                  <LogOut className="h-5 w-5" />
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-1.5 border-t border-[#F5F1E8]/10 pt-4">
              <button type="button" onClick={() => { closeMobileMenu(); openAuth('customer'); }} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#D6A62E] py-3 text-xs font-black uppercase tracking-wider text-[#073B32] transition-colors hover:bg-[#c39626]">
                <UserRound className="h-4 w-4" /> Driver sign in
              </button>
              <button type="button" onClick={() => { closeMobileMenu(); openAuth('admin'); }} className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#F5F1E8]/20 py-3 text-xs font-bold text-[#F5F1E8] transition-colors hover:border-[#D6A62E] hover:text-[#D6A62E]">
                <ShieldAlert className="h-4 w-4" /> Workshop staff
              </button>
              <a href={BUSINESS_CONFIG.phone.telLink} className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#D6A62E]/40 py-3 text-xs font-bold text-[#D6A62E] transition-colors hover:bg-[#D6A62E] hover:text-[#073B32]">
                <PhoneCall className="h-4 w-4" /> Call {BUSINESS_CONFIG.phone.formatted}
              </a>
            </div>
          )}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-[#F5F1E8]/10 px-5 py-3">
          <p className="text-[10px] text-white/40">© {new Date().getFullYear()} {BUSINESS_CONFIG.name}</p>
        </div>
      </aside>
    </>
  );
};

const ArrowUpRightIcon: React.FC = () => <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />;