import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  CheckCircle, 
  Calendar, 
  Car, 
  Sparkles, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

export const HowBookingWorks: React.FC = () => {
  const { setView } = useApp();

  const steps = [
    {
      num: '01',
      title: 'Choose a Service',
      desc: 'Select from full car upholstery, custom cushions, leather stitching, steering wrap, or car shades.',
      icon: <Sparkles className="w-6 h-6 text-[#D6A62E]" />
    },
    {
      num: '02',
      title: 'Select Preferred Date',
      desc: 'Pick your convenient day and time slot with instant workshop slot availability check.',
      icon: <Calendar className="w-6 h-6 text-[#D6A62E]" />
    },
    {
      num: '03',
      title: 'Tell Us About Your Vehicle',
      desc: 'Enter vehicle make, model, registration number, and specify your custom leather colors or requirements.',
      icon: <Car className="w-6 h-6 text-[#D6A62E]" />
    },
    {
      num: '04',
      title: 'Bring It In & We Transform It',
      desc: 'Drive into our Nairobi workshop or request mobile fitting. Pay deposit securely with M-Pesa.',
      icon: <CheckCircle className="w-6 h-6 text-[#D6A62E]" />
    }
  ];

  return (
    <section id="how-it-works-section" className="py-20 lg:py-28 bg-[#0B4035] text-[#F5F1E8] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold text-[#D6A62E] uppercase tracking-widest bg-[#073B32] px-3.5 py-1.5 rounded-full border border-[#D6A62E]/30">
            SIMPLE & TRANSPARENT
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-display tracking-tight text-[#F5F1E8]">
            How Booking Works
          </h2>
          <p className="text-sm sm:text-base text-[#F5F1E8]/80">
            A seamless digital experience connecting you directly with Kenyan master craftsmen.
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, idx) => (
            <div 
              key={idx}
              className="relative bg-[#073B32] border border-[#D6A62E]/20 rounded-2xl p-6 flex flex-col justify-between space-y-6 shadow-xl group hover:border-[#D6A62E] transition-all hover:-translate-y-1"
            >
              {/* Step Number & Icon */}
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black font-display text-[#D6A62E]/40 group-hover:text-[#D6A62E] transition-colors">
                  {step.num}
                </span>
                <div className="p-3 rounded-xl bg-[#0B4035] border border-[#D6A62E]/30 group-hover:bg-[#D6A62E] group-hover:text-[#073B32] transition-colors">
                  {step.icon}
                </div>
              </div>

              {/* Step Content */}
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-[#F5F1E8] font-display">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#F5F1E8]/70 leading-relaxed">
                  {step.desc}
                </p>
              </div>

              {/* Progress Indicator line */}
              <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-[#D6A62E] h-full rounded-full transition-all duration-500" 
                  style={{ width: `${(idx + 1) * 25}%` }} 
                />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Booking Action Banner */}
        <div className="mt-14 p-6 sm:p-8 rounded-2xl bg-[#073B32] border border-[#D6A62E]/40 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-xl font-bold text-[#F5F1E8] font-display">
              Ready to give your vehicle a new life?
            </h4>
            <p className="text-xs sm:text-sm text-[#F5F1E8]/70">
              Average appointment takes less than 2 minutes to book online.
            </p>
          </div>
          <button
            id="how-it-works-book-btn"
            onClick={() => setView('booking')}
            className="py-3 px-6 rounded-xl bg-[#D6A62E] hover:bg-[#c39626] text-[#073B32] font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg whitespace-nowrap cursor-pointer"
          >
            <span>Book Your Service Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>
  );
};
