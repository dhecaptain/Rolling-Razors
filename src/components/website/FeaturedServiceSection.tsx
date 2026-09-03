import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { cdnUrl } from '../../utils/image';
import { motion } from 'motion/react';
import {
  Sparkles,
  ArrowRight,
  Check,
  Palette,
  Scissors,
  Layers,
} from 'lucide-react';

export const FeaturedServiceSection: React.FC = () => {
  const { setView, setBookingWizardInitialServiceId, setBookingWizardDraft } = useApp() as any;

  const [activeMaterial, setActiveMaterial] = useState('Genuine Nappa Leather');
  const [activeColor, setActiveColor] = useState('Saddle Brown & Black');
  const [activePattern, setActivePattern] = useState('Diamond Quilted');

  const materials = [
    { name: 'Genuine Nappa Leather', desc: 'Silky smooth, high durability', image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80' },
    { name: 'Italian Full Grain', desc: 'Full grain natural cowhide', image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80' },
    { name: 'Heavy-Duty Commercial Vinyl', desc: '100% waterproof, tear resistant', image: 'https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?auto=format&fit=crop&w=1200&q=80' },
    { name: 'Alcantara Suede & Leather Combo', desc: 'Velvety grip, heat dissipating', image: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80' }
  ];

  const colors = [
    { name: 'Saddle Brown & Black', hex: '#8C5E3C', border: 'border-[#8C5E3C]' },
    { name: 'Cognac Tan & Jet Black', hex: '#C2844B', border: 'border-[#C2844B]' },
    { name: 'All Jet Black with Red Stitch', hex: '#1C1C1E', border: 'border-white/40' },
    { name: 'Deep Burgundy Wine', hex: '#58111A', border: 'border-[#58111A]' },
    { name: 'Forest Green & Gold Accent', hex: '#0B4035', border: 'border-[#0B4035]' }
  ];

  const patterns = [
    { name: 'Diamond Quilted', overlay: 'diamond' as const },
    { name: 'Double French Stitch', overlay: 'french' as const },
    { name: 'Honeycomb Hexagon', overlay: 'hex' as const },
    { name: 'Perforated Motorsport', overlay: 'perforated' as const },
    { name: 'Classic Horizontal Pleats', overlay: 'ribs' as const }
  ];

  const activeMaterialData = materials.find(m => m.name === activeMaterial) || materials[0];
  const activeColorData = colors.find(c => c.name === activeColor) || colors[0];
  const activePatternData = patterns.find(p => p.name === activePattern) || patterns[0];

  const handleStartCustomBuild = () => {
    setBookingWizardInitialServiceId('srv-1');
    try {
      setBookingWizardDraft?.({
        material: activeMaterial,
        color: activeColor,
        pattern: activePattern,
      } as any);
      localStorage.setItem('rr_visualizer_draft', JSON.stringify({ material: activeMaterial, color: activeColor, pattern: activePattern }));
    } catch {}
    setView('booking');
  };

  return (
    <section id="featured-service-section" className="py-20 lg:py-28 bg-[#073B32] text-[#F5F1E8] relative overflow-hidden border-t border-b border-[#D6A62E]/20">
      
      {/* Background Subtle Grain */}
      <div className="absolute inset-0 bg-leather-texture opacity-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Eyebrow */}
        <div className="mb-10 text-center lg:text-left">
          <span className="text-xs font-bold text-[#D6A62E] uppercase tracking-widest bg-[#0B4035] px-3.5 py-1.5 rounded-full border border-[#D6A62E]/30 inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> FEATURED WORKSHOP SHOWCASE
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-display tracking-tight text-[#F5F1E8] mt-3">
            CUSTOM CAR INTERIORS
          </h2>
        </div>

        {/* Split Editorial Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Live Visualizer — updates on material/color/pattern */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative rounded-2xl overflow-hidden border-2 border-[#D6A62E]/40 shadow-2xl group bg-[#052822]">
              <motion.img
                key={activeMaterialData.image}
                src={cdnUrl(activeMaterialData.image, { w: 1200 })}
                alt={`Rolling Razors ${activeMaterial} interior in ${activeColor}`}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full h-[400px] sm:h-[480px] object-cover"
                loading="eager"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#073B32] via-transparent to-black/20 pointer-events-none" />
              <motion.div
                key={activeColor}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 pointer-events-none"
                style={{ backgroundColor: activeColorData.hex, opacity: 0.32, mixBlendMode: 'multiply' } as any}
              />
              <motion.div
                key={activePattern}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 pointer-events-none"
                style={{
                  opacity: activePatternData.overlay === 'perforated' ? 0.18 : 0.14,
                  backgroundImage:
                    activePatternData.overlay === 'diamond'
                      ? `repeating-linear-gradient(45deg, transparent 0 14px, rgba(214,166,46,0.18) 14px 15px), repeating-linear-gradient(-45deg, transparent 0 14px, rgba(214,166,46,0.18) 14px 15px)`
                      : activePatternData.overlay === 'hex'
                      ? `radial-gradient(circle at 1px 1px, rgba(214,166,46,0.22) 1.5px, transparent 0)`
                      : activePatternData.overlay === 'french'
                      ? `repeating-linear-gradient(90deg, transparent 0 32px, rgba(214,166,46,0.15) 32px 33px)`
                      : activePatternData.overlay === 'perforated'
                      ? `radial-gradient(circle, rgba(0,0,0,0.35) 1.2px, transparent 1.6px)`
                      : `repeating-linear-gradient(0deg, transparent 0 18px, rgba(214,166,46,0.12) 18px 19px)`,
                  backgroundSize: activePatternData.overlay === 'hex' || activePatternData.overlay === 'perforated' ? '14px 14px' : 'auto',
                }}
              />
              <div className="absolute top-3 left-3 bg-[#073B32]/90 backdrop-blur-md border border-[#D6A62E]/30 px-2.5 py-1 rounded-full text-[10px] font-bold text-[#D6A62E] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: activeColorData.hex }} />
                {activeMaterial} • {activeColor}
              </div>
              
              {/* Dynamic Floating Spec Card */}
              <div className="absolute bottom-4 left-4 right-4 bg-[#0B4035]/95 backdrop-blur-md p-4 rounded-xl border border-[#D6A62E]/40 shadow-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/60">Live Customization Preview</span>
                  <span className="text-[#D6A62E] font-bold">100% Bespoke Crafting</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold">
                  <div className="bg-[#073B32] p-2 rounded-lg border border-white/5">
                    <span className="text-[10px] text-white/50 block">MATERIAL</span>
                    <span className="text-[#F5F1E8] truncate block">{activeMaterial}</span>
                  </div>
                  <div className="bg-[#073B32] p-2 rounded-lg border border-white/5">
                    <span className="text-[10px] text-white/50 block">COLOR</span>
                    <span className="text-[#D6A62E] truncate block">{activeColor}</span>
                  </div>
                  <div className="bg-[#073B32] p-2 rounded-lg border border-white/5">
                    <span className="text-[10px] text-white/50 block">PATTERN</span>
                    <span className="text-[#F5F1E8] truncate block">{activePattern}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Customization Specs & Selection */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl font-bold font-display text-[#F5F1E8]">
                "Your Interior. Your Style."
              </h3>
              <p className="text-sm sm:text-base text-[#F5F1E8]/80 leading-relaxed">
                Whether you drive a daily commuter, an executive SUV, or a commercial fleet vehicle, our master upholsterers tailor every millimeter to your lifestyle.
              </p>
            </div>

            {/* Customization Points */}
            <div className="space-y-5 bg-[#0B4035] p-6 rounded-2xl border border-[#D6A62E]/30 shadow-lg">
              
              {/* 1. Seat Material */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#D6A62E] uppercase tracking-wider flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5" /> 1. Select Seat Material
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {materials.map((mat) => (
                    <button
                      key={mat.name}
                      onClick={() => setActiveMaterial(mat.name)}
                      className={`p-2.5 rounded-xl text-left border transition-all ${
                        activeMaterial === mat.name
                          ? 'bg-[#073B32] border-[#D6A62E] text-white ring-1 ring-[#D6A62E]'
                          : 'bg-[#073B32]/50 border-white/5 text-white/70 hover:border-white/20'
                      }`}
                    >
                      <div className="font-bold text-xs text-[#F5F1E8]">{mat.name}</div>
                      <div className="text-[10px] text-white/50 truncate">{mat.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Color Palette */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#D6A62E] uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" /> 2. Color Palette & Tone
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {colors.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setActiveColor(c.name)}
                      className={`flex items-center gap-2 py-1.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                        activeColor === c.name
                          ? 'bg-[#073B32] border-[#D6A62E] text-white ring-1 ring-[#D6A62E]'
                          : 'bg-[#073B32]/40 border-white/10 text-white/70 hover:bg-[#073B32]'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-inner" style={{ backgroundColor: c.hex }} />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Stitching & Patterns */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#D6A62E] uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> 3. Stitching Pattern & Foam Bolstering
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {patterns.map((pat) => (
                    <button
                      key={pat}
                      onClick={() => setActivePattern(pat)}
                      className={`py-1 px-2.5 rounded-lg text-xs font-medium border transition-all ${
                        activePattern === pat
                          ? 'bg-[#D6A62E] text-[#073B32] border-[#D6A62E] font-bold'
                          : 'bg-[#073B32] text-white/80 border-white/10 hover:border-white/30'
                      }`}
                    >
                      {pat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom features checklist */}
              <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2 text-xs text-white/80">
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#25D366]" />
                  <span>Custom Cushion Thickness</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#25D366]" />
                  <span>Door Panels & Console Match</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#25D366]" />
                  <span>Orthopedic Lumbar Support</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#25D366]" />
                  <span>1-Year Quality Warranty</span>
                </div>
              </div>

            </div>

            {/* CTA */}
            <button
              id="start-custom-build-btn"
              onClick={handleStartCustomBuild}
              className="w-full py-4 px-6 rounded-xl bg-[#D6A62E] hover:bg-[#c39626] text-[#073B32] font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Start Your Custom Build</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </div>

        </div>
      </div>
    </section>
  );
};
