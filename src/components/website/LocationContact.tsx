import React from 'react';
import { 
  MapPin, 
  Phone, 
  MessageCircle, 
  Clock, 
  Navigation, 
  Calendar, 
  ShieldCheck, 
  Mail,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BUSINESS_CONFIG } from '../../config/business';

export const LocationContact: React.FC = () => {
  const { setView } = useApp();

  const handleWhatsApp = () => {
    const encoded = encodeURIComponent(BUSINESS_CONFIG.whatsapp.defaultMessage);
    window.open(`${BUSINESS_CONFIG.whatsapp.link}?text=${encoded}`, '_blank', 'noopener,noreferrer');
  };

  const handleDirections = () => {
    window.open(BUSINESS_CONFIG.location.mapsUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <section id="contact-location-section" className="py-20 lg:py-28 bg-[#0B4035] text-[#F5F1E8] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold text-[#D6A62E] uppercase tracking-widest bg-[#073B32] px-3.5 py-1.5 rounded-full border border-[#D6A62E]/30">
            VISIT OUR WORKSHOP
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-display tracking-tight text-[#F5F1E8]">
            Find Us in {BUSINESS_CONFIG.location.city}, {BUSINESS_CONFIG.location.country}
          </h2>
          <p className="text-sm sm:text-base text-[#F5F1E8]/75">
            Drive in for a physical material inspection, leather swatch feeling, or sit-down ergonomics consultation.
          </p>
        </div>

        {/* 2-Column Location & Contact details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Contact Cards & Operating Hours */}
          <div className="lg:col-span-5 space-y-5 flex flex-col justify-between">
            
            {/* Workshop Address Card */}
            <div className="p-6 rounded-2xl bg-[#073B32] border border-[#D6A62E]/30 shadow-xl space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-[#0B4035] text-[#D6A62E] border border-[#D6A62E]/30">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#F5F1E8] font-display">{BUSINESS_CONFIG.name} Workshop</h3>
                  <p className="text-xs text-[#D6A62E]">{BUSINESS_CONFIG.shortTagline}</p>
                </div>
              </div>
              <p className="text-sm text-white/80 leading-relaxed">
                {BUSINESS_CONFIG.location.fullAddress}. ({BUSINESS_CONFIG.location.landmark}).
              </p>
            </div>

            {/* Operating Hours Card */}
            <div className="p-6 rounded-2xl bg-[#073B32] border border-[#D6A62E]/30 shadow-xl space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-[#0B4035] text-[#D6A62E] border border-[#D6A62E]/30">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#F5F1E8] font-display">Opening Hours</h3>
                  <p className="text-xs text-white/60">Workshop & Customer Fitting</p>
                </div>
              </div>

              <div className="space-y-2 text-xs divide-y divide-white/10">
                <div className="flex justify-between pt-1">
                  <span className="text-white/80">Monday – Friday</span>
                  <span className="font-bold text-[#D6A62E]">{BUSINESS_CONFIG.hours.weekdays}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-white/80">Saturday</span>
                  <span className="font-bold text-[#D6A62E]">{BUSINESS_CONFIG.hours.saturday}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-white/80">Sunday</span>
                  <span className="font-bold text-rose-400">{BUSINESS_CONFIG.hours.sunday}</span>
                </div>
              </div>
            </div>

            {/* Direct Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href={BUSINESS_CONFIG.phone.telLink}
                id="contact-call-btn"
                className="py-3.5 px-4 rounded-xl bg-[#073B32] hover:bg-[#0e4e41] border border-[#D6A62E]/50 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <Phone className="w-4 h-4 text-[#D6A62E]" />
                <span>Call {BUSINESS_CONFIG.phone.formatted}</span>
              </a>

              <button
                id="contact-whatsapp-btn"
                onClick={handleWhatsApp}
                className="py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
              </button>
            </div>

          </div>

          {/* Right Column: Google Maps Style Interactive Panel */}
          <div className="lg:col-span-7 bg-[#073B32] border border-[#D6A62E]/40 rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between">
            
            {/* Map Visualizer Mock with Nairobi Landmark Pin */}
            <div className="relative h-80 sm:h-96 w-full bg-[#052822] overflow-hidden">
              {/* Map Texture & Roads graphic */}
              <svg className="w-full h-full opacity-35" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#D6A62E" strokeWidth="0.5" strokeOpacity="0.3"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#map-grid)" />
                {/* Major Nairobi Highway Lines */}
                <path d="M 0 100 Q 200 150 400 120 T 800 200" fill="none" stroke="#D6A62E" strokeWidth="4" strokeOpacity="0.6"/>
                <path d="M 300 0 Q 350 200 420 400" fill="none" stroke="#F5F1E8" strokeWidth="3" strokeOpacity="0.4"/>
                <path d="M 100 300 L 700 80" fill="none" stroke="#25D366" strokeWidth="2" strokeOpacity="0.5"/>
              </svg>

              {/* Nairobi Map Pin Badge */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer" onClick={handleDirections}>
                <div className="relative flex items-center justify-center">
                  <div className="absolute -inset-3 rounded-full bg-[#D6A62E]/30 animate-ping" />
                  <div className="w-12 h-12 rounded-full bg-[#D6A62E] text-[#073B32] border-2 border-white shadow-2xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 fill-[#073B32]" />
                  </div>
                </div>
                <div className="mt-2 bg-[#0B4035] border border-[#D6A62E] px-3 py-1 rounded-lg text-xs font-bold text-[#F5F1E8] shadow-xl whitespace-nowrap">
                  {BUSINESS_CONFIG.name.toUpperCase()}
                </div>
              </div>

              {/* Quick Map Controls Overlay */}
              <div className="absolute top-4 left-4 bg-[#073B32]/90 border border-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg text-[11px] text-white/90">
                📍 {BUSINESS_CONFIG.location.city} Workshop • GPS Verified
              </div>
            </div>

            {/* Map Action Bottom Strip */}
            <div className="p-5 bg-[#052822] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-white/70 text-center sm:text-left">
                <span className="font-semibold text-white block">Drive-in consultations welcome!</span>
                Ample secure parking with dedicated vehicle inspection bay.
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  id="get-directions-btn"
                  onClick={handleDirections}
                  className="flex-1 sm:flex-initial py-2.5 px-5 rounded-xl bg-[#D6A62E] hover:bg-[#c39626] text-[#073B32] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Get Directions</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
