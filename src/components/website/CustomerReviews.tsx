import React from 'react';
import { useApp } from '../../context/AppContext';
import { Reveal } from './Reveal';
import { Star, Quote, CheckCircle, MapPin, Car } from 'lucide-react';

export const CustomerReviews: React.FC = () => {
  const { reviews } = useApp();

  return (
    <section id="reviews-section" className="py-20 lg:py-28 bg-[#073B32] text-[#F5F1E8] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold text-[#D6A62E] uppercase tracking-widest bg-[#0B4035] px-3.5 py-1.5 rounded-full border border-[#D6A62E]/30">
            TESTIMONIALS
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-display tracking-tight text-[#F5F1E8]">
            What Kenyan Drivers Say
          </h2>
          <p className="text-sm sm:text-base text-[#F5F1E8]/75">
            Verified feedback from vehicle owners across Nairobi, Nakuru, Eldoret, and Mombasa.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reviews.map((rev) => (
            <Reveal key={rev.id} delay={0}>
            <div
              className="p-6 rounded-2xl bg-[#0B4035] border border-[#D6A62E]/25 flex flex-col justify-between space-y-4 shadow-xl hover:border-[#D6A62E] transition-all hover:-translate-y-1"
            >
              <div className="space-y-3">
                {/* 5 Stars */}
                <div className="flex items-center gap-1 text-[#D6A62E]">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#D6A62E]" />
                  ))}
                </div>

                {/* Comment */}
                <p className="text-xs sm:text-sm text-[#F5F1E8]/90 italic leading-relaxed">
                  "{rev.comment}"
                </p>
              </div>

              {/* Reviewer Details */}
              <div className="pt-3 border-t border-white/10 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#F5F1E8]">{rev.customerName}</h4>
                  {rev.verified && (
                    <span className="text-[10px] text-[#25D366] font-semibold flex items-center gap-0.5">
                      <CheckCircle className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-[#D6A62E]" /> {rev.location}</span>
                </div>
                <div className="text-[11px] text-[#D6A62E] font-medium flex items-center gap-1">
                  <Car className="w-3 h-3" /> {rev.vehicle} • {rev.service}
                </div>
              </div>
            </div>
            </Reveal>
          ))}
        </div>

      </div>
    </section>
  );
};
