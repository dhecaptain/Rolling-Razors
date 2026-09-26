import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { cdnUrl, srcSet } from '../../utils/image';
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
  const [sliderPosition, setSliderPosition] = useState<number>(50); // 0 to 100% for Before/After

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
    <section id="portfolio-section" className="py-20 lg:py-28 bg-ink text-cream relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-3">
            <span className="text-xs font-bold text-gold uppercase tracking-widest bg-panel px-3.5 py-1.5 rounded-full border border-gold inline-flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5" /> PROVEN KENYAN CRAFTSMANSHIP
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-display tracking-tight text-cream">
              Our Work & Masterpieces
            </h2>
            <p className="text-sm sm:text-base text-cream max-w-xl">
              Inspect real transformations completed in our workshop. From worn-out taxi interiors to executive luxury cruisers.
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center flex-wrap gap-1.5 p-1.5 bg-panel rounded-xl border border-white/10">
            {categories.map((cat) => (
              <button
                key={cat}
                id={`filter-portfolio-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setActiveCategory(cat)}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-gold text-ink shadow-sm'
                    : 'text-cream hover:text-white hover:bg-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Before & After Interactive Showcase */}
        {featuredBeforeAfter && featuredBeforeAfter.beforeImage && (
          <div className="mb-14 bg-panel border-2 border-gold rounded-2xl overflow-hidden shadow-2xl p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-6">
              <div>
                <span className="text-xs font-bold text-gold uppercase tracking-wider flex items-center gap-1">
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Interactive Before / After Comparison
                </span>
                <h3 className="text-2xl font-bold text-cream font-display mt-1">
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
                <ChevronRight className="w-4 h-4 text-gold" />
                <span className="px-3 py-1 rounded-full bg-gold text-ink font-black">
                  AFTER: Rolling Razors Custom Leather
                </span>
              </div>
            </div>

            {/* Draggable Slider Container */}
            <div 
              className="relative w-full h-[360px] sm:h-[460px] rounded-xl overflow-hidden select-none cursor-ew-resize border border-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-goldfocus-visible: focus-visible:ring-offset-2 focus-visible:ring-offset-panel"
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
              <div className="absolute top-4 right-4 bg-gold text-ink text-xs font-black px-3 py-1 rounded-md shadow-lg pointer-events-none">
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
                className="absolute top-0 bottom-0 w-1 bg-gold shadow-2xl z-20 pointer-events-none flex items-center justify-center"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="w-9 h-9 rounded-full bg-gold text-ink flex items-center justify-center shadow-2xl border-2 border-ink font-black text-xs">
                  ↔
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-panel rounded-2xl overflow-hidden border border-gold hover:border-gold transition-all duration-300 shadow-xl group flex flex-col justify-between"
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
                <div className="absolute inset-0 bg-gradient-to-t from-panel via-transparent to-transparent" />
                
                {/* Category Pill */}
                <div className="absolute top-3 left-3 bg-ink border border-gold text-gold text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md backdrop-blur-sm">
                  {item.category}
                </div>
              </div>

              <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <h4 className="text-lg font-bold text-cream font-display group-hover:text-gold transition-colors">
                    {item.title}
                  </h4>
                  
                  <div className="flex items-center gap-3 text-xs text-white/70">
                    <span className="flex items-center gap-1">
                      <Car className="w-3.5 h-3.5 text-gold" /> {item.service}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gold" /> {item.location}
                    </span>
                  </div>

                  <p className="text-xs text-white/75 leading-relaxed pt-1">
                    {item.description}
                  </p>
                </div>

                {/* Tags */}
                <div className="pt-3 border-t border-white/10 flex flex-wrap gap-1">
                  {item.tags.map((tag, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-ink text-white/60">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
