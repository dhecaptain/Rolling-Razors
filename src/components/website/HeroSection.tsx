import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Car, 
  Scissors, 
  Layers, 
  Star 
} from 'lucide-react';
import { QuickBookingWidget } from './QuickBookingWidget';
import { cdnUrl } from '../../utils/image';

export const HeroSection: React.FC = () => {
  const { setView, setBookingWizardInitialServiceId } = useApp();

  const handleBookNow = () => {
    setBookingWizardInitialServiceId(null);
    setView('booking');
  };

  const handleExploreServices = () => {
    const el = document.getElementById('services-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section 
      id="hero-section"
      className="relative min-h-[92vh] pt-28 pb-16 lg:pt-36 lg:pb-24 flex flex-col justify-between overflow-hidden bg-[#073B32]"
    >
      {/* Background Cinematic Interior Image with Forest Green Gradients */}
      <div className="absolute inset-0 z-0">
        <img
          src={cdnUrl("https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?auto=format&fit=crop&w=2000&q=85", { w: 1600, q: 75 })}
          srcSet={`${cdnUrl("https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?auto=format&fit=crop&w=800&q=75", { w: 800 })} 800w, ${cdnUrl("https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?auto=format&fit=crop&w=1600&q=75", { w: 1600 })} 1600w, ${cdnUrl("https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?auto=format&fit=crop&w=2000&q=75", { w: 2000 })} 2000w`}
          sizes="100vw"
          alt="Rolling Razors Customs Handcrafted Leather Car Interior"
          fetchPriority="high"
          decoding="async"
          className="w-full h-full object-cover object-center transform scale-105 transition-transform duration-1000"
        />
        {/* Forest Green Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#073B32] via-[#073B32]/90 to-[#073B32]/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#073B32] via-transparent to-[#073B32]/40" />
        
        {/* Subtle Workshop Stitch Texture Pattern */}
        <div className="absolute inset-0 opacity-10 bg-leather-texture pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Hero Narrative */}
          <div className="lg:col-span-7 space-y-6 lg:pr-4 animate-in fade-in slide-in-from-left-6 duration-700">
            
            {/* Tagline / Sub-badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0B4035]/90 border border-[#D6A62E]/40 backdrop-blur-md shadow-sm">
              <Scissors className="w-3.5 h-3.5 text-[#D6A62E]" />
              <span className="font-signature text-base md:text-lg text-[#D6A62E] font-bold tracking-wide">
                Your Vision, Our Craftsmanship.
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-[#F5F1E8] tracking-tight leading-[1.08] font-display">
              Transform Your Ride. <br />
              <span className="text-[#D6A62E]">Built Around Your Vision.</span>
            </h1>

            {/* Supporting text */}
            <p className="text-base sm:text-lg text-[#F5F1E8]/85 max-w-2xl leading-relaxed font-normal">
              Professional car upholstery, custom cushions, leather work, and bespoke vehicle interior transformations — meticulously handcrafted for Kenyan roads and drivers.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                id="hero-primary-book-btn"
                onClick={handleBookNow}
                className="py-3.5 px-7 rounded-xl bg-[#D6A62E] hover:bg-[#c39626] text-[#073B32] font-black text-sm uppercase tracking-wider flex items-center gap-2.5 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Book a Service</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="hero-secondary-explore-btn"
                onClick={handleExploreServices}
                className="py-3.5 px-6 rounded-xl bg-[#0B4035]/80 hover:bg-[#0e4e41] border border-[#D6A62E]/50 text-[#F5F1E8] font-bold text-sm transition-all hover:border-[#D6A62E] cursor-pointer"
              >
                Explore Our Services
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-[#F5F1E8]/90 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#D6A62E] shrink-0" />
                <span>Custom Made</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#D6A62E] shrink-0" />
                <span>Quality Craftsmanship</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#D6A62E] shrink-0" />
                <span>Built to Last</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#D6A62E] shrink-0" />
                <span>Kenyan Based</span>
              </div>
            </div>

            {/* Social Proof Mini Bar */}
            <div className="flex items-center gap-3 pt-1 text-xs text-white/70">
              <div className="flex -space-x-2">
                <img className="inline-block h-7 w-7 rounded-full ring-2 ring-[#073B32] object-cover" src={cdnUrl("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80", { w: 100 })} loading="lazy" decoding="async" alt="Customer" />
                <img className="inline-block h-7 w-7 rounded-full ring-2 ring-[#073B32] object-cover" src={cdnUrl("https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80", { w: 100 })} loading="lazy" decoding="async" alt="Customer" />
                <img className="inline-block h-7 w-7 rounded-full ring-2 ring-[#073B32] object-cover" src={cdnUrl("https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&q=80", { w: 100 })} loading="lazy" decoding="async" alt="Customer" />
              </div>
              <div className="flex items-center gap-1">
                <div className="flex text-[#D6A62E]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-[#D6A62E]" />
                  ))}
                </div>
                <span className="font-semibold text-white">4.9/5</span>
                <span>• 850+ Kenyan Rides Transformed</span>
              </div>
            </div>

          </div>

          {/* Right Column: Quick Booking Widget */}
          <div className="lg:col-span-5 w-full">
            <QuickBookingWidget />
          </div>

        </div>
      </div>
    </section>
  );
};
