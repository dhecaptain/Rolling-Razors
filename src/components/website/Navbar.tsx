import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Logo } from '../common/Logo';
import { BUSINESS_CONFIG } from '../../config/business';
import { 
  Calendar, 
  Menu, 
  X, 
  User, 
  ShieldAlert, 
  Car, 
  Phone, 
  Sparkles,
  ArrowRight,
  LogOut,
  ChevronDown
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    view, 
    setView, 
    role, 
    setCustomerTab, 
    setAdminTab,
    isLoggedIn, 
    currentUser, 
    openAuth,
    logout,
    unreadCount,
    setBookingWizardInitialServiceId
  } = useApp();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authDropdownOpen, setAuthDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    if (view !== 'website') {
      setView('website');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleStartBooking = () => {
    setBookingWizardInitialServiceId(null);
    setView('booking');
  };

  return (
    <header 
      id="main-navigation-bar"
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled 
          ? 'bg-[#073B32]/95 backdrop-blur-md shadow-xl border-b border-[#D6A62E]/20 py-3' 
          : 'bg-[#073B32]/80 backdrop-blur-sm border-b border-white/5 py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Brand Logo */}
          <Logo 
            variant="light" 
            size="md" 
            showTagline={true}
            onClick={() => { setView('website'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          />

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7">
            <button 
              id="nav-link-home"
              onClick={() => { setView('website'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`text-sm font-semibold transition-colors cursor-pointer ${view === 'website' ? 'text-[#D6A62E]' : 'text-[#F5F1E8]/90 hover:text-[#D6A62E]'}`}
            >
              Home
            </button>
            <button 
              id="nav-link-services"
              onClick={() => scrollToSection('services-section')}
              className="text-sm font-semibold text-[#F5F1E8]/90 hover:text-[#D6A62E] transition-colors cursor-pointer"
            >
              Services
            </button>
            <button 
              id="nav-link-portfolio"
              onClick={() => scrollToSection('portfolio-section')}
              className="text-sm font-semibold text-[#F5F1E8]/90 hover:text-[#D6A62E] transition-colors cursor-pointer"
            >
              Our Work
            </button>
            <button 
              id="nav-link-about"
              onClick={() => scrollToSection('why-choose-us-section')}
              className="text-sm font-semibold text-[#F5F1E8]/90 hover:text-[#D6A62E] transition-colors cursor-pointer"
            >
              About Us
            </button>
            <button 
              id="nav-link-how-it-works"
              onClick={() => scrollToSection('how-it-works-section')}
              className="text-sm font-semibold text-[#F5F1E8]/90 hover:text-[#D6A62E] transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button 
              id="nav-link-contact"
              onClick={() => scrollToSection('contact-location-section')}
              className="text-sm font-semibold text-[#F5F1E8]/90 hover:text-[#D6A62E] transition-colors cursor-pointer"
            >
              Contact
            </button>
          </nav>

          {/* Right Action Cluster & Role-Gated Access */}
          <div className="hidden sm:flex items-center gap-3">
            
            {/* Authenticated Dashboard Quick Link if Logged In */}
            {isLoggedIn && currentUser && (
              <button
                id="header-active-dashboard-link-btn"
                onClick={() => {
                  if (currentUser.role === 'admin') {
                    setView('admin_dashboard');
                  } else {
                    setView('customer_dashboard');
                  }
                }}
                className={`py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                  view === 'admin_dashboard' || view === 'customer_dashboard'
                    ? 'bg-[#D6A62E] text-[#073B32] border-[#D6A62E]'
                    : 'bg-[#0B4035] text-white border-white/10 hover:border-[#D6A62E]/50'
                }`}
              >
                {currentUser.role === 'admin' ? (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5 text-[#D6A62E]" />
                    <span>Workshop Admin Hub</span>
                  </>
                ) : (
                  <>
                    <Car className="w-3.5 h-3.5 text-[#D6A62E]" />
                    <span>My Driver Garage</span>
                  </>
                )}
              </button>
            )}

            {/* If NOT Logged In: Secure Entry Points */}
            {!isLoggedIn && (
              <div className="flex items-center gap-1.5">
                <button
                  id="nav-driver-signin-btn"
                  onClick={() => openAuth('customer')}
                  className="py-2 px-3 rounded-xl bg-[#0B4035] hover:bg-[#0e4e41] border border-white/10 hover:border-[#D6A62E]/40 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-[#D6A62E]" />
                  <span>Driver Sign In</span>
                </button>

                <button
                  id="nav-workshop-staff-btn"
                  onClick={() => openAuth('admin')}
                  title="Restricted workshop staff login"
                  className="py-2 px-2.5 rounded-xl bg-[#0B4035]/60 hover:bg-[#0B4035] border border-white/10 hover:border-[#D6A62E]/40 text-white/70 hover:text-white font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Staff</span>
                </button>
              </div>
            )}

            {/* Primary Action Button: Book a Service */}
            <button
              id="header-book-service-btn"
              onClick={handleStartBooking}
              className="py-2.5 px-4 sm:px-5 rounded-xl bg-[#D6A62E] hover:bg-[#c39626] text-[#073B32] font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md hover:shadow-lg transition-all transform hover:scale-[1.02] cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Service</span>
            </button>

            {/* User Profile / Login Dropdown */}
            {isLoggedIn && currentUser && (
              <div className="relative">
                <button
                  id="user-profile-menu-btn"
                  onClick={() => setAuthDropdownOpen(!authDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-[#0B4035] hover:bg-[#0e4e41] border border-white/10 text-white transition-colors cursor-pointer"
                >
                  <img
                    src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-lg object-cover border border-[#D6A62E]"
                  />
                  <span className="text-xs font-semibold max-w-[100px] truncate">{currentUser.name.split(' ')[0]}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#D6A62E]" />
                </button>

                {/* Profile Dropdown */}
                {authDropdownOpen && (
                  <div 
                    id="auth-profile-dropdown"
                    className="absolute right-0 mt-2 w-60 bg-[#073B32] border border-[#D6A62E]/30 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2"
                  >
                    <div className="px-4 py-2.5 border-b border-white/10">
                      <p className="text-xs font-bold text-white">{currentUser.name}</p>
                      <p className="text-[11px] text-[#D6A62E] capitalize font-medium">
                        {currentUser.role === 'admin' ? 'Workshop Operations Admin' : 'Registered Driver Profile'}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setAuthDropdownOpen(false);
                        if (currentUser.role === 'admin') {
                          setView('admin_dashboard');
                          setAdminTab('overview');
                        } else {
                          setView('customer_dashboard');
                          setCustomerTab('dashboard');
                        }
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs text-white/90 hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                    >
                      <Car className="w-3.5 h-3.5 text-[#D6A62E]" />
                      <span>Go to {currentUser.role === 'admin' ? 'Admin Hub' : 'My Garage Dashboard'}</span>
                    </button>

                    <div className="border-t border-white/10 mt-1 pt-1">
                      <button
                        id="navbar-signout-btn"
                        onClick={() => {
                          setAuthDropdownOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 cursor-pointer font-bold"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              id="mobile-book-now-shortcut-btn"
              onClick={handleStartBooking}
              className="py-1.5 px-3 rounded-lg bg-[#D6A62E] text-[#073B32] font-black text-xs uppercase"
            >
              Book
            </button>
            <button
              id="toggle-mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-[#0B4035] text-white border border-white/10"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation-drawer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div 
          id="mobile-navigation-drawer"
          className="lg:hidden bg-[#073B32] border-b border-[#D6A62E]/30 px-6 py-5 space-y-4 animate-in slide-in-from-top-4"
        >
          {/* Mobile Auth Status Block */}
          {isLoggedIn && currentUser ? (
            <div className="p-3 bg-[#0B4035] rounded-xl border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-lg object-cover border border-[#D6A62E]"
                />
                <div>
                  <p className="text-xs font-bold text-white">{currentUser.name}</p>
                  <p className="text-[10px] text-[#D6A62E]">{currentUser.role === 'admin' ? 'Workshop Admin' : 'Driver'}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="py-1 px-2.5 rounded-lg bg-rose-500/20 text-rose-300 text-xs font-bold"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuth('customer');
                }}
                className="py-2.5 rounded-xl bg-[#0B4035] border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-[#D6A62E]" />
                <span>Driver Login</span>
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuth('admin');
                }}
                className="py-2.5 rounded-xl bg-[#0B4035] border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Workshop Admin</span>
              </button>
            </div>
          )}

          <nav className="flex flex-col space-y-3 pt-2 text-sm font-semibold text-[#F5F1E8]">
            <button onClick={() => { setView('website'); setMobileMenuOpen(false); }} className="text-left py-1 text-[#D6A62E]">Home</button>
            <button onClick={() => scrollToSection('services-section')} className="text-left py-1 hover:text-[#D6A62E]">Services</button>
            <button onClick={() => scrollToSection('portfolio-section')} className="text-left py-1 hover:text-[#D6A62E]">Our Work / Gallery</button>
            <button onClick={() => scrollToSection('why-choose-us-section')} className="text-left py-1 hover:text-[#D6A62E]">About Us</button>
            <button onClick={() => scrollToSection('how-it-works-section')} className="text-left py-1 hover:text-[#D6A62E]">How It Works</button>
            <button onClick={() => scrollToSection('contact-location-section')} className="text-left py-1 hover:text-[#D6A62E]">Contact & Workshop Map</button>
          </nav>

          <div className="pt-3 border-t border-white/10 flex flex-col gap-2.5">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleStartBooking();
              }}
              className="w-full py-3 rounded-xl bg-[#D6A62E] text-[#073B32] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" /> Book Service Now
            </button>
            <a
              href={BUSINESS_CONFIG.phone.telLink}
              className="w-full py-2.5 rounded-xl bg-[#0B4035] border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4 text-[#D6A62E]" /> Call {BUSINESS_CONFIG.phone.formatted}
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
