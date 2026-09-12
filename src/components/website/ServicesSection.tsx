import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Service } from '../../types';
import { cdnUrl, srcSet } from '../../utils/image';
import { useModalA11y } from '../../utils/useModalA11y';
import { Reveal } from './Reveal';
import {
  Car,
  Armchair,
  Layers,
  Scissors,
  Compass,
  Grid,
  Shield,
  Tent,
  Briefcase,
  Sparkles,
  Palette,
  ArrowRight,
  Clock,
  Check,
  X,
  Calendar
} from 'lucide-react';

export const ServicesSection: React.FC = () => {
  const { services, setView, setBookingWizardInitialServiceId } = useApp();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const serviceModalRef = useModalA11y(Boolean(selectedService), () => setSelectedService(null));

  const getServiceIcon = (name: string) => {
    switch (name) {
      case 'Car': return <Car className="w-5 h-5 text-[#D6A62E]" />;
      case 'Armchair': return <Armchair className="w-5 h-5 text-[#D6A62E]" />;
      case 'Layers': return <Layers className="w-5 h-5 text-[#D6A62E]" />;
      case 'Scissors': return <Scissors className="w-5 h-5 text-[#D6A62E]" />;
      case 'Compass': return <Compass className="w-5 h-5 text-[#D6A62E]" />;
      case 'Grid': return <Grid className="w-5 h-5 text-[#D6A62E]" />;
      case 'Shield': return <Shield className="w-5 h-5 text-[#D6A62E]" />;
      case 'Tent': return <Tent className="w-5 h-5 text-[#D6A62E]" />;
      case 'Briefcase': return <Briefcase className="w-5 h-5 text-[#D6A62E]" />;
      case 'Palette': return <Palette className="w-5 h-5 text-[#D6A62E]" />;
      default: return <Sparkles className="w-5 h-5 text-[#D6A62E]" />;
    }
  };

  const handleBookSpecificService = (serviceId: string) => {
    setBookingWizardInitialServiceId(serviceId);
    setSelectedService(null);
    setView('booking');
  };

  return (
    <section id="services-section" className="py-20 lg:py-28 bg-[#0B4035] text-[#F5F1E8] relative">
      {/* Background Subtle Accent */}
      <div className="absolute inset-0 bg-leather-texture opacity-5 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#073B32] border border-[#D6A62E]/30 text-xs font-semibold text-[#D6A62E]">
            <Scissors className="w-3.5 h-3.5" />
            <span>Kenyan Automotive & Upholstery Masters</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-display tracking-tight text-[#F5F1E8]">
            Craftsmanship Beyond the Seat
          </h2>

          <p className="text-base sm:text-lg text-[#F5F1E8]/80 leading-relaxed font-normal">
            From a simple seat repair to a complete interior transformation, we bring your vision to life with heavy-duty materials designed for Kenyan roads.
          </p>
        </div>

        {/* 10 Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {services.map((service, index) => (
            <Reveal key={service.id} delay={(index % 3) * 0.08} className="h-full">
            <div
              id={`service-card-${service.id}`}
              className="group rounded-2xl bg-[#073B32] border border-[#D6A62E]/20 hover:border-[#D6A62E] transition-all duration-300 overflow-hidden flex flex-col shadow-lg hover:shadow-2xl hover:-translate-y-1 h-full"
            >
              {/* Image Container with Zoom Effect */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={cdnUrl(service.image, { w: 600 })}
                  srcSet={srcSet(service.image, [400, 600, 800])}
                  sizes="(max-width: 768px) 100vw, 33vw"
                  alt={service.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#073B32] via-transparent to-black/20" />
                
                {/* Popular / Featured Badge */}
                {service.popular && (
                  <div className="absolute top-3 right-3 bg-[#D6A62E] text-[#073B32] text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow">
                    Most Popular
                  </div>
                )}

                {/* Duration Badge */}
                <div className="absolute bottom-3 left-3 bg-[#073B32]/90 border border-white/10 text-white text-[11px] font-medium px-2.5 py-0.5 rounded-md flex items-center gap-1 backdrop-blur-sm">
                  <Clock className="w-3 h-3 text-[#D6A62E]" /> {service.estimatedDuration}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-[#0B4035] border border-[#D6A62E]/30">
                      {getServiceIcon(service.iconName)}
                    </div>
                    <h3 className="text-xl font-bold text-[#F5F1E8] font-display group-hover:text-[#D6A62E] transition-colors">
                      {service.name}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-[#F5F1E8]/75 leading-relaxed">
                    {service.shortDesc}
                  </p>
                </div>

                {/* Pricing and CTAs */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-white/50 block uppercase tracking-wider">Starting from</span>
                    <span className="text-base font-black text-[#D6A62E]">
                      KES {service.startingPrice.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      id={`view-service-btn-${service.id}`}
                      onClick={() => setSelectedService(service)}
                      className="text-xs font-bold text-white/80 hover:text-white underline underline-offset-4 transition-colors cursor-pointer"
                    >
                      View Details
                    </button>
                    <button
                      id={`book-service-card-btn-${service.id}`}
                      onClick={() => handleBookSpecificService(service.id)}
                      className="p-2 rounded-xl bg-[#0B4035] hover:bg-[#D6A62E] text-[#D6A62E] hover:text-[#073B32] border border-[#D6A62E]/40 transition-colors"
                      title="Book this service"
                      aria-label={`Book ${service.name}`}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            </Reveal>
          ))}
        </div>

      </div>

      {/* Service Detail Modal */}
      {selectedService && (
        <div 
          id="service-detail-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setSelectedService(null)}
        >
          <div
            ref={serviceModalRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedService.name} service details`}
            tabIndex={-1}
            className="bg-[#073B32] border-2 border-[#D6A62E]/50 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto text-[#F5F1E8] shadow-2xl focus:outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Image Header */}
            <div className="relative h-60 w-full overflow-hidden">
              <img 
                src={cdnUrl(selectedService.image, { w: 800 })}
                srcSet={srcSet(selectedService.image, [600, 800, 1200])}
                sizes="100vw"
                alt={selectedService.name} 
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#073B32] to-transparent" />
              <button
                id="close-service-modal-btn"
                onClick={() => setSelectedService(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors"
                aria-label="Close service details"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-6">
                <span className="text-xs font-bold text-[#D6A62E] uppercase tracking-wider">Rolling Razors Service</span>
                <h3 className="text-2xl font-black text-white font-display">{selectedService.name}</h3>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-xs font-bold text-[#D6A62E] uppercase tracking-wider mb-2">Service Overview</h4>
                <p className="text-sm text-white/90 leading-relaxed">{selectedService.longDesc}</p>
              </div>

              {/* What's Included */}
              <div>
                <h4 className="text-xs font-bold text-[#D6A62E] uppercase tracking-wider mb-2">Included In This Service</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedService.includedFeatures.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-white/80 bg-[#0B4035] p-2 rounded-lg border border-white/5">
                      <Check className="w-3.5 h-3.5 text-[#D6A62E] shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Materials Available */}
              <div>
                <h4 className="text-xs font-bold text-[#D6A62E] uppercase tracking-wider mb-2">Materials & Options</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedService.materialsAvailable.map((mat, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-md bg-[#052822] text-[#D6A62E] border border-[#D6A62E]/30">
                      {mat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Modal Footer with Pricing and Action */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-white/60 block uppercase">Starting Estimate</span>
                  <span className="text-xl font-black text-[#D6A62E]">KES {selectedService.startingPrice.toLocaleString()}</span>
                </div>
                <button
                  id="modal-book-this-service-btn"
                  onClick={() => handleBookSpecificService(selectedService.id)}
                  className="py-3 px-6 rounded-xl bg-[#D6A62E] hover:bg-[#c39626] text-[#073B32] font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book This Service</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
