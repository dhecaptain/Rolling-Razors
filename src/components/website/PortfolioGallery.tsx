import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { cdnUrl, srcSet } from '../../utils/image';
import { Reveal } from './Reveal';
import { 
  MapPin, 
  Car, 
  Scissors, 
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';

export const PortfolioGallery: React.FC = () => {
  const { portfolio, setView, setBookingWizardInitialServiceId } = useApp();
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const reduce = useReducedMotion();

  const categories = ['All', 'Car Interiors', 'Seats', 'Leather', 'Cushions', 'Canvas', 'Before & After'];

  const filteredItems = portfolio.filter(item => {
    if (activeCategory === 'All') return true;
    return item.category === activeCategory;
  });

  const featuredBeforeAfter = portfolio.find(item => item.beforeImage && item.afterImage) || portfolio[0];

  const handleSliderKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setSliderPosition(prev => Math.max(0, prev - 5));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setSliderPosition(prev => Math.min(100, prev + 5));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setSliderPosition(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setSliderPosition(100);
    }
  };

  return (
    <section id="portfolio-section" className="py-20 lg:py-28 bg-[#073B32] text-[#F5F1E8] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-3">
            <span className="text-xs font-bold text-[#D6A62E] uppercase tracking-widest bg-[#0B4035] px-3.5 py-1.5 rounded-full border border-[#D6A62E]/30 inline-flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5" /> PROVEN KENYAN CRAFTSMANSHIP
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-display tracking-tight text-[#F5F1E8]">
              Our Work & Masterpieces
            </h2>
            <p className="text-sm sm:text-base text-[#F5F1E8]/75 max-w-xl">
              Inspect real transformations completed in our workshop. From worn-out taxi interiors to executive luxury cruisers.
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center flex-wrap gap-1.5 p-1.5 bg-[#0B4035] rounded-xl border border-white/10">
            {categories.map((cat) => (
              <button
                key={cat}
                id={`filter-portfolio-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setActiveCategory(cat)}
                className={`relative py-1.5 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  activeCategory === cat
                    ? 'text-[#073B32]'
                    : 'text-[#F5F1E8]/70 hover:text-white'
                }`}
              >
                {activeCategory === cat && (
                  <motion.div
                    layoutId="portfolioFilterPill"
                    className="absolute inset-0 bg-[#D6A62E] rounded-lg"
                    transition={reduce ? {} : { type: 'spring', stiffness: 400, damping: 28 }}
                  />
                )}
                <span className="relative z-10">{cat}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Before & After Interactive Showcase */}
        {featuredBeforeAfter && featuredBeforeAfter.beforeImage && (
          <div className="mb-14 bg-[#0B4035] border-2 border-[#D6A62E]/40 rounded-2xl overflow-hidden shadow-2xl p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-6">
              <div>
                <span className="text-xs font-bold text-[#D6A62E] uppercase tracking-wider flex items-center gap-1">
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Interactive Before / After Comparison
                </span>
                <h3 className="text-2xl font-bold text-[#F5F1E8] font-display mt-1">
                  {featuredBeforeAfter.title}
                </h3>
                <p className="text-xs text-white/70 mt-1">
                  Drag the center slider left or right to reveal the full cabin craftsmanship overhaul.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="px-3 py-1 rounded-full bg-black/40 text-white/80 border border-white/10 font-bold">
                  BEFORE: Worn Factory Fabric
                </span>
                <ChevronRight className="w-4 h-4 text-[#D6A62E]" />
                <span className="px-3 py-1 rounded-full bg-[#D6A62E] text-[#073B32] font-black">
                  AFTER: Rolling Razors Custom Leather
                </span>
              </div>
            </div>

            {/* Draggable Slider Container */}
            <div 
              className="relative w-full h-[360px] sm:h-[460px] rounded-xl overflow-hidden select-none cursor-ew-resize border border-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D6A62E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B4035]"
              role="slider"
              tabIndex={0}
              aria-label="Before and after comparison slider. Use left and right arrow keys to compare."
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(sliderPosition)}
              aria-valuetext={`${Math.round(sliderPosition)}% before, ${100 - Math.round(sliderPosition)}% after`}
              onKeyDown={handleSliderKeyDown}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                setSliderPosition((x / rect.width) * 100);
              }}
              onTouchMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const touch = e.touches[0];
                const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
                setSliderPosition((x / rect.width) * 100);
              }}
            >
              {/* After Image (Full background) */}
              <img
                src={cdnUrl(featuredBeforeAfter.afterImage || featuredBeforeAfter.image, { w: 1200 })}
                srcSet={srcSet(featuredBeforeAfter.afterImage || featuredBeforeAfter.image, [800, 1200, 1600])}
                sizes="(max-width: 1024px) 100vw, 80vw"
                alt="After custom interior handcrafted by Rolling Razors Customs"
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 bg-[#D6A62E] text-[#073B32] text-xs font-black px-3 py-1 rounded-md shadow-lg pointer-events-none">
                AFTER (Handcrafted)
              </div>

              {/* Before Image (Clipped overlay) */}
              <div 
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${sliderPosition}%` }}
              >
                <img
                  src={cdnUrl(featuredBeforeAfter.beforeImage || featuredBeforeAfter.image, { w: 1200 })}
                  srcSet={srcSet(featuredBeforeAfter.beforeImage || featuredBeforeAfter.image, [800, 1200, 1600])}
                  sizes="(max-width: 1024px) 100vw, 80vw"
                  alt="Before interior restoration"
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover max-w-none"
                  style={{ width: '100%', minWidth: '100%' }}
                />
                <div className="absolute top-4 left-4 bg-black/80 text-white text-xs font-bold px-3 py-1 rounded-md border border-white/20 shadow-lg pointer-events-none">
                  BEFORE (Original)
                </div>
              </div>

              {/* Center Draggable Bar */}
              <div 
                className="absolute top-0 bottom-0 w-1 bg-[#D6A62E] shadow-2xl z-20 pointer-events-none flex items-center justify-center"
                style={{ left: `${sliderPosition}%` }}
              >
                <motion.div
                  whileHover={reduce ? {} : { scale: 1.15 }}
                  transition={reduce ? {} : { type: 'spring', stiffness: 500, damping: 20 }}
                  className="w-9 h-9 rounded-full bg-[#D6A62E] text-[#073B32] flex items-center justify-center shadow-2xl border-2 border-[#073B32] font-black text-xs"
                >
                  ↔
                </motion.div>
              </div>
            </div>
          </div>
        )}

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item, idx) => (
            <Reveal key={item.id} delay={idx * 0.06}>
            <div
              className="bg-[#0B4035] rounded-2xl overflow-hidden border border-[#D6A62E]/20 hover:border-[#D6A62E] transition-all duration-300 shadow-xl group flex flex-col justify-between"
            >
              <div className="relative h-60 overflow-hidden">
                <img
                  src={cdnUrl(item.image, { w: 600 })}
                  srcSet={srcSet(item.image, [400, 600, 800])}
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  alt={item.title}
                  loading="lazy"
                  decoding="async"
                  width={600}
                  height={400}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B4035] via-transparent to-transparent" />
                
                {/* Category Pill */}
                <div className="absolute top-3 left-3 bg-[#073B32]/90 border border-[#D6A62E]/40 text-[#D6A62E] text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md backdrop-blur-sm">
                  {item.category}
                </div>
              </div>

              <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <h4 className="text-lg font-bold text-[#F5F1E8] font-display group-hover:text-[#D6A62E] transition-colors">
                    {item.title}
                  </h4>
                  
                  <div className="flex items-center gap-3 text-xs text-white/70">
                    <span className="flex items-center gap-1">
                      <Car className="w-3.5 h-3.5 text-[#D6A62E]" /> {item.service}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#D6A62E]" /> {item.location}
                    </span>
                  </div>

                  <p className="text-xs text-white/75 leading-relaxed pt-1">
                    {item.description}
                  </p>
                </div>

                {/* Tags */}
                <div className="pt-3 border-t border-white/10 flex flex-wrap gap-1">
                  {item.tags.map((tag, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-[#073B32] text-white/60">
                      #{tag}
                    </span>
                  ))}
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
