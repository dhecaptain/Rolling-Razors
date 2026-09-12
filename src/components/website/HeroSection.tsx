import React, { Suspense, lazy } from 'react';
import { motion, useScroll, useTransform, useReducedMotion, AnimatePresence } from 'motion/react';
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

const LeatherStitchCanvas = lazy(() => import('./LeatherStitchCanvas'));

export const HeroSection: React.FC = () => {
  const { setView, setBookingWizardInitialServiceId } = useApp();
  const reduce = useReducedMotion();
  const [show3D, setShow3D] = React.useState(false);

  // Mount the 3D canvas only after first paint so critical content loads instantly
  React.useEffect(() => {
    if (reduce) return;
    const raf = window.requestAnimationFrame(() => {
      const idle = 'requestIdleCallback' in window
        ? (window as any).requestIdleCallback
        : (cb: () => void) => setTimeout(cb, 400);
      idle(() => setShow3D(true));
    });
    return () => cancelAnimationFrame(raf);
  }, [reduce]);

  const handleBookNow = () => {
    setBookingWizardInitialServiceId(null);
    setView('booking');
  };

  const handleExploreServices = () => {
    const el = document.getElementById('services-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Scrolling parallax + fade on the hero background
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 900], [0, 180]);
  const bgOpacity = useTransform(scrollY, [0, 700], [1, 0.5]);

  const fadeIn = (delay: number) => ({
    initial: reduce ? {} : { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <section
      id="hero-section"
      className="relative min-h-[92vh] pt-28 pb-16 lg:pt-36 lg:pb-24 flex flex-col justify-between overflow-hidden bg-[#073B32]"
    >
      {/* Background Cinematic Interior Image with Forest Green Gradients */}
      <div className="absolute inset-0 z-0">
        <motion.div style={reduce ? undefined : { y: bgY, opacity: bgOpacity }} className="absolute inset-0 -inset-y-24">
          <motion.img
            src={cdnUrl("/images/upholstery/upholstery-01.jpg", { w: 1600, q: 75 })}
            srcSet={`${cdnUrl("/images/upholstery/upholstery-01.jpg", { w: 800 })} 800w, ${cdnUrl("/images/upholstery/upholstery-01.jpg", { w: 1600 })} 1600w`}
            sizes="100vw"
            alt="Rolling Razors Customs Handcrafted Leather Car Interior"
            fetchPriority="high"
            decoding="async"
            initial={{ scale: 1.06 }}
            animate={reduce ? { scale: 1.06 } : { scale: [1.06, 1.14, 1.06] }}
            transition={reduce ? {} : { duration: 22, repeat: Infinity, ease: 'easeInOut' }}
            className="w-full h-full object-cover object-center"
          />
        </motion.div>
        {/* Forest Green Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#073B32] via-[#073B32]/90 to-[#073B32]/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#073B32] via-transparent to-[#073B32]/40" />

        {/* Subtle Workshop Stitch Texture Pattern */}
        <div className="absolute inset-0 opacity-10 bg-leather-texture pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          {/* Left Column: Hero Narrative */}
          <div className="lg:col-span-7 space-y-6 lg:pr-4">
            {/* Tagline / Sub-badge */}
            <motion.div {...fadeIn(0.05)} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0B4035]/90 border border-[#D6A62E]/40 backdrop-blur-md shadow-sm">
              <Scissors className="w-3.5 h-3.5 text-[#D6A62E]" />
              <span className="font-signature text-base md:text-lg text-[#D6A62E] font-bold tracking-wide">
                Your Vision, Our Craftsmanship.
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1 {...fadeIn(0.15)} className="text-4xl sm:text-5xl md:text-6xl font-black text-[#F5F1E8] tracking-tight leading-[1.08] font-display">
              Transform Your Ride. <br />
              <span className="text-[#D6A62E]">Built Around Your Vision.</span>
            </motion.h1>

            {/* Supporting text */}
            <motion.p {...fadeIn(0.25)} className="text-base sm:text-lg text-[#F5F1E8]/85 max-w-2xl leading-relaxed font-normal">
              Professional car upholstery, custom cushions, leather work, and bespoke vehicle interior transformations — meticulously handcrafted for Kenyan roads and drivers.
            </motion.p>

            {/* CTAs */}
            <motion.div {...fadeIn(0.35)} className="flex flex-wrap items-center gap-4 pt-2">
              <motion.button
                id="hero-primary-book-btn"
                onClick={handleBookNow}
                whileHover={reduce ? {} : { y: -3, boxShadow: '0 24px 48px -12px rgba(214,166,46,0.45)' }}
                whileTap={reduce ? {} : { scale: 0.97 }}
                className="py-3.5 px-7 rounded-xl bg-[#D6A62E] hover:bg-[#c39626] text-[#073B32] font-black text-sm uppercase tracking-wider flex items-center gap-2.5 shadow-xl cursor-pointer"
              >
                <span>Book a Service</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>

              <motion.button
                id="hero-secondary-explore-btn"
                onClick={handleExploreServices}
                whileHover={reduce ? {} : { y: -3 }}
                whileTap={reduce ? {} : { scale: 0.97 }}
                className="py-3.5 px-6 rounded-xl bg-[#0B4035]/80 hover:bg-[#0e4e41] border border-[#D6A62E]/50 text-[#F5F1E8] font-bold text-sm transition-colors cursor-pointer"
              >
                Explore Our Services
              </motion.button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div {...fadeIn(0.45)} className="pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-[#F5F1E8]/90 font-medium">
              <motion.div whileHover={reduce ? {} : { y: -2 }} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#D6A62E] shrink-0" />
                <span>Custom Made</span>
              </motion.div>
              <motion.div whileHover={reduce ? {} : { y: -2 }} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#D6A62E] shrink-0" />
                <span>Quality Craftsmanship</span>
              </motion.div>
              <motion.div whileHover={reduce ? {} : { y: -2 }} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#D6A62E] shrink-0" />
                <span>Built to Last</span>
              </motion.div>
              <motion.div whileHover={reduce ? {} : { y: -2 }} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#D6A62E] shrink-0" />
                <span>Kenyan Based</span>
              </motion.div>
            </motion.div>

            {/* Social Proof Mini Bar */}
            <motion.div {...fadeIn(0.55)} className="flex items-center gap-3 pt-1 text-xs text-white/70">
              <div className="flex -space-x-2">
                <div className="inline-flex h-7 w-7 items-center justify-center rounded-full ring-2 ring-[#073B32] bg-[#0B4035] text-[10px] font-bold text-[#D6A62E]">BM</div>
                <div className="inline-flex h-7 w-7 items-center justify-center rounded-full ring-2 ring-[#073B32] bg-[#0B4035] text-[10px] font-bold text-[#D6A62E]">AK</div>
                <div className="inline-flex h-7 w-7 items-center justify-center rounded-full ring-2 ring-[#073B32] bg-[#0B4035] text-[10px] font-bold text-[#D6A62E]">MN</div>
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
            </motion.div>

          </div>

          {/* Right Column: 3D Leather Stage + Quick Booking Widget */}
          <motion.div
            initial={reduce ? {} : { opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 w-full relative"
          >
            {/* Interactive 3D Leather Stitch Backdrop */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden opacity-60 pointer-events-none" aria-hidden="true">
              {show3D ? (
                <Suspense fallback={<div className="absolute inset-0 animate-pulse bg-[#0B4035]/50" />}>
                  <LeatherStitchCanvas />
                </Suspense>
              ) : (
                <div className="absolute inset-0 bg-[#0B4035]/60" />
              )}
            </div>

            <div className="relative z-10">
              <QuickBookingWidget />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};