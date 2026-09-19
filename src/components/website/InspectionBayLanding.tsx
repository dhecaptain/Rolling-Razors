import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  MessageCircle,
  MoveHorizontal,
  Navigation,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BUSINESS_CONFIG } from '../../config/business';
import { PortfolioItem, Review, Service, VehicleType } from '../../types';
import type { LeatherType } from '../three/textures';
import Reveal from './Reveal';
import { Tilt } from './Tilt';
import { Footer } from './Footer';
import { resolveWebsiteAsset } from '../../config/assets';
import { DUR, EASE, STAGGER } from '../../lib/motion';

const SeatPreview = lazy(() => import('../three/SeatPreview'));

type LandingLocation = 'workshop' | 'customer_location';

type FittingDraft = {
  vehicleType: VehicleType;
  preferredDate: string;
  preferredTime: string;
  locationType: LandingLocation;
};

type BuildDraft = {
  material: string;
  color: string;
  pattern: string;
};

const VEHICLE_TYPES: VehicleType[] = ['Car', 'SUV', 'Van', 'Truck', 'Matatu', 'Other'];
const TIME_SLOTS = ['8:00 AM - 10:00 AM', '10:00 AM - 12:00 PM', '1:00 PM - 3:00 PM', '3:00 PM - 5:00 PM'];
const PORTFOLIO_FILTERS: Array<{ label: string; value: PortfolioItem['category'] }> = [
  { label: 'All work', value: 'All' },
  { label: 'Car interiors', value: 'Car Interiors' },
  { label: 'Seats', value: 'Seats' },
  { label: 'Leather', value: 'Leather' },
  { label: 'Cushions', value: 'Cushions' },
  { label: 'Canvas', value: 'Canvas' },
  { label: 'Before & after', value: 'Before & After' },
];

const MATERIALS = [
  { name: 'Genuine Nappa Leather', shortName: 'Genuine Nappa Leather', desc: 'Silky smooth / durable', image: '/images/upholstery/upholstery-02.jpg' },
  { name: 'Italian Full Grain', shortName: 'Italian Full Grain', desc: 'Natural cowhide', image: '/images/upholstery/upholstery-10.jpg' },
  { name: 'Heavy-Duty Vinyl', shortName: 'Heavy-Duty Vinyl', desc: 'Waterproof / tear resistant', image: '/images/cushioning/cushioning-01.jpeg' },
  { name: 'Alcantara & Leather', shortName: 'Alcantara & Leather', desc: 'Velvety grip / cool touch', image: '/images/upholstery/upholstery-06.jpg' },
] as const;

const websiteImage = (source: string | undefined, alt: string, index = 0) => resolveWebsiteAsset(source, alt, index);

const COLORS = [
  { name: 'Saddle Brown & Black', primary: '#8C5E3C', secondary: '#111111' },
  { name: 'Cognac Tan & Jet Black', primary: '#C2844B', secondary: '#171717' },
  { name: 'Deep Burgundy Wine', primary: '#58111A', secondary: '#21070B' },
] as const;

const PATTERNS = [
  { name: 'Diamond Quilted', type: 'diamond' },
  { name: 'Double French Stitch', type: 'double' },
  { name: 'Perforated Motorsport', type: 'perforated' },
  { name: 'Classic Horizontal Pleats', type: 'pleats' },
] as const;

const LEATHER_TYPE_BY_NAME: Record<string, LeatherType> = {
  'Genuine Nappa Leather': 'nappa',
  'Italian Full Grain': 'full-grain',
  'Heavy-Duty Vinyl': 'vinyl',
  'Alcantara & Leather': 'alcantara',
};

const QUALITY_CHECKS = [
  ['Premium materials', 'Automotive-grade hides, UV-stabilized vinyl, and high-density foam selected for comfort and long-term durability.'],
  ['Measured craftsmanship', 'Projects are measured and hand-stitched around your driving position, bolster requirements, and style direction.'],
  ['Transparent booking', 'See the service estimate, deposit amount, fitting slot, and M-Pesa payment route before arrival.'],
  ['Built for Kenyan roads', 'Seams, foams, and materials are selected for dust roads, heat, rain, and heavy commercial use.'],
  ['One-year warranty', 'A 1-year warranty covers stitchwork, structural foams, and material seams across completed work.'],
] as const;

const formatKES = (amount: number) => `KES ${amount.toLocaleString('en-KE')}`;

const tomorrowISO = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().split('T')[0];
};

const SectionHeader: React.FC<{
  eyebrow: string;
  title: string;
  description: string;
  light?: boolean;
}> = ({ eyebrow, title, description, light = false }) => (
  <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
    <div>
      <p className={`rr-label ${light ? 'text-[#D6A62E]' : 'text-[#0B4035]/65'}`}>{eyebrow}</p>
      <h2 className={`mt-4 text-[2.2rem] font-black leading-[1.02] tracking-[-.035em] sm:text-[3.05rem] ${light ? 'text-[#F5F1E8]' : 'text-[#073B32]'}`}>
        {title}
      </h2>
    </div>
    <p className={`max-w-[460px] text-[14px] leading-6 ${light ? 'text-[#F5F1E8]/70' : 'text-[#073B32]/72'}`}>
      {description}
    </p>
  </div>
);

const StitchRule: React.FC<{ light?: boolean }> = ({ light = false }) => (
  <div className={`rr-stitch-rule ${light ? 'rr-stitch-rule-light' : ''}`} aria-hidden="true" />
);

