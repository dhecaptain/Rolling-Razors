import React from 'react';
import { useApp } from '../../context/AppContext';
import { Star, Quote, CheckCircle, MapPin, Car } from 'lucide-react';

export const CustomerReviews: React.FC = () => {
  const { reviews } = useApp();

  return (
    <section id="reviews-section" className="py-20 lg:py-28 bg-ink text-cream relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold text-gold uppercase tracking-widest bg-panel px-3.5 py-1.5 rounded-full border border-gold">
            TESTIMONIALS
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-display tracking-tight text-cream">
            What Kenyan Drivers Say
          </h2>
          <p className="text-sm sm:text-base text-cream">
            Verified feedback from vehicle owners across Nairobi, Nakuru, Eldoret, and Mombasa.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-6 rounded-2xl bg-panel border border-gold flex flex-col justify-between space-y-4 shadow-xl hover:border-goldhover: transition-all hover:-translate-y-1"
            >
              <div className="space-y-3">
                {/* 5 Stars */}
                <div className="flex items-center gap-1 text-gold">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-gold" />
                  ))}
                </div>

                {/* Comment */}
                <p className="text-xs sm:text-sm text-cream italic leading-relaxed">
                  "{rev.comment}"
                </p>
              </div>

              {/* Reviewer Details */}
              <div className="pt-3 border-t border-white/10 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-cream">{rev.customerName}</h4>
                  {rev.verified && (
                    <span className="text-[10px] text-whatsapp font-semibold flex items-center gap-0.5">
                      <CheckCircle className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-gold" /> {rev.location}</span>
                </div>
                <div className="text-[11px] text-gold font-medium flex items-center gap-1">
                  <Car className="w-3 h-3" /> {rev.vehicle} • {rev.service}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
