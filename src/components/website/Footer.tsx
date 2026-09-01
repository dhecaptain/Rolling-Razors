import React from 'react';
import { useApp } from '../../context/AppContext';
import { Logo } from '../common/Logo';
import { 
  Phone, 
  MapPin, 
  Clock, 
  MessageCircle, 
  ShieldCheck, 
  Calendar,
  ArrowUp
} from 'lucide-react';

export const Footer: React.FC = () => {
  const { setView, setBookingWizardInitialServiceId } = useApp();

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      setView('website');
      setTimeout(() => {
        const target = document.getElementById(id);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="main-footer" className="bg-[#052822] text-[#F5F1E8] border-t border-[#D6A62E]/30 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-white/10">
          
          {/* Brand Column (Span 2) */}
          <div className="lg:col-span-2 space-y-4">
            <Logo variant="light" size="lg" showTagline={true} onClick={scrollToTop} />
            
            <p className="text-xs sm:text-sm text-[#F5F1E8]/75 leading-relaxed max-w-sm">
              Kenya’s premier automotive upholstery, custom seat tailoring, leather work, cushions, roofing, and bespoke vehicle interior transformation workshop.
            </p>

            <div className="space-y-2 text-xs text-white/80 pt-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#D6A62E]" />
                <span>Industrial Area / Off Mombasa Road, Nairobi, Kenya</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#D6A62E]" />
                <span>0712 345 678</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#D6A62E]" />
                <span>Mon – Sat: 8:00 AM – 6:00 PM (Sunday Closed)</span>
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-[#D6A62E] uppercase tracking-wider font-display">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs text-[#F5F1E8]/80">
              <li>
                <button onClick={scrollToTop} className="hover:text-[#D6A62E] transition-colors">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('services-section')} className="hover:text-[#D6A62E] transition-colors">
                  Our Services
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('portfolio-section')} className="hover:text-[#D6A62E] transition-colors">
                  Our Work & Portfolio
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('how-it-works-section')} className="hover:text-[#D6A62E] transition-colors">
                  How It Works
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('why-choose-us-section')} className="hover:text-[#D6A62E] transition-colors">
                  About Us
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('contact-location-section')} className="hover:text-[#D6A62E] transition-colors">
                  Contact & Map
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Specializations */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-[#D6A62E] uppercase tracking-wider font-display">
              Services
            </h4>
            <ul className="space-y-2 text-xs text-[#F5F1E8]/80">
              <li><button onClick={() => { setBookingWizardInitialServiceId('srv-1'); setView('booking'); }} className="hover:text-[#D6A62E]">Car Interior Upholstery</button></li>
              <li><button onClick={() => { setBookingWizardInitialServiceId('srv-2'); setView('booking'); }} className="hover:text-[#D6A62E]">Custom Car Seats</button></li>
              <li><button onClick={() => { setBookingWizardInitialServiceId('srv-4'); setView('booking'); }} className="hover:text-[#D6A62E]">Genuine Leather Work</button></li>
              <li><button onClick={() => { setBookingWizardInitialServiceId('srv-5'); setView('booking'); }} className="hover:text-[#D6A62E]">Steering Wheel Stitching</button></li>
              <li><button onClick={() => { setBookingWizardInitialServiceId('srv-3'); setView('booking'); }} className="hover:text-[#D6A62E]">Cushion Customization</button></li>
              <li><button onClick={() => { setBookingWizardInitialServiceId('srv-10'); setView('booking'); }} className="hover:text-[#D6A62E]">Roofing & Headliner Repair</button></li>
              <li><button onClick={() => { setBookingWizardInitialServiceId('srv-7'); setView('booking'); }} className="hover:text-[#D6A62E]">Car Shades & Tents</button></li>
            </ul>
          </div>

          {/* Column 4: Booking & Socials */}
          <div className="space-y-4">
            <h4 className="font-bold text-sm text-[#D6A62E] uppercase tracking-wider font-display">
              Driver Portal
            </h4>
            
            <p className="text-xs text-white/70">
              Manage your active appointments, track real-time workshop progress, and settle payments with M-Pesa.
            </p>

            <button
              id="footer-book-now-btn"
              onClick={() => setView('booking')}
              className="w-full py-2.5 px-4 rounded-xl bg-[#D6A62E] hover:bg-[#c39626] text-[#073B32] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" /> Book a Service
            </button>

            {/* Social Icons */}
            <div className="pt-2">
              <span className="text-[11px] font-bold text-white/60 block mb-2 uppercase">Connect With Us</span>
              <div className="flex items-center gap-2 text-white">
                {/* Facebook */}
                <a href="https://facebook.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-[#0B4035] hover:bg-[#D6A62E] hover:text-[#073B32] flex items-center justify-center transition-colors text-xs font-bold">
                  FB
                </a>
                {/* Instagram */}
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-[#0B4035] hover:bg-[#D6A62E] hover:text-[#073B32] flex items-center justify-center transition-colors text-xs font-bold">
                  IG
                </a>
                {/* WhatsApp */}
                <a href="https://wa.me/254712345678" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-[#25D366] text-white hover:opacity-90 flex items-center justify-center transition-opacity text-xs font-bold">
                  WA
                </a>
                {/* TikTok */}
                <a href="https://tiktok.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-[#0B4035] hover:bg-[#D6A62E] hover:text-[#073B32] flex items-center justify-center transition-colors text-xs font-bold">
                  TT
                </a>
              </div>
            </div>

          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/60">
          <div className="flex flex-wrap items-center gap-4 text-center sm:text-left">
            <span>© 2026 Rolling Razors Customs. All rights reserved.</span>
            <span>•</span>
            <span className="text-[#D6A62E]">Nairobi, Kenya</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => alert("Privacy Policy: All customer and vehicle details are protected and confidential.")} className="hover:text-white">
              Privacy Policy
            </button>
            <button onClick={() => alert("Terms of Service: 1-year warranty on all stitchwork and structural foams.")} className="hover:text-white">
              Terms of Service
            </button>
            <button 
              onClick={scrollToTop}
              className="p-2 rounded-lg bg-[#0B4035] hover:bg-[#D6A62E] hover:text-[#073B32] text-white transition-colors"
              title="Back to Top"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