const FittingRequest: React.FC<{
  services: Service[];
  onSubmit: (serviceId: string, draft: FittingDraft) => void;
}> = ({ services, onSubmit }) => {
  const [serviceId, setServiceId] = useState(services[0]?.id || 'srv-1');
  const [vehicleType, setVehicleType] = useState<VehicleType>('Car');
  const [preferredDate, setPreferredDate] = useState(tomorrowISO);
  const [preferredTime, setPreferredTime] = useState(TIME_SLOTS[1]);
  const [locationType, setLocationType] = useState<LandingLocation>('workshop');

  const selectedService = services.find((service) => service.id === serviceId) || services[0];

  return (
    <div className="w-full max-w-[490px] lg:mx-auto">
      <div className="flex items-start justify-between border-b border-[#F5F1E8]/18 pb-5">
        <div>
          <p className="rr-label text-[#D6A62E]">Fitting request</p>
          <h2 className="mt-2 text-[27px] font-black leading-tight text-[#F5F1E8]">Start with the work.</h2>
          <p className="mt-1 text-[13px] leading-5 text-[#F5F1E8]/68">Request a fitting time. We confirm availability with you.</p>
        </div>
        <div className="pl-4 text-right">
          <span className="block text-[11px] uppercase tracking-[.1em] text-[#F5F1E8]/55">Made simple</span>
          <strong className="text-[13px] text-[#D6A62E]">We guide every step</strong>
        </div>
      </div>

      <form
        className="space-y-5 pt-6"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(serviceId, { vehicleType, preferredDate, preferredTime, locationType });
        }}
      >
        <label className="block">
          <span className="mb-2 block text-[12px] font-bold text-[#F5F1E8]/68">01 / Choose a service</span>
          <span className="relative block">
            <select
              id="inspection-service-select"
              value={serviceId}
              onChange={(event) => setServiceId(event.target.value)}
              className="rr-control h-12 w-full appearance-none px-4 pr-10 text-[13px] font-semibold"
            >
              {services.map((service) => (
                <option key={service.id} value={service.id} className="bg-[#073B32] text-white">
                  {service.name}
                </option>
              ))}
            </select>
            <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#D6A62E]" />
          </span>
        </label>

        <fieldset>
          <legend className="mb-2 block text-[12px] font-bold text-[#F5F1E8]/68">02 / Vehicle type</legend>
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
            {VEHICLE_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                aria-pressed={vehicleType === type}
                onClick={() => setVehicleType(type)}
                className={`h-11 border text-[12px] font-bold transition-colors ${vehicleType === type ? 'border-[#D6A62E] bg-[#D6A62E] text-[#073B32]' : 'border-[#F5F1E8]/18 text-[#F5F1E8]/78 hover:border-[#D6A62E]/70 hover:text-[#F5F1E8]'}`}
              >
                {type}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-[12px] font-bold text-[#F5F1E8]/68">03 / Preferred date</span>
            <input
              id="inspection-preferred-date"
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={preferredDate}
              onChange={(event) => setPreferredDate(event.target.value)}
              className="rr-control h-12 w-full px-4 text-[13px] font-semibold"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-[12px] font-bold text-[#F5F1E8]/68">Preferred time</span>
            <select
              id="inspection-preferred-time"
              value={preferredTime}
              onChange={(event) => setPreferredTime(event.target.value)}
              className="rr-control h-12 w-full px-4 text-[13px] font-semibold"
            >
              {TIME_SLOTS.map((time) => (
                <option key={time} value={time} className="bg-[#073B32] text-white">
                  {time}
                </option>
              ))}
            </select>
          </label>
        </div>

        <fieldset>
          <legend className="mb-2 block text-[12px] font-bold text-[#F5F1E8]/68">04 / Fitting location</legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { value: 'workshop' as const, title: 'Rolling Razors Workshop', note: 'Industrial Area, Nairobi' },
              { value: 'customer_location' as const, title: 'Customer location', note: 'On-site / mobile fit' },
            ].map((location) => (
              <button
                key={location.value}
                type="button"
                aria-pressed={locationType === location.value}
                onClick={() => setLocationType(location.value)}
                className={`min-h-[64px] border px-3 text-left transition-colors ${locationType === location.value ? 'border-[#D6A62E] bg-[#073B32] text-[#F5F1E8]' : 'border-[#F5F1E8]/18 bg-[#073B32] text-[#F5F1E8]/74 hover:border-[#D6A62E]/60'}`}
              >
                <span className="block text-[12px] font-bold">{location.title}</span>
                <span className="mt-1 block text-[11px] text-[#F5F1E8]/62">{location.note}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <button type="submit" id="check-availability-submit-btn" className="rr-button-gold h-14 w-full text-[12px] tracking-[.12em]">
          CHECK AVAILABILITY <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};

const InspectionHero: React.FC<{
  services: Service[];
  onSubmit: (serviceId: string, draft: FittingDraft) => void;
}> = ({ services, onSubmit }) => {
  const slides = [
    {
      image: '/images/cushioning/cushioning-09.jpeg',
      alt: 'Finished custom vehicle seats in a workshop',
      eyebrow: 'Automotive upholstery',
      title: 'A better interior starts here.',
      description: 'We reshape seats, cabins, and details into interiors that feel personal, comfortable, and made for the road ahead.',
    },
    {
      image: '/images/steering/steering-09.jpg',
      alt: 'Custom stitched steering wheel',
      eyebrow: 'Details that matter',
      title: 'Make every drive feel yours.',
      description: 'From steering wheel stitching to custom trim, we bring your ideas to life with careful measurement and confident craft.',
    },
    {
      image: '/images/cushioning/cushioning-15.jpeg',
      alt: 'Custom vehicle interior work completed for a customer',
      eyebrow: 'Built around you',
      title: 'Comfort, character, and craft.',
      description: 'Choose your materials, colours, and finish. We help you create a vehicle interior you will be proud to step into.',
    },
  ] as const;
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [isPaused, slides.length]);

  useEffect(() => {
    const next = slides[(activeSlide + 1) % slides.length];
    const asset = websiteImage(next.image, next.alt, (activeSlide + 1) % slides.length);
    const preload = new Image();
    preload.src = asset.src;
  }, [activeSlide]);

  const slide = slides[activeSlide];

  return (
  <section id="hero-section" className="rr-section-forest border-b border-[#D6A62E]/30">
    <div className="relative min-h-[720px] overflow-hidden lg:min-h-[calc(100svh-72px)]">
      <div
        className="absolute inset-0 min-h-[580px] overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocus={() => setIsPaused(true)}
        onBlur={() => setIsPaused(false)}
      >
        {slides.map((item, index) => {
          const asset = websiteImage(item.image, item.alt, index);
          return <motion.img
            key={item.image}
            src={asset.src}
            sizes="(max-width: 1023px) 100vw, 58vw"
            alt={asset.alt}
            width={asset.width}
            height={asset.height}
            fetchPriority={index === 0 ? 'high' : 'auto'}
            loading={index === 0 ? 'eager' : 'lazy'}
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover [image-rendering:auto]"
            style={{ objectPosition: asset.focal, zIndex: index === activeSlide ? 1 : 0 }}
            initial={false}
            animate={{ opacity: index === activeSlide ? 1 : 0, scale: index === activeSlide ? 1.055 : 1 }}
            transition={{ opacity: { duration: DUR.hero, ease: EASE.expressive }, scale: { duration: 7, ease: 'linear' } }}
          />;
        })}
        <div className="absolute inset-0 bg-gradient-to-r from-[#073B32]/95 via-[#073B32]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#073B32]/95 via-transparent to-[#073B32]/10" />
        <div className="relative z-10 flex h-full max-w-[760px] flex-col justify-end px-6 pb-20 pt-32 sm:px-12 lg:px-20 lg:pb-24">
          <div key={slide.eyebrow} className="rr-hero-copy">
            <div className="mb-6 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[.18em] text-[#D6A62E]">
              <span className="h-px w-8 bg-[#D6A62E]" />
              EST. 2014 · NAIROBI UPHOLSTERY ATELIER
            </div>
            <h1 className="max-w-[760px] text-[3.3rem] font-black leading-[.94] tracking-[-.04em] text-[#F5F1E8] sm:text-[5rem] lg:text-[6.2rem]">
              {slide.title}
            </h1>
            <p className="mt-7 max-w-[560px] text-[16px] leading-7 text-[#F5F1E8]/84">
              {slide.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" id="hero-primary-book-btn" onClick={() => document.getElementById('fitting-request')?.scrollIntoView({ behavior: 'smooth' })} className="rr-button-gold h-12 px-6 text-[11px] tracking-[.08em]">BOOK A FITTING <ArrowRight aria-hidden="true" className="h-4 w-4" /></button>
              <button type="button" onClick={() => document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' })} className="rr-button-outline h-12 px-6 text-[11px] tracking-[.08em]">VIEW SERVICES</button>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-[#F5F1E8]/78">
            <span className="flex items-center gap-2"><CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5 text-[#D6A62E]" />Made in Nairobi</span>
            <span className="h-1 w-1 rounded-full bg-[#D6A62E]" />
            <span>Workshop or on-site fitting</span>
          </div>
          <div className="mt-8 flex items-center gap-4 border-t border-[#F5F1E8]/20 pt-5">
            <div className="flex items-center gap-2" role="tablist" aria-label="Hero stories">
              {slides.map((item, index) => (
                <button
                  key={item.eyebrow}
                  type="button"
                  role="tab"
                  aria-selected={activeSlide === index}
                  aria-label={`Show ${item.eyebrow}`}
                  onClick={() => setActiveSlide(index)}
                  className="flex h-11 w-14 items-center justify-center"
                >
                  <span className={`relative block h-0.5 overflow-hidden ${activeSlide === index ? 'w-14 bg-[#AFA99C]' : 'w-6 bg-[#AFA99C]'}`}>
                    {activeSlide === index && <motion.span key={`${activeSlide}-progress`} className="absolute inset-0 origin-left bg-[#D6A62E]" initial={{ scaleX: 0 }} animate={{ scaleX: isPaused ? 0 : 1 }} transition={{ duration: 7, ease: 'linear' }} />}
                  </span>
                </button>
              ))}
            </div>
            <span className="text-[11px] text-[#F5F1E8]/55">Explore our craft</span>
          </div>
        </div>
      </div>
    </div>
  </section>
  );
};

const ServiceInspectionBoard: React.FC<{
  services: Service[];
  onBook: (serviceId: string) => void;
}> = ({ services, onBook }) => {
  const [selectedId, setSelectedId] = useState(services[0]?.id || 'srv-1');
  const [showDetails, setShowDetails] = useState(false);
  const selectedService = services.find((service) => service.id === selectedId) || services[0];

  if (!selectedService) return null;

  return (
    <section id="services-section" className="rr-paper px-5 py-24 text-[#073B32] lg:px-12 lg:py-32">
      <div className="mx-auto max-w-[1280px]">
        <Reveal>
          <SectionHeader
            eyebrow="02 / Services"
            title="What can we transform?"
            description="Start with the part of your vehicle that needs attention. Choose a service to see what is included, how long it takes, and the starting investment."
          />
          <StitchRule />
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <div className="mb-4 flex items-end justify-between border-b border-[#073B32]/20 pb-4">
              <div><span className="rr-label text-[#4A6961]">Choose a starting point</span><p className="mt-2 text-sm text-[#2C4F47]">Tap a service to see the typical scope of work.</p></div>
              <span className="rr-tabular text-xs font-bold text-[#4A6961]">{services.length} services</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {services.map((service, index) => (
                <button
                  key={service.id}
                  type="button"
                  aria-label={service.name}
                  aria-pressed={selectedService.id === service.id}
                  onClick={() => { setSelectedId(service.id); setShowDetails(false); }}
                  className={`rr-service-row group flex min-h-[112px] w-full items-start gap-4 border p-4 text-left text-[#073B32] transition-colors ${selectedService.id === service.id ? 'is-active border-[#073B32]' : 'border-[#073B32]/15 bg-white hover:border-[#D6A62E] hover:bg-[#F9F6EF]'}`}
                >
                  <span className={`grid h-9 w-9 shrink-0 place-items-center border text-xs font-black ${selectedService.id === service.id ? 'border-[#D6A62E] bg-[#D6A62E] text-[#073B32]' : 'border-[#073B32]/20 text-[#4A6961]'}`}>{String(index + 1).padStart(2, '0')}</span>
                  <span className="min-w-0 flex-1"><span className={`block font-bold ${selectedService.id === service.id ? 'text-[#F5F1E8]' : ''}`}>{service.name}</span><span className={`mt-2 block text-xs leading-5 ${selectedService.id === service.id ? 'text-[#D7D2C6]' : 'text-[#4A6961]'}`}>{service.shortDesc}</span></span>
                  <ArrowRight aria-hidden="true" className={`mt-1 h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1 ${selectedService.id === service.id ? 'text-[#D6A62E]' : 'text-[#4A6961]'}`} />
                </button>
              ))}
            </div>
          </div>

          <figure className="relative min-h-[430px] overflow-hidden bg-[#073B32] lg:col-span-4">
            <img
              id="service-board-image"
              src={websiteImage(selectedService.image, `${selectedService.name} ${selectedService.shortDesc}`).src}
              sizes="(max-width: 1024px) 100vw, 42vw"
              alt={selectedService.name}
              width={websiteImage(selectedService.image, `${selectedService.name} ${selectedService.shortDesc}`).width}
              height={websiteImage(selectedService.image, `${selectedService.name} ${selectedService.shortDesc}`).height}
              style={{ objectPosition: websiteImage(selectedService.image, `${selectedService.name} ${selectedService.shortDesc}`).focal }}
              className="absolute inset-0 h-full w-full object-cover opacity-70"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 p-6 text-[#F5F1E8] sm:p-8">
              <div className="flex items-start justify-between border-b border-[#F5F1E8]/20 pb-5"><span className="rr-label text-[#D6A62E]">Selected service</span><span className="rr-tabular text-4xl font-black text-[#D6A62E]">{String(services.findIndex((service) => service.id === selectedService.id) + 1).padStart(2, '0')}</span></div>
              <p className="mt-10 max-w-[280px] text-sm leading-6 text-[#D7D2C6]">A clear starting scope for your vehicle, confirmed in person before work begins.</p>
              <ul className="mt-8 space-y-3 border-t border-[#F5F1E8]/20 pt-5 text-sm text-[#D7D2C6]">
                {selectedService.includedFeatures.slice(0, 3).map((feature) => <li key={feature} className="flex gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#D6A62E]" />{feature}</li>)}
              </ul>
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#073B32] via-[#073B32]/82 to-transparent px-5 pb-5 pt-24 text-[#F5F1E8]">
              <p className="rr-label text-[#D6A62E]">Selected work / {String(services.findIndex((service) => service.id === selectedService.id) + 1).padStart(2, '0')}</p>
              <figcaption id="service-board-title" className="mt-2 text-2xl font-black tracking-[-.025em]">{selectedService.name}</figcaption>
              <p className="mt-1 max-w-[410px] text-[12px] leading-5 text-[#F5F1E8]/76">{selectedService.shortDesc}</p>
            </div>
          </figure>

          <aside className="rr-deep flex flex-col justify-between p-6 text-[#F5F1E8] lg:col-span-3 lg:p-7">
            <div>
              <p className="rr-label text-[#D6A62E]">Service docket</p>
              <div className="mt-10 border-b border-[#F5F1E8]/16 pb-6">
                <span className="rr-label text-[#F5F1E8]/55">Starting price</span>
                <strong id="service-board-price" className="mt-3 block text-[25px] font-black text-[#D6A62E]">{formatKES(selectedService.startingPrice)}</strong>
              </div>
              <div className="border-b border-[#F5F1E8]/16 py-6">
                <span className="rr-label text-[#F5F1E8]/55">Time in workshop</span>
                <strong id="service-board-time" className="mt-3 block text-[16px]">{selectedService.estimatedDuration}</strong>
              </div>
              <div className="pt-6">
                <span className="rr-label text-[#F5F1E8]/55">What is included</span>
                <ul className="mt-4 space-y-3 text-[12px] leading-5 text-[#F5F1E8]/76">
                  {selectedService.includedFeatures.slice(0, 3).map((feature) => (
                    <li key={feature} className="flex gap-2"><span className="text-[#D6A62E]">—</span>{feature}</li>
                  ))}
                </ul>
                {showDetails && <p className="mt-4 border-t border-[#F5F1E8]/16 pt-4 text-[12px] leading-5 text-[#F5F1E8]/74">{selectedService.longDesc}</p>}
              </div>
            </div>
            <div className="mt-8 space-y-2">
              <button type="button" aria-expanded={showDetails} onClick={() => setShowDetails((visible) => !visible)} className="rr-button-outline h-12 w-full text-[12px]">
                {showDetails ? 'HIDE SERVICE DETAILS' : 'VIEW FULL DETAILS'} <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={() => onBook(selectedService.id)} className="rr-button-gold h-12 w-full text-[12px]">
                BOOK THIS SERVICE <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};

const BuildSpecification: React.FC<{ onBook: (draft: BuildDraft) => void }> = ({ onBook }) => {
  const { currentUser, authFetch, authVerifying } = useApp();
  const [activeMaterial, setActiveMaterial] = useState<string>(MATERIALS[0].name);
  const [activeColor, setActiveColor] = useState<string>(COLORS[0].name);
  const [activePattern, setActivePattern] = useState<string>(PATTERNS[0].name);
  const [focusOnSeats, setFocusOnSeats] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);
  const [hintVisible, setHintVisible] = useState(true);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const reduce = useReducedMotion();
  const previewPanelRef = useRef<HTMLDivElement>(null);
  const previewInView = useInView(previewPanelRef, { amount: 0.12 });

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      setWebgl(Boolean(gl));
      if (gl) (gl as WebGLRenderingContext).getExtension('WEBGL_lose_context')?.loseContext();
    } catch {
      setWebgl(false);
    }
  }, []);

  useEffect(() => {
    if (!previewReady) return;
    const timer = window.setTimeout(() => setHintVisible(false), 8000);
    return () => window.clearTimeout(timer);
  }, [previewReady]);

  const material = MATERIALS.find((option) => option.name === activeMaterial) || MATERIALS[0];
  const color = COLORS.find((option) => option.name === activeColor) || COLORS[0];
  const pattern = PATTERNS.find((option) => option.name === activePattern) || PATTERNS[0];
  const draft = useMemo(() => ({
    material: material.name,
    color: color.name,
    pattern: pattern.name,
  }), [color.name, material.name, pattern.name]);

  useEffect(() => {
    if (authVerifying) return;
    if (!currentUser) {
      setDraftLoaded(true);
      return;
    }
    let cancelled = false;
    void authFetch('/api/build-draft').then(async (response) => {
      if (!response.ok) return;
      const body = await response.json() as { draft?: Partial<BuildDraft> | null };
      if (cancelled || !body.draft) return;
      if (body.draft.material && MATERIALS.some((option) => option.name === body.draft?.material)) setActiveMaterial(body.draft.material);
      if (body.draft.color && COLORS.some((option) => option.name === body.draft?.color)) setActiveColor(body.draft.color);
      if (body.draft.pattern && PATTERNS.some((option) => option.name === body.draft?.pattern)) setActivePattern(body.draft.pattern);
    }).catch(() => {}).finally(() => {
      if (!cancelled) setDraftLoaded(true);
    });
    return () => { cancelled = true; };
  }, [authFetch, authVerifying, currentUser]);

  useEffect(() => {
    if (authVerifying || !currentUser || !draftLoaded) return;
    const timer = window.setTimeout(() => {
      void authFetch('/api/build-draft', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      }).catch(() => {});
    }, 350);
    return () => window.clearTimeout(timer);
  }, [authFetch, authVerifying, currentUser, draft]);

  const resetDraft = () => {
    setActiveMaterial(MATERIALS[0].name);
    setActiveColor(COLORS[0].name);
    setActivePattern(PATTERNS[0].name);
    setFocusOnSeats(false);
    if (currentUser) {
      void authFetch('/api/build-draft', { method: 'DELETE' }).catch(() => {});
    }
  };

  // Keep the real vehicle image visible as the reliable baseline; the configurator
  // should never leave a blank canvas while WebGL is loading or unavailable.
  const showPreview = false;

  return (
    <section id="spec-section" className="rr-section-forest relative overflow-hidden px-5 py-24 text-[#F5F1E8] lg:px-12 lg:py-32">
      <div className="mx-auto max-w-[1280px]">
        <Reveal>
          <SectionHeader light eyebrow="03 / Interior direction" title="Make it yours." description="Choose the leather, colour, and stitch pattern you want to explore." />
          <StitchRule light />
        </Reveal>

        <div className="relative mt-12 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
          <motion.div
            ref={previewPanelRef}
            className="relative overflow-hidden border border-[#D6A62E]/30 bg-[#052822] shadow-e3 lg:col-span-7"
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 36, rotateX: 5 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={reduce ? {} : { duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            style={{ perspective: 1200 }}
          >
            <div className="relative h-[420px] overflow-hidden sm:h-[520px]">
              {!previewReady && (
                <AnimatePresence mode="wait">
                  <motion.img
                    key={material.image}
                    id="spec-image"
                    src={websiteImage(material.image, `${activeMaterial} interior preview`).src}
                    sizes="(max-width: 1024px) 100vw, 58vw"
                    alt={`${activeMaterial} interior preview`}
                    width={websiteImage(material.image, `${activeMaterial} interior preview`).width}
                    height={websiteImage(material.image, `${activeMaterial} interior preview`).height}
                    style={{ objectPosition: websiteImage(material.image, `${activeMaterial} interior preview`).focal }}
                    initial={reduce ? { opacity: 1 } : { opacity: 0 }}
                    animate={{ opacity: 1, scale: focusOnSeats ? 1.12 : 1 }}
                    exit={{ opacity: 0 }}
                    transition={reduce ? { duration: 0 } : { duration: DUR.medium, ease: EASE.standard }}
                    className="absolute inset-0 h-full w-full object-cover object-center"
                    loading="lazy"
                    decoding="async"
                  />
                </AnimatePresence>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#073B32] via-transparent to-black/10" />
              <span className="absolute left-5 top-5 rounded-full border border-[#F5F1E8]/20 bg-[#073B32]/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-[#F5F1E8]/75 backdrop-blur-md">Vehicle interior / direction</span>
              <motion.button type="button" aria-pressed={focusOnSeats} onClick={() => setFocusOnSeats((focused) => !focused)} whileHover={reduce ? {} : { y: -2 }} whileTap={reduce ? {} : { scale: .96 }} className="absolute right-5 top-5 z-20 min-h-11 rounded-full border border-[#F5F1E8]/30 bg-[#073B32]/75 px-4 py-2 text-[11px] font-bold text-[#F5F1E8] backdrop-blur-md transition-colors hover:border-[#D6A62E]">
                {focusOnSeats ? 'ZOOM OUT' : 'ZOOM IN'} <ArrowUpRight aria-hidden="true" className="ml-1 inline h-3 w-3" />
              </motion.button>
              <div className="absolute inset-x-4 bottom-4 z-20 border-t border-dashed border-[#D6A62E]/65 pt-3 text-[13px] font-semibold text-[#F5F1E8]" aria-live="polite">
                <span id="spec-summary">{activeMaterial} <b className="px-1 text-[#D6A62E]">·</b> {activeColor} <b className="px-1 text-[#D6A62E]">·</b> {activePattern}</span>
                <span className="mt-1 block text-[11px] font-normal text-[#F5F1E8]/62">A visual starting point for your fitting.</span>
              </div>
              {showPreview && (
                <Suspense fallback={null}>
                  <motion.div className="absolute inset-0 z-10" initial={{ opacity: 0 }} animate={{ opacity: previewReady ? 1 : 0 }} transition={reduce ? { duration: 0 } : { duration: 0.55, ease: 'easeOut' }}>
                    <SeatPreview
                      primary={color.primary}
                      secondary={color.secondary}
                      pattern={pattern.type}
                      leatherType={LEATHER_TYPE_BY_NAME[material.name] ?? 'nappa'}
                      focusOnSeats={focusOnSeats}
                      reduce={reduce}
                      onReady={() => setPreviewReady(true)}
                      onInteract={() => setHintVisible(false)}
                    />
                  </motion.div>
                </Suspense>
              )}
              {showPreview && previewReady && hintVisible && (
                <motion.div className="pointer-events-none absolute bottom-16 left-1/2 z-20 -translate-x-1/2 rounded-full border border-[#F5F1E8]/25 bg-[#073B32]/80 px-4 py-2 text-[11px] font-bold uppercase tracking-[.14em] text-[#F5F1E8] backdrop-blur-md" initial={reduce ? { opacity: 1 } : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.4 }} aria-hidden="true">
                  Drag to rotate · Swipe on touch
                </motion.div>
              )}
            </div>
          </motion.div>

          <motion.div
            className="lg:col-span-5"
            initial={reduce ? { opacity: 1 } : { opacity: 0, x: 28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={reduce ? {} : { duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            <fieldset className="border-t border-[#F5F1E8]/20 pt-5">
              <legend className="flex w-full items-center justify-between rr-label text-[#D6A62E]"><span>M01 / Material</span><span className="text-[#F5F1E8]/45">Choose one</span></legend>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {MATERIALS.map((option, index) => (
                  <motion.button key={option.name} type="button" aria-pressed={activeMaterial === option.name} onClick={() => setActiveMaterial(option.name)} whileHover={reduce ? {} : { y: -5, rotate: index % 2 ? 1 : -1 }} whileTap={reduce ? {} : { scale: .97 }} className={`group relative min-h-[116px] overflow-hidden rounded-2xl border p-3 text-left transition-colors ${activeMaterial === option.name ? 'border-[#D6A62E] bg-[#D6A62E]/[.12] shadow-[0_10px_30px_rgba(214,166,46,.12)]' : 'border-[#F5F1E8]/18 bg-[#052822]/35 hover:border-[#D6A62E]/65'}`}>
                    <img src={websiteImage(option.image, `${option.name} material`).src} alt="" aria-hidden="true" width={1200} height={750} className="absolute inset-0 h-full w-full object-cover opacity-25 transition duration-500 group-hover:opacity-40" />
                    <span className="absolute inset-0 bg-gradient-to-t from-[#052822] via-[#052822]/75 to-transparent" />
                    <span className="relative block text-[12px] font-bold">{option.shortName}</span>
                    <span className="relative mt-1 block text-[11px] text-[#F5F1E8]/65">{option.desc}</span>
                    {activeMaterial === option.name && <motion.span layoutId="mat-ring" className="absolute right-3 top-3 h-2 w-2 rounded-full bg-[#D6A62E]" />}
                  </motion.button>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-7 border-t border-[#F5F1E8]/20 pt-4">
              <legend className="flex w-full items-center justify-between rr-label text-[#D6A62E]"><span>C01 / Colour pairing</span><span className="text-[#F5F1E8]/45">Choose one</span></legend>
              <div className="mt-4 space-y-2">
                {COLORS.map((option) => (
                  <motion.button key={option.name} type="button" aria-pressed={activeColor === option.name} onClick={() => setActiveColor(option.name)} whileHover={reduce ? {} : { x: 6 }} className={`flex min-h-[54px] w-full items-center gap-3 rounded-xl border px-3 text-left text-[12px] font-semibold transition-colors ${activeColor === option.name ? 'border-[#D6A62E] bg-[#D6A62E]/[.08]' : 'border-[#F5F1E8]/18 hover:border-[#D6A62E]/65'}`}>
                    <span className="flex h-8 w-10 shrink-0 overflow-hidden rounded-md border border-white/10"><span className="w-1/2" style={{ backgroundColor: option.primary }} /><span className="w-1/2" style={{ backgroundColor: option.secondary }} /></span>
                    {option.name}
                    {activeColor === option.name && <motion.span layoutId="col-ring" className="ml-auto h-2 w-2 rounded-full bg-[#D6A62E]" />}
                  </motion.button>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-7 border-t border-[#F5F1E8]/20 pt-4">
              <legend className="flex w-full items-center justify-between rr-label text-[#D6A62E]"><span>P01 / Stitch pattern</span><span className="text-[#F5F1E8]/45">Choose one</span></legend>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {PATTERNS.map((option) => (
                  <motion.button key={option.name} type="button" aria-pressed={activePattern === option.name} onClick={() => setActivePattern(option.name)} whileHover={reduce ? {} : { y: -3 }} className={`min-h-[70px] rounded-xl border p-3 text-left text-[12px] font-semibold transition-colors ${activePattern === option.name ? 'border-[#D6A62E] bg-[#D6A62E]/[.08] text-[#F5F1E8]' : 'border-[#F5F1E8]/20 text-[#F5F1E8]/76 hover:border-[#D6A62E]/70'}`}>
                    <span className={`mb-3 block h-4 w-full rounded-sm ${option.type === 'diamond' ? 'rr-pattern-diamond' : option.type === 'perforated' ? 'rr-pattern-dots' : option.type === 'pleats' ? 'rr-pattern-pleats' : 'rr-pattern-double'}`} aria-hidden="true" />
                    {option.name}
                    {activePattern === option.name && <motion.span layoutId="pat-ring" className="absolute right-3 top-3 h-2 w-2 rounded-full bg-[#D6A62E]" />}
                  </motion.button>
                ))}
              </div>
            </fieldset>

            <div className="mt-6 flex items-center justify-between gap-4 text-[11px] text-[#F5F1E8]/55">
              <span>{currentUser ? 'Configuration saved to your account.' : 'Sign in to save this configuration.'}</span>
              <button type="button" onClick={resetDraft} className="font-bold uppercase tracking-[.12em] text-[#D6A62E] transition-colors hover:text-[#F5F1E8]">
                Reset choices
              </button>
            </div>
            <motion.button type="button" onClick={() => onBook(draft)} whileHover={reduce ? {} : { scale: 1.02, boxShadow: '0 12px 30px rgba(214,166,46,.22)' }} whileTap={reduce ? {} : { scale: .98 }} className="rr-button-gold mt-4 h-14 w-full text-[12px] tracking-[.08em]">
              BOOK THIS INTERIOR BUILD <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </motion.button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const BookingRoute: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  const steps = [
    ['01', 'Choose a service', 'Select full upholstery, custom seats, leather work, steering stitching, cushions, shades, or a workshop service.'],
    ['02', 'Select a fitting time', 'Pick a preferred day and time slot. We check the workshop schedule before confirming the visit.'],
    ['03', 'Tell us about your vehicle', 'Add make, model, registration details and your preferred leather colour, stitch pattern, or fitting requirements.'],
    ['04', 'Bring it in & we transform it', 'Drive to our Nairobi workshop or request mobile fitting. Pay the deposit securely with M-Pesa.'],
  ] as const;

  return (
    <section id="booking-route" className="rr-section-panel px-5 py-24 text-[#F5F1E8] lg:px-12 lg:py-28">
      <div className="mx-auto max-w-[1280px]">
        <Reveal>
          <SectionHeader light eyebrow="04 / Booking handoff" title="From selection to fitting." description="Four clear steps take your request from a service choice to a confirmed Nairobi workshop appointment." />
        </Reveal>
        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="relative lg:col-span-8">
            <div className="absolute bottom-7 left-5 top-7 border-l border-dashed border-[#D6A62E]/45" aria-hidden="true" />
            {steps.map(([number, title, description], index) => (
              <div key={number} className="relative grid grid-cols-[48px_1fr] gap-4 border-t border-[#F5F1E8]/16 py-5 last:border-b sm:grid-cols-[62px_1fr] sm:gap-5">
                <span className={`relative z-10 grid h-12 w-12 place-items-center border text-[18px] font-black rr-tabular sm:h-14 sm:w-14 ${index === 0 ? 'border-[#D6A62E] text-[#D6A62E]' : index === 3 ? 'border-[#D6A62E] bg-[#D6A62E] text-[#073B32]' : 'border-[#F5F1E8]/20 text-[#F5F1E8]/65'}`}>{number}</span>
                <div>
                <h3 className="text-[16px] font-bold">{title}</h3>
                <p className="mt-2 max-w-[680px] text-[12px] leading-5 text-[#F5F1E8]/68">{description}</p>
                </div>
              </div>
            ))}
          </div>
          <Tilt className="self-end lg:col-span-4">
            <aside className="border-l-2 border-[#D6A62E] bg-[#052822] p-7">
              <p className="rr-label text-[#D6A62E]">Step 04 / Appointment</p>
              <h3 className="mt-4 text-[21px] font-black">Choose a fitting time.</h3>
              <p className="mt-2 text-[12px] leading-5 text-[#F5F1E8]/68">Free cancellation up to 24 hours before your appointment. M-Pesa deposit instructions appear before confirmation.</p>
              <button type="button" onClick={onStart} className="rr-button-gold mt-7 h-12 w-full text-[12px] tracking-[.08em]">START BOOKING <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" /></button>
            </aside>
          </Tilt>
        </div>
      </div>
    </section>
  );
};

const EvidenceGallery: React.FC<{ portfolio: PortfolioItem[] }> = ({ portfolio }) => {
  const [activeFilter, setActiveFilter] = useState<PortfolioItem['category']>('All');
  const [sliderPosition, setSliderPosition] = useState(46);
  const filteredItems = useMemo(() => portfolio.filter((item) => activeFilter === 'All' || item.category === activeFilter), [activeFilter, portfolio]);
  const featured = filteredItems.find((item) => item.beforeImage && item.afterImage) || filteredItems[0];
  const supportingItems = filteredItems.filter((item) => item.id !== featured?.id).slice(0, 4);

  const updateSlider = (clientX: number, rect: DOMRect) => {
    const percentage = ((clientX - rect.left) / rect.width) * 100;
    setSliderPosition(Math.max(3, Math.min(97, percentage)));
  };

  const handleSliderKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); setSliderPosition((value) => Math.max(3, value - 5)); }
    if (event.key === 'ArrowRight') { event.preventDefault(); setSliderPosition((value) => Math.min(97, value + 5)); }
    if (event.key === 'Home') { event.preventDefault(); setSliderPosition(3); }
    if (event.key === 'End') { event.preventDefault(); setSliderPosition(97); }
  };

  if (!featured) return null;

  return (
    <section id="portfolio-section" className="rr-paper px-5 py-24 text-[#073B32] lg:px-12 lg:py-28">
      <div className="mx-auto max-w-[1280px]">
        <Reveal>
          <SectionHeader eyebrow="05 / Inspection evidence" title="See the workmanship." description="Real transformations from Nairobi, Mombasa Road, Karen, and beyond. Compare the cabin before you browse the full work file." />
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-[#073B32]/20 py-3">
            {PORTFOLIO_FILTERS.map((filter) => (
              <button key={filter.value} type="button" aria-pressed={activeFilter === filter.value} onClick={() => setActiveFilter(filter.value)} className={`rr-filter ${activeFilter === filter.value ? 'is-active' : ''} text-[11px] font-bold`}>{filter.label}</button>
            ))}
          </div>
        </Reveal>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
          <div
            className="rr-comparison relative h-[360px] select-none overflow-hidden bg-[#0B4035] [touch-action:pan-y] sm:h-[520px] lg:col-span-9"
            role="slider"
            tabIndex={0}
            aria-label="Before and after comparison slider"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(sliderPosition)}
            aria-valuetext={`${Math.round(sliderPosition)}% before, ${100 - Math.round(sliderPosition)}% after`}
            onKeyDown={handleSliderKeyDown}
          >
            <img src={websiteImage(featured.afterImage || featured.image, `${featured.service} ${featured.title} after handcrafted work`, 1).src} alt={`${featured.title} after handcrafted work`} width={1600} height={1067} className="absolute inset-0 h-full w-full object-cover" loading="lazy" decoding="async" />
            <span className="absolute right-4 top-4 z-10 bg-[#D6A62E] px-3 py-2 text-[11px] font-black text-[#073B32]">AFTER / HANDCRAFTED</span>
            <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${sliderPosition}%` }}>
              <img src={websiteImage(featured.beforeImage || featured.image, `${featured.service} ${featured.title} before restoration`, 2).src} alt={`${featured.title} before restoration`} width={1600} height={1067} className="absolute left-0 top-0 h-full max-w-none object-cover" style={{ width: `${10000 / Math.max(sliderPosition, 1)}%` }} loading="lazy" decoding="async" />
              <span className="absolute left-4 top-4 z-10 bg-[#073B32] px-3 py-2 text-[11px] font-black text-[#F5F1E8]">BEFORE / ORIGINAL</span>
            </div>
            <div className="pointer-events-none absolute inset-y-0 left-1/2 z-20 w-14 -translate-x-1/2" style={{ transform: `translateX(${sliderPosition - 50}%)` }}>
              <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[#D6A62E]" />
              <button
                type="button"
                aria-label="Drag comparison handle"
                className="pointer-events-auto absolute left-1/2 top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-[#073B32] bg-[#D6A62E] text-sm font-black text-[#073B32]"
                onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); updateSlider(event.clientX, event.currentTarget.closest('.rr-comparison')?.getBoundingClientRect() || new DOMRect()); }}
                onPointerMove={(event) => { if (event.buttons === 1) { const rect = event.currentTarget.closest('.rr-comparison')?.getBoundingClientRect(); if (rect) updateSlider(event.clientX, rect); } }}
              ><MoveHorizontal aria-hidden="true" className="h-5 w-5" /></button>
              <span className="absolute left-1/2 top-[calc(50%+38px)] -translate-x-1/2 whitespace-nowrap bg-[#073B32] px-3 py-1.5 text-[11px] font-semibold text-[#F5F1E8]">Drag to compare</span>
            </div>
            <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-3 bg-[#073B32]/80 px-2 py-1 text-[11px] text-[#F5F1E8]" aria-hidden="true"><span>←</span><span>→</span></div>
          </div>
          <aside className="lg:col-span-3">
            <p className="rr-label text-[#073B32]/55">Featured file / P-01</p>
            <h3 className="mt-4 text-[20px] font-black leading-tight tracking-[-.04em]">{featured.title}</h3>
            <div className="mt-5 border-t border-[#073B32]/20 pt-5 text-[11px] leading-5">
              <strong className="block">{featured.service} · {featured.location}</strong>
              <p className="mt-2 text-[12px] leading-5 text-[#073B32]/68">{featured.description}</p>
            </div>
            <a href="#portfolio-section" className="mt-6 inline-flex min-h-11 items-center gap-2 border-b border-[#D6A62E] pb-2 text-[12px] font-bold">OPEN PROJECT FILE <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" /></a>
          </aside>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {supportingItems.map((item, index) => (
            <Tilt key={item.id}>
              <figure>
                <img src={websiteImage(item.image, `${item.service} ${item.title}`, index).src} sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw" alt={item.title} width={1600} height={1067} className="aspect-[3/2] w-full object-cover" loading="lazy" decoding="async" />
                <figcaption className="rr-photo-caption mt-3 pt-3">
                  <strong className="block text-[13px] leading-5">{item.title}</strong>
                  <span className="mt-1 block text-[11px] text-[#073B32]/62">{item.service} · {item.location}</span>
                </figcaption>
              </figure>
            </Tilt>
          ))}
        </div>
      </div>
    </section>
  );
};

const QualityLedger: React.FC<{ reviews: Review[] }> = ({ reviews }) => {
  const review = reviews.find((item) => item.rating === 5 && item.comment.length > 80) || reviews[0];

  return (
    <section id="quality-section" className="rr-section-forest px-5 py-24 text-[#F5F1E8] lg:px-12 lg:py-28">
      <div className="mx-auto max-w-[1280px]">
        <Reveal><SectionHeader light eyebrow="06 / Quality check" title="What we check." description="The finish is in the details: materials, fit, road use, clear booking, and a warranty you can bring back to us." /></Reveal>
        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="border-t border-[#F5F1E8]/22 lg:col-span-7">
            {QUALITY_CHECKS.map(([title, description], index) => (
              <div key={title} className="rr-quality-row grid grid-cols-[52px_1fr] gap-4 py-5 sm:grid-cols-[62px_190px_1fr] sm:gap-5">
                <span className="rr-tabular text-[27px] font-black text-[#D6A62E]">{String(index + 1).padStart(2, '0')}</span>
                <h3 className="text-[14px] font-bold sm:text-[15px]">{title}</h3>
                <p className="col-start-2 text-[12px] leading-5 text-[#F5F1E8]/68 sm:col-start-3">{description}</p>
              </div>
            ))}
          </div>
          {review && (
            <Tilt className="self-start lg:col-span-5">
              <aside className="rr-paper p-7 text-[#073B32] lg:p-8">
              <p className="rr-label text-[#073B32]/55">Driver note / verified</p>
              <div className="rr-signature mt-6 text-[39px] leading-none text-[#0B4035]">“Worth every shilling.”</div>
              <blockquote className="mt-5 text-[16px] font-semibold leading-7">“{review.comment}”</blockquote>
              <div className="mt-8 flex items-end justify-between border-t border-[#073B32]/18 pt-5">
                <div>
                  <strong className="block text-[13px]">{review.customerName}</strong>
                  <span className="mt-1 block text-[11px] text-[#073B32]/62">{review.vehicle} · {review.service}</span>
                  <span className="mt-1 block text-[11px] text-[#073B32]/62">{review.location} · {review.date}</span>
                </div>
                <span className="text-[12px] font-black text-[#D6A62E]">{'★'.repeat(review.rating)}</span>
              </div>
              <div className="mt-5 flex items-center gap-1 text-[11px] font-bold text-[#0B4035]"><ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />Verified booking</div>
              </aside>
            </Tilt>
          )}
        </div>
      </div>
    </section>
  );
};

const ArrivalBoard: React.FC = () => {
  const { location, hours, phone, whatsapp } = BUSINESS_CONFIG;
  const whatsappHref = `${whatsapp.link}?text=${encodeURIComponent(whatsapp.defaultMessage)}`;
  const [mapLoaded, setMapLoaded] = useState(false);

  return (
    <section id="arrival-section" className="rr-section-panel px-5 py-24 text-[#F5F1E8] lg:px-12 lg:py-28">
      <div className="mx-auto max-w-[1280px]">
        <Reveal><SectionHeader light eyebrow="07 / Arrival board" title="Find the workshop." description="Bring your vehicle for a material inspection, a leather swatch review, or a sit-down ergonomics consultation." /></Reveal>
        <div className="mt-10 grid grid-cols-1 border border-[#D6A62E]/40 lg:grid-cols-12">
          <div className="rr-map relative min-h-[420px] overflow-hidden lg:col-span-7">
            {mapLoaded ? <iframe title={`${BUSINESS_CONFIG.name} workshop map`} src={location.mapsEmbedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="absolute inset-0 h-full w-full border-0 opacity-70 grayscale-[.25]" /> : (
              <div className="absolute inset-0 flex items-center justify-center bg-[#052822]/80 p-6 text-center">
                <button type="button" onClick={() => setMapLoaded(true)} className="rr-button-gold h-12 px-5 text-[11px]">LOAD INTERACTIVE MAP</button>
              </div>
            )}
            <div className="pointer-events-none absolute left-5 top-5 z-10 border-l-2 border-[#D6A62E] bg-[#073B32]/92 px-4 py-3">
              <span className="rr-label text-[#D6A62E]">Workshop coordinates</span>
              <strong className="mt-1 block text-[12px]">{location.area} · {location.city}</strong>
              <span className="mt-1 block text-[11px] text-[#F5F1E8]/64">{location.coordinates.lat}, {location.coordinates.lng}</span>
            </div>
            <a href={location.mapsUrl} target="_blank" rel="noreferrer" className="rr-button-gold absolute bottom-5 right-5 z-10 h-12 px-5 text-[11px]">GET DIRECTIONS <Navigation aria-hidden="true" className="h-3.5 w-3.5" /></a>
          </div>
          <div className="rr-forest p-8 lg:col-span-5 lg:p-10">
            <div className="border-b border-[#F5F1E8]/18 pb-7">
              <p className="rr-label text-[#D6A62E]">Rolling Razors Customs workshop</p>
              <h3 className="mt-3 text-xl font-bold">{location.address}</h3>
              <p className="mt-2 text-[13px] leading-6 text-[#F5F1E8]/68">{location.fullAddress}<br />{location.landmark}</p>
            </div>
            <div className="pt-7">
              <p className="rr-label mb-4 text-[#D6A62E]">Workshop hours</p>
              <table className="rr-contact-table w-full text-[13px] rr-tabular">
                <tbody>
                  <tr><td className="py-3 text-[#F5F1E8]/68">Monday – Friday</td><td className="py-3 text-right font-bold">{hours.weekdays}</td></tr>
                  <tr><td className="py-3 text-[#F5F1E8]/68">Saturday</td><td className="py-3 text-right font-bold">{hours.saturday}</td></tr>
                  <tr><td className="py-3 text-[#F5F1E8]/68">Sunday</td><td className="py-3 text-right font-bold text-[#D6A62E]">Special appointments</td></tr>
                </tbody>
              </table>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <a href={phone.telLink} className="rr-button-outline h-12 px-3 text-[12px]"><Phone aria-hidden="true" className="h-3.5 w-3.5" />CALL {phone.formatted}</a>
              <a href={whatsappHref} target="_blank" rel="noreferrer" className="flex h-12 items-center justify-center gap-2 bg-[#25D366] px-3 text-[12px] font-black text-white transition-colors hover:bg-[#20ba59]"><MessageCircle aria-hidden="true" className="h-3.5 w-3.5" />WHATSAPP</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export const InspectionBayLanding: React.FC = () => {
  const {
    services,
    portfolio,
    reviews,
    setView,
    setBookingWizardInitialServiceId,
    setBookingWizardDraft,
  } = useApp();

  const startBooking = (serviceId: string | null = null, draft: FittingDraft | BuildDraft | null = null) => {
    setBookingWizardInitialServiceId(serviceId);
    setBookingWizardDraft(draft);
    setView('booking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="rr-page">
      <InspectionHero
        services={services}
        onSubmit={(serviceId, draft) => startBooking(serviceId, draft)}
      />
      <section id="fitting-request" className="rr-section-forest px-5 py-20 text-[#F5F1E8] lg:px-12 lg:py-24">
        <div className="mx-auto grid max-w-[1280px] gap-12 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-5 lg:pt-8">
            <p className="rr-label text-[#D6A62E]">01 / Start a project</p>
            <h2 className="mt-5 max-w-[480px] text-4xl font-black leading-none sm:text-5xl">Tell us what your vehicle needs.</h2>
            <p className="mt-6 max-w-[420px] text-sm leading-6 text-[#D7D2C6]">Choose a service, tell us where you are, and we’ll help you plan the next step.</p>
          </div>
          <div className="lg:col-span-7 lg:border-l lg:border-[#F5F1E8]/15 lg:pl-12"><FittingRequest services={services} onSubmit={(serviceId, draft) => startBooking(serviceId, draft)} /></div>
        </div>
      </section>
      <ServiceInspectionBoard services={services} onBook={(serviceId) => startBooking(serviceId)} />
      <BuildSpecification onBook={(draft) => {
        startBooking('srv-1', draft);
      }} />
      <BookingRoute onStart={() => startBooking()} />
      <EvidenceGallery portfolio={portfolio} />
      <QualityLedger reviews={reviews} />
      <ArrivalBoard />
      <Footer />
    </div>
  );
};

export default InspectionBayLanding;
