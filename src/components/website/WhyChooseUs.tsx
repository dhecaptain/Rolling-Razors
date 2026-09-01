import React from 'react';
import { 
  ShieldCheck, 
  Scissors, 
  CalendarCheck, 
  Truck, 
  Sparkles,
  Award,
  Clock,
  CheckCircle2
} from 'lucide-react';

export const WhyChooseUs: React.FC = () => {
  const cards = [
    {
      title: 'Premium Materials',
      desc: 'We import automotive grade hides, UV-stabilized heavy vinyl, and high-density foam selected specifically for comfort and long-term durability.',
      icon: <Award className="w-6 h-6 text-[#D6A62E]" />
    },
    {
      title: 'Custom Craftsmanship',
      desc: 'Every project is individually measured and hand-stitched around your specific ergonomic preferences, body bolster requirements, and style vision.',
      icon: <Scissors className="w-6 h-6 text-[#D6A62E]" />
    },
    {
      title: 'Transparent Booking',
      desc: 'Know your exact service price estimate, deposit amount, and appointment slot before bringing your vehicle to the workshop.',
      icon: <CalendarCheck className="w-6 h-6 text-[#D6A62E]" />
    },
    {
      title: 'Built for Kenyan Roads',
      desc: 'Durability matters. From bumpy dust roads to heavy commercial matatu traffic, our seams and materials are engineered for heavy real-world use.',
      icon: <Truck className="w-6 h-6 text-[#D6A62E]" />
    },
    {
      title: 'Professional Service',
      desc: 'From online booking and M-Pesa deposit to live work order tracking and fast vehicle collection, we treat your time with absolute respect.',
      icon: <ShieldCheck className="w-6 h-6 text-[#D6A62E]" />
    }
  ];

  return (
    <section id="why-choose-us-section" className="py-20 lg:py-28 bg-[#0B4035] text-[#F5F1E8] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold text-[#D6A62E] uppercase tracking-widest bg-[#073B32] px-3.5 py-1.5 rounded-full border border-[#D6A62E]/30 inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> OUR PROMISE TO DRIVERS
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-display tracking-tight text-[#F5F1E8]">
            Why Drivers Choose Rolling Razors
          </h2>
          <p className="text-sm sm:text-base text-[#F5F1E8]/80 font-normal">
            We bridge the gap between traditional artisanal upholstery craft and modern digital convenience.
          </p>
        </div>

        {/* 5 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card, idx) => (
            <div
              key={idx}
              className={`p-7 rounded-2xl bg-[#073B32] border border-[#D6A62E]/20 hover:border-[#D6A62E] transition-all duration-300 shadow-xl flex flex-col justify-between space-y-4 hover:-translate-y-1 ${
                idx === 4 ? 'md:col-span-2 lg:col-span-1' : ''
              }`}
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[#0B4035] border border-[#D6A62E]/30 flex items-center justify-center shadow-inner">
                  {card.icon}
                </div>

                <h3 className="text-xl font-bold text-[#F5F1E8] font-display">
                  {card.title}
                </h3>

                <p className="text-xs sm:text-sm text-[#F5F1E8]/75 leading-relaxed">
                  {card.desc}
                </p>
              </div>

              <div className="pt-2 flex items-center gap-1.5 text-xs text-[#D6A62E] font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#25D366]" />
                <span>Rolling Razors Standard</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
