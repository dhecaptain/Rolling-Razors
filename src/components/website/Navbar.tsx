import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, Menu, X, UserRound, ShieldAlert, Car, ChevronDown, LogOut, PhoneCall, Home, LayoutDashboard } from 'lucide-react';
import { useApp, isStaff } from '../../context/AppContext';
import { Logo } from '../common/Logo';
import { BUSINESS_CONFIG } from '../../config/business';

const NAV_ITEMS = [
  ['Services', 'services-section'],
  ['Booking guide', 'booking-route'],
  ['Our work', 'portfolio-section'],
  ['Visit us', 'arrival-section'],
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
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    if (view !== 'website') return;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActiveSection(visible.target.id);
    }, { rootMargin: '-104px 0px -55% 0px', threshold: [0.15, 0.5] });
    NAV_ITEMS.forEach(([, id]) => document.getElementById(id) && observer.observe(document.getElementById(id)!));
    return () => observer.disconnect();
  }, [view]);

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

  // Close the auth dropdown with Escape or clicks outside of it.
  useEffect(() => {
    if (!authDropdownOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAuthDropdownOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (!(e.target as Element).closest('#user-profile-menu-btn, #auth-profile-dropdown')) setAuthDropdownOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onClick);
    };
  }, [authDropdownOpen]);

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
    if (currentUser && isStaff(currentUser.role)) {
      setAdminTab('overview');
      setView('admin_dashboard');
    } else {
      setCustomerTab('dashboard');
      setView('customer_dashboard');
    }
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-cream bg-ink-deep px-4 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between gap-4 px-1 lg:gap-8">
          <button type="button" onClick={goHome} aria-label="Rolling Razors Customs home" className="rr-header-brand flex min-h-11 shrink-0 items-center rounded-full px-1.5 text-left transition-colors hover:bg-white/5">
            <Logo variant="light" size="sm" showTagline={false} className="rr-header-logo" />
          </button>

          <nav aria-label="Primary navigation" className="hidden items-center gap-6 text-[12px] font-semibold text-cream lg:flex">
            {NAV_ITEMS.map(([label, id]) => (
              <button key={id} type="button" onClick={() => scrollToSection(id)} aria-current={activeSection === id ? 'true' : undefined} className={`relative min-h-11 transition-colors hover:text-gold ${activeSection === id ? 'text-gold' : ''}`}>
                {label}
                {activeSection === id && <motion.span layoutId="nav-active" className="absolute inset-x-0 bottom-1 h-0.5 bg-gold" transition={{ duration: 0.2 }} />}
              </button>
            ))}
          </nav>

          <div className="hidden items-center gap-2 sm:flex">
            {isLoggedIn && currentUser ? (
              <button id="header-active-dashboard-link-btn" type="button" onClick={() => setView(isStaff(currentUser.role) ? 'admin_dashboard' : 'customer_dashboard')} className="hidden min-h-11 items-center gap-2 rounded-full border border-cream px-4 py-2 text-[11px] font-bold text-cream transition-colors hover:border-gold hover:text-gold md:inline-flex">
                {isStaff(currentUser.role) ? <ShieldAlert aria-hidden="true" className="h-3.5 w-3.5" /> : <Car aria-hidden="true" className="h-3.5 w-3.5" />}
                {isStaff(currentUser.role) ? 'Workshop hub' : 'Driver garage'}
              </button>
            ) : (
              <>
                <button id="nav-driver-signin-btn" type="button" onClick={() => openAuth('customer')} className="hidden min-h-11 items-center gap-2 rounded-full border border-cream px-4 py-2 text-[12px] font-bold text-cream transition-colors hover:border-gold hover:text-gold sm:inline-flex"><UserRound aria-hidden="true" className="h-3.5 w-3.5" />Driver sign in</button>
                <button id="nav-workshop-staff-btn" type="button" onClick={() => openAuth('admin')} aria-label="Workshop staff sign in" title="Workshop staff sign in" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-cream text-cream transition-colors hover:border-gold hover:text-gold"><ShieldAlert aria-hidden="true" className="h-4 w-4" /></button>
              </>
            )}
            <button type="button" onClick={startBooking} className="rr-button-gold inline-flex h-11 items-center gap-2 px-5 text-[12px] font-black tracking-[.08em]">BOOK A FITTING <ArrowUpRightIcon /></button>
            {isLoggedIn && currentUser && (
              <div className="relative">
                <button id="user-profile-menu-btn" type="button" onClick={() => setAuthDropdownOpen((open) => !open)} aria-expanded={authDropdownOpen} aria-label="Account menu" className="flex h-11 items-center gap-2 rounded-full border border-cream px-2 text-[11px] text-cream">
                  <span className="grid h-6 w-6 place-items-center bg-gold text-[10px] font-black text-ink">{currentUser.name.slice(0, 1).toUpperCase()}</span>
                  <span className="hidden max-w-[80px] truncate xl:inline">{currentUser.name.split(' ')[0]}</span>
                  <ChevronDown aria-hidden="true" className="h-3.5 w-3.5 text-gold" />
                </button>
                {authDropdownOpen && (
                  <div id="auth-profile-dropdown" className="absolute right-0 top-12 w-56 border border-gold bg-ink p-2 shadow-2xl">
                    <p className="border-b border-cream px-3 py-2 text-xs font-bold text-cream">{currentUser.name}</p>
                    <button type="button" onClick={() => { setAuthDropdownOpen(false); if (isStaff(currentUser.role)) { setAdminTab('overview'); setView('admin_dashboard'); } else { setCustomerTab('dashboard'); setView('customer_dashboard'); } }} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs text-cream hover:bg-panel"><Car aria-hidden="true" className="h-3.5 w-3.5 text-gold" />Open dashboard</button>
                    <button id="navbar-signout-btn" type="button" onClick={() => { setAuthDropdownOpen(false); logout(); }} className="flex w-full items-center gap-2 border-t border-cream px-3 py-2.5 text-left text-xs font-bold text-rose-300 hover:bg-rose-500/10"><LogOut aria-hidden="true" className="h-3.5 w-3.5" />Sign out</button>
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
              className="grid h-11 w-11 place-items-center rounded-full border border-cream text-cream transition-colors hover:border-gold"
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
        className={`fixed bottom-0 left-0 top-0 z-[70] flex w-80 max-w-[85vw] flex-col bg-ink text-cream shadow-2xl outline-none transition-[transform,visibility] duration-300 ease-out lg:hidden ${mobileMenuOpen ? 'visible translate-x-0' : 'invisible -translate-x-full'}`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between border-b border-gold px-5 py-4">
          <button type="button" onClick={goHome} aria-label="Rolling Razors Customs home" className="flex items-center">
            <Logo variant="light" size="sm" showTagline={false} />
          </button>
          <button
            type="button"
            onClick={closeMobileMenu}
            aria-label="Close navigation menu"
            className="grid h-11 w-11 place-items-center rounded-full border border-cream text-cream transition-colors hover:border-gold hover:text-gold"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav aria-label="Mobile primary navigation" className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-[10px] font-black uppercase tracking-widest text-gold">Menu</p>
          <div className="space-y-1">
            <button type="button" onClick={goHome} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-cream transition-colors hover:bg-panel hover:text-white">
              <Home className="h-5 w-5 text-gold" />
              Home
            </button>
            {NAV_ITEMS.map(([label, id]) => (
              <button key={id} type="button" onClick={() => scrollToSection(id)} aria-current={activeSection === id && view === 'website' ? 'true' : undefined} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-cream transition-colors hover:bg-panel hover:text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                {label}
              </button>
            ))}
            <button type="button" onClick={() => { closeMobileMenu(); startBooking(); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-black text-ink transition-colors hover:bg-gold-hover bg-gold">
              <ArrowUpRight className="h-5 w-5" />
              Book a Fitting
            </button>
          </div>

          {/* Account Area */}
          {isLoggedIn && currentUser ? (
            <div className="mt-6 border-t border-cream pt-4">
              <p className="px-3 pb-2 text-[10px] font-black uppercase tracking-widest text-gold">Account</p>
              <div className="flex items-center gap-3 px-3 pb-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold text-sm font-black text-ink">{currentUser.name.slice(0, 1).toUpperCase()}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">{currentUser.name}</p>
                  <p className="truncate text-xs text-white/50">{currentUser.phone}</p>
                </div>
              </div>
              <div className="space-y-1">
                <button type="button" onClick={openDashboard} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-cream transition-colors hover:bg-panel hover:text-white">
                  <LayoutDashboard className="h-5 w-5 text-gold" />
                  {isStaff(currentUser.role) ? 'Workshop Hub' : 'Driver Garage'}
                </button>
                <button type="button" onClick={() => { closeMobileMenu(); logout(); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-rose-300 transition-colors hover:bg-rose-500/10">
                  <LogOut className="h-5 w-5" />
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-1.5 border-t border-cream pt-4">
              <button type="button" onClick={() => { closeMobileMenu(); openAuth('customer'); }} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-3 text-xs font-black uppercase tracking-wider text-ink transition-colors hover:bg-gold-hover">
                <UserRound className="h-4 w-4" /> Driver sign in
              </button>
              <button type="button" onClick={() => { closeMobileMenu(); openAuth('admin'); }} className="flex w-full items-center justify-center gap-2 rounded-xl border border-cream py-3 text-xs font-bold text-cream transition-colors hover:border-gold hover:text-gold">
                <ShieldAlert className="h-4 w-4" /> Workshop staff
              </button>
              <a href={BUSINESS_CONFIG.phone.telLink} className="flex w-full items-center justify-center gap-2 rounded-xl border border-gold py-3 text-xs font-bold text-gold transition-colors hover:bg-gold-hover hover:text-ink">
                <PhoneCall className="h-4 w-4" /> Call {BUSINESS_CONFIG.phone.formatted}
              </a>
            </div>
          )}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-cream px-5 py-3">
          <p className="text-[10px] text-white/40">© {new Date().getFullYear()} {BUSINESS_CONFIG.name}</p>
        </div>
      </aside>
    </>
  );
};

const ArrowUpRightIcon: React.FC = () => <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />;
