import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Logo } from '../common/Logo';
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
    loginAsCustomer, 
    loginAsAdmin, 
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
              className={`text-sm font-semibold transition-colors ${view === 'website' ? 'text-[#D6A62E]' : 'text-[#F5F1E8]/90 hover:text-[#D6A62E]'}`}
            >
              Home
            </button>
            <button 
              id="nav-link-services"
              onClick={() => scrollToSection('services-section')}
              className="text-sm font-semibold text-[#F5F1E8]/90 hover:text-[#D6A62E] transition-colors"
            >
              Services
            </button>
            <button 
              id="nav-link-portfolio"
              onClick={() => scrollToSection('portfolio-section')}
              className="text-sm font-semibold text-[#F5F1E8]/90 hover:text-[#D6A62E] transition-colors"
            >
              Our Work
            </button>
            <button 
              id="nav-link-about"
              onClick={() => scrollToSection('why-choose-us-section')}
              className="text-sm font-semibold text-[#F5F1E8]/90 hover:text-[#D6A62E] transition-colors"
            >
              About Us
            </button>
            <button 
              id="nav-link-how-it-works"
              onClick={() => scrollToSection('how-it-works-section')}
              className="text-sm font-semibold text-[#F5F1E8]/90 hover:text-[#D6A62E] transition-colors"
            >
              How It Works
            </button>
            <button 
              id="nav-link-contact"
              onClick={() => scrollToSection('contact-location-section')}
              className="text-sm font-semibold text-[#F5F1E8]/90 hover:text-[#D6A62E] transition-colors"
            >
              Contact
            </button>
          </nav>

          {/* Right Action Cluster & Role Switcher */}
          <div className="hidden sm:flex items-center gap-3">
            
            {/* Quick Experience Switcher (Demo Pill) */}
            <div className="flex items-center p-1 bg-[#0B4035] border border-[#D6A62E]/30 rounded-xl text-xs">
              <button
                id="view-website-tab-btn"
                onClick={() => setView('website')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  view === 'website' 
                    ? 'bg-[#D6A62E] text-[#073B32] font-bold shadow-sm' 
                    : 'text-[#F5F1E8]/70 hover:text-white'
                }`}
              >
                Website
              </button>
              <button
                id="view-customer-portal-tab-btn"
                onClick={() => {
                  loginAsCustomer();
                  setView('customer_dashboard');
                }}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                  view === 'customer_dashboard' 
                    ? 'bg-[#D6A62E] text-[#073B32] font-bold shadow-sm' 
                    : 'text-[#F5F1E8]/70 hover:text-white'
                }`}
              >
                <User className="w-3 h-3" /> Driver Portal
              </button>
              <button
                id="view-admin-hub-tab-btn"
                onClick={() => {
                  loginAsAdmin();
                  setView('admin_dashboard');
                }}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                  view === 'admin_dashboard' 
                    ? 'bg-[#D6A62E] text-[#073B32] font-bold shadow-sm' 
                    : 'text-[#F5F1E8]/70 hover:text-white'
                }`}
              >
                <ShieldAlert className="w-3 h-3" /> Workshop Admin
              </button>
            </div>

            {/* Primary Action Button: Book a Service */}
            <button
              id="header-book-service-btn"
              onClick={handleStartBooking}
              className="py-2.5 px-5 rounded-xl bg-[#D6A62E] hover:bg-[#c39626] text-[#073B32] font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md hover:shadow-lg transition-all transform hover:scale-[1.02] cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Book a Service</span>
            </button>

            {/* User Profile / Login Dropdown */}
            <div className="relative">
              {isLoggedIn ? (
                <button
                  id="user-profile-menu-btn"
                  onClick={() => setAuthDropdownOpen(!authDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-[#0B4035] hover:bg-[#0e4e41] border border-white/10 text-white transition-colors"
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-lg object-cover border border-[#D6A62E]"
                  />
                  <span className="text-xs font-semibold max-w-[100px] truncate">{currentUser.name.split(' ')[0]}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#D6A62E]" />
                </button>
              ) : (
                <button
                  id="header-login-btn"
                  onClick={() => setView('auth')}
                  className="py-2 px-3.5 rounded-xl border border-[#D6A62E]/60 hover:bg-[#D6A62E]/10 text-[#F5F1E8] font-bold text-xs transition-colors"
                >
                  Login
                </button>
              )}

              {/* Profile Dropdown */}
              {authDropdownOpen && isLoggedIn && (
                <div 
                  id="auth-profile-dropdown"
                  className="absolute right-0 mt-2 w-56 bg-[#073B32] border border-[#D6A62E]/30 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2"
                >
                  <div className="px-4 py-2 border-b border-white/10">
                    <p className="text-xs font-bold text-white">{currentUser.name}</p>
                    <p className="text-[11px] text-[#D6A62E] capitalize">{currentUser.role === 'admin' ? 'Workshop Admin' : 'Vehicle Owner'}</p>
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
                    className="w-full text-left px-4 py-2 text-xs text-white/90 hover:bg-white/10 flex items-center gap-2"
                  >
                    <Car className="w-3.5 h-3.5 text-[#D6A62E]" /> Go to {currentUser.role === 'admin' ? 'Admin Hub' : 'My Dashboard'}
                  </button>

                  <button
                    onClick={() => {
                      setAuthDropdownOpen(false);
                      if (currentUser.role === 'admin') {
                        loginAsCustomer();
                      } else {
                        loginAsAdmin();
                      }
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-[#D6A62E] hover:bg-white/10 flex items-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Switch to {currentUser.role === 'admin' ? 'Customer Mode' : 'Admin Operations'}
                  </button>

                  <div className="border-t border-white/10 mt-1 pt-1">
                    <button
                      onClick={() => {
                        setAuthDropdownOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
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
              aria-label="Toggle Menu"
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
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-[#0B4035] rounded-xl border border-white/10 text-center text-xs">
            <button
              onClick={() => { setView('website'); setMobileMenuOpen(false); }}
              className={`py-2 rounded-lg font-bold ${view === 'website' ? 'bg-[#D6A62E] text-[#073B32]' : 'text-white/70'}`}
            >
              Website
            </button>
            <button
              onClick={() => { loginAsCustomer(); setView('customer_dashboard'); setMobileMenuOpen(false); }}
              className={`py-2 rounded-lg font-bold ${view === 'customer_dashboard' ? 'bg-[#D6A62E] text-[#073B32]' : 'text-white/70'}`}
            >
              Driver
            </button>
            <button
              onClick={() => { loginAsAdmin(); setView('admin_dashboard'); setMobileMenuOpen(false); }}
              className={`py-2 rounded-lg font-bold ${view === 'admin_dashboard' ? 'bg-[#D6A62E] text-[#073B32]' : 'text-white/70'}`}
            >
              Admin
            </button>
          </div>

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
              href="tel:0712345678"
              className="w-full py-2.5 rounded-xl bg-[#0B4035] border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4 text-[#D6A62E]" /> Call 0712 345 678
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
