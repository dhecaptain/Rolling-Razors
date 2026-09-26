import React, { useMemo, useState } from 'react';
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
import Reveal from './Reveal';
import { Tilt } from './Tilt';
import { Footer } from './Footer';
import { resolveWebsiteAsset } from '../../config/assets';

type LandingLocation = 'workshop' | 'customer_location';

type FittingDraft = {
  vehicleType: VehicleType;
  preferredDate: string;
  preferredTime: string;
  locationType: LandingLocation;
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

const websiteImage = (source: string | undefined, alt: string, index = 0) => resolveWebsiteAsset(source, alt, index);
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
      <p className={`rr-label ${light ? 'text-gold' : 'text-panel'}`}>{eyebrow}</p>
      <h2 className={`mt-4 text-[2.2rem] font-black leading-[1.02] tracking-[-.035em] sm:text-[3.05rem] ${light ? 'text-cream' : 'text-ink'}`}>
        {title}
      </h2>
    </div>
    <p className={`max-w-[460px] text-[14px] leading-6 ${light ? 'text-cream' : 'text-ink'}`}>
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
      <div className="flex items-start justify-between border-b border-cream pb-5">
        <div>
          <p className="rr-label text-gold">Fitting request</p>
          <h2 className="mt-2 text-[27px] font-black leading-tight text-cream">Start with the work.</h2>
          <p className="mt-1 text-[13px] leading-5 text-cream">Request a fitting time. We confirm availability with you.</p>
        </div>
        <div className="pl-4 text-right">
          <span className="block text-[11px] uppercase tracking-[.1em] text-cream">Made simple</span>
          <strong className="text-[13px] text-gold">We guide every step</strong>
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
          <span className="mb-2 block text-[12px] font-bold text-cream">01 / Choose a service</span>
          <span className="relative block">
            <select
              id="inspection-service-select"
              value={serviceId}
              onChange={(event) => setServiceId(event.target.value)}
              className="rr-control h-12 w-full appearance-none px-4 pr-10 text-[13px] font-semibold"
            >
              {services.map((service) => (
                <option key={service.id} value={service.id} className="bg-ink text-white">
                  {service.name}
                </option>
              ))}
            </select>
            <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
          </span>
        </label>

        <fieldset>
          <legend className="mb-2 block text-[12px] font-bold text-cream">02 / Vehicle type</legend>
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
            {VEHICLE_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                aria-pressed={vehicleType === type}
                onClick={() => setVehicleType(type)}
                className={`h-11 border text-[12px] font-bold transition-colors ${vehicleType === type ? 'border-gold bg-gold text-ink' : 'border-cream text-cream hover:border-gold hover:text-cream'}`}
              >
                {type}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-[12px] font-bold text-cream">03 / Preferred date</span>
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
            <span className="mb-2 block text-[12px] font-bold text-cream">Preferred time</span>
            <select
              id="inspection-preferred-time"
              value={preferredTime}
              onChange={(event) => setPreferredTime(event.target.value)}
              className="rr-control h-12 w-full px-4 text-[13px] font-semibold"
            >
              {TIME_SLOTS.map((time) => (
                <option key={time} value={time} className="bg-ink text-white">
                  {time}
                </option>
              ))}
            </select>
          </label>
        </div>

        <fieldset>
          <legend className="mb-2 block text-[12px] font-bold text-cream">04 / Fitting location</legend>
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
                className={`min-h-[64px] border px-3 text-left transition-colors ${locationType === location.value ? 'border-gold bg-ink text-cream' : 'border-cream bg-ink text-cream hover:border-gold'}`}
              >
                <span className="block text-[12px] font-bold">{location.title}</span>
                <span className="mt-1 block text-[11px] text-cream">{location.note}</span>
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

const InspectionHero: React.FC = () => (
  <section id="hero-section" className="rr-section-forest border-b border-gold">
    <div className="mx-auto grid min-h-[min(760px,calc(100svh-72px))] max-w-[1440px] grid-cols-1 lg:grid-cols-[1.05fr_.95fr]">
      <div className="relative z-10 flex flex-col justify-center px-6 py-16 sm:px-10 lg:px-16 lg:py-20">
        <div className="mb-6 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[.18em] text-gold">
          <span className="h-px w-8 bg-gold" />
          CUSTOM UPHOLSTERY · NAIROBI
        </div>
        <h1 className="max-w-[620px] text-[clamp(2.8rem,4.4vw,4.5rem)] font-black leading-[.99] tracking-[-.045em] text-cream">
          Make every drive feel yours.
        </h1>
        <p className="mt-6 max-w-[490px] text-[16px] leading-7 text-cream-muted sm:text-[17px]">
          Custom seats, careful stitching, and comfortable interiors made for your vehicle and the road ahead.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" id="hero-primary-book-btn" onClick={() => document.getElementById('fitting-request')?.scrollIntoView({ behavior: 'smooth' })} className="rr-button-gold h-12 px-6 text-[11px] tracking-[.08em]">BOOK A FITTING <ArrowRight aria-hidden="true" className="h-4 w-4" /></button>
          <button type="button" onClick={() => document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' })} className="rr-button-outline h-12 px-6 text-[11px] tracking-[.08em]">VIEW SERVICES</button>
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-cream">
          <span className="flex items-center gap-2"><CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5 text-gold" />Made in Nairobi</span>
          <span className="h-1 w-1 rounded-full bg-gold" aria-hidden="true" />
          <span>Workshop or on-site fitting</span>
        </div>
      </div>
      <div className="relative min-h-[360px] overflow-hidden lg:min-h-0">
        <img
          src="/images/hero/upholstery-workshop-hero.webp"
          alt="Handcrafted cognac leather vehicle seats in an upholstery workshop"
          width="1672"
          height="941"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-[62%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/35 via-transparent to-transparent lg:from-ink/55" aria-hidden="true" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-ink/60 to-transparent lg:hidden" aria-hidden="true" />
      </div>
    </div>
  </section>
);

const ServiceInspectionBoard: React.FC<{
  services: Service[];
  onBook: (serviceId: string) => void;
}> = ({ services, onBook }) => {
  const [selectedId, setSelectedId] = useState(services[0]?.id || 'srv-1');
  const [showDetails, setShowDetails] = useState(false);
  const selectedService = services.find((service) => service.id === selectedId) || services[0];

  if (!selectedService) return null;

  return (
    <section id="services-section" className="rr-paper px-5 py-24 text-ink lg:px-12 lg:py-32">
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
            <div className="mb-4 flex items-end justify-between border-b border-ink pb-4">
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
                  className={`rr-service-row group flex min-h-[112px] w-full items-start gap-4 border p-4 text-left text-ink transition-colors ${selectedService.id === service.id ? 'is-active border-ink' : 'border-ink bg-white hover:border-gold hover:bg-paper-high'}`}
                >
                  <span className={`grid h-9 w-9 shrink-0 place-items-center border text-xs font-black ${selectedService.id === service.id ? 'border-gold bg-gold text-ink' : 'border-ink text-[#4A6961]'}`}>{String(index + 1).padStart(2, '0')}</span>
                  <span className="min-w-0 flex-1"><span className={`block font-bold ${selectedService.id === service.id ? 'text-cream' : ''}`}>{service.name}</span><span className={`mt-2 block text-xs leading-5 ${selectedService.id === service.id ? 'text-cream-muted' : 'text-[#4A6961]'}`}>{service.shortDesc}</span></span>
                  <ArrowRight aria-hidden="true" className={`mt-1 h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1 ${selectedService.id === service.id ? 'text-gold' : 'text-[#4A6961]'}`} />
                </button>
              ))}
            </div>
          </div>

          <figure className="relative min-h-[430px] overflow-hidden bg-ink lg:col-span-4">
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
            <div className="absolute inset-0 p-6 text-cream sm:p-8">
              <div className="flex items-start justify-between border-b border-cream pb-5"><span className="rr-label text-gold">Selected service</span><span className="rr-tabular text-4xl font-black text-gold">{String(services.findIndex((service) => service.id === selectedService.id) + 1).padStart(2, '0')}</span></div>
              <p className="mt-10 max-w-[280px] text-sm leading-6 text-cream-muted">A clear starting scope for your vehicle, confirmed in person before work begins.</p>
              <ul className="mt-8 space-y-3 border-t border-cream pt-5 text-sm text-cream-muted">
                {selectedService.includedFeatures.slice(0, 3).map((feature) => <li key={feature} className="flex gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold" />{feature}</li>)}
              </ul>
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink to-transparent px-5 pb-5 pt-24 text-cream">
              <p className="rr-label text-gold">Selected work / {String(services.findIndex((service) => service.id === selectedService.id) + 1).padStart(2, '0')}</p>
              <figcaption id="service-board-title" className="mt-2 text-2xl font-black tracking-[-.025em]">{selectedService.name}</figcaption>
              <p className="mt-1 max-w-[410px] text-[12px] leading-5 text-cream">{selectedService.shortDesc}</p>
            </div>
          </figure>

          <aside className="rr-deep flex flex-col justify-between p-6 text-cream lg:sticky lg:top-20 lg:self-start lg:col-span-3 lg:p-7">
            <div>
              <p className="rr-label text-gold">Service docket</p>
              <div className="mt-10 border-b border-cream pb-6">
                <span className="rr-label text-cream">Starting price</span>
                <strong id="service-board-price" className="mt-3 block text-[25px] font-black text-gold">{formatKES(selectedService.startingPrice)}</strong>
              </div>
              <div className="border-b border-cream py-6">
                <span className="rr-label text-cream">Time in workshop</span>
                <strong id="service-board-time" className="mt-3 block text-[16px]">{selectedService.estimatedDuration}</strong>
              </div>
              <div className="pt-6">
                <span className="rr-label text-cream">What is included</span>
                <ul className="mt-4 space-y-3 text-[12px] leading-5 text-cream">
                  {selectedService.includedFeatures.slice(0, 3).map((feature) => (
                    <li key={feature} className="flex gap-2"><span className="text-gold">—</span>{feature}</li>
                  ))}
                </ul>
                {showDetails && <p className="mt-4 border-t border-cream pt-4 text-[12px] leading-5 text-cream">{selectedService.longDesc}</p>}
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

const BookingRoute: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  const steps = [
    ['01', 'Choose a service', 'Select full upholstery, custom seats, leather work, steering stitching, cushions, shades, or a workshop service.'],
    ['02', 'Select a fitting time', 'Pick a preferred day and time slot. We check the workshop schedule before confirming the visit.'],
    ['03', 'Tell us about your vehicle', 'Add make, model, registration details and your preferred leather colour, stitch pattern, or fitting requirements.'],
    ['04', 'Bring it in & we transform it', 'Drive to our Nairobi workshop or request mobile fitting. Pay the deposit securely with M-Pesa.'],
  ] as const;

  return (
    <section id="booking-route" className="rr-section-panel px-5 py-24 text-cream lg:px-12 lg:py-28">
      <div className="mx-auto max-w-[1280px]">
        <Reveal>
          <SectionHeader light eyebrow="How booking works" title="Book your fitting." description="Choose a service, share your vehicle details, pick a preferred time, and send your request for confirmation." />
        </Reveal>
        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="relative lg:col-span-8">
            <div className="absolute bottom-7 left-5 top-7 border-l border-dashed border-gold" aria-hidden="true" />
            {steps.map(([number, title, description], index) => (
              <div key={number} className="relative grid grid-cols-[48px_1fr] gap-4 border-t border-cream py-5 last:border-b sm:grid-cols-[62px_1fr] sm:gap-5">
                <span className={`relative z-10 grid h-12 w-12 place-items-center border text-[18px] font-black rr-tabular sm:h-14 sm:w-14 ${index === 0 ? 'border-gold text-gold' : index === 3 ? 'border-gold bg-gold text-ink' : 'border-cream text-cream'}`}>{number}</span>
                <div>
                <h3 className="text-[16px] font-bold">{title}</h3>
                <p className="mt-2 max-w-[680px] text-[12px] leading-5 text-cream">{description}</p>
                </div>
              </div>
            ))}
          </div>
          <Tilt className="self-end lg:col-span-4">
            <aside className="border-l-2 border-gold bg-ink-deep p-7">
              <p className="rr-label text-gold">Step 04 / Appointment</p>
              <h3 className="mt-4 text-[21px] font-black">Choose a fitting time.</h3>
              <p className="mt-2 text-[12px] leading-5 text-cream">Free cancellation up to 24 hours before your appointment. M-Pesa deposit instructions appear before confirmation.</p>
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
    <section id="portfolio-section" className="rr-paper px-5 py-24 text-ink lg:px-12 lg:py-28">
      <div className="mx-auto max-w-[1280px]">
        <Reveal>
          <SectionHeader eyebrow="Before and after" title="See the difference." description="Compare the original seats with the finished work, then browse more projects from the workshop." />
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-ink py-3">
            {PORTFOLIO_FILTERS.map((filter) => (
              <button key={filter.value} type="button" aria-pressed={activeFilter === filter.value} onClick={() => setActiveFilter(filter.value)} className={`rr-filter ${activeFilter === filter.value ? 'is-active' : ''} text-[11px] font-bold`}>{filter.label}</button>
            ))}
          </div>
        </Reveal>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
          <div
            className="rr-comparison relative h-[360px] select-none overflow-hidden bg-panel [touch-action:pan-y] sm:h-[520px] lg:col-span-9"
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
            <span className="absolute right-4 top-4 z-10 bg-gold px-3 py-2 text-[11px] font-black text-ink">AFTER / HANDCRAFTED</span>
            <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${sliderPosition}%` }}>
              <img src={websiteImage(featured.beforeImage || featured.image, `${featured.service} ${featured.title} before restoration`, 2).src} alt={`${featured.title} before restoration`} width={1600} height={1067} className="absolute left-0 top-0 h-full max-w-none object-cover" style={{ width: `${10000 / Math.max(sliderPosition, 1)}%` }} loading="lazy" decoding="async" />
              <span className="absolute left-4 top-4 z-10 bg-ink px-3 py-2 text-[11px] font-black text-cream">BEFORE / ORIGINAL</span>
            </div>
            <div className="pointer-events-none absolute inset-y-0 left-1/2 z-20 w-14 -translate-x-1/2" style={{ transform: `translateX(${sliderPosition - 50}%)` }}>
              <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gold" />
              <button
                type="button"
                aria-label="Drag comparison handle"
                className="pointer-events-auto absolute left-1/2 top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-ink bg-gold text-sm font-black text-ink"
                onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); updateSlider(event.clientX, event.currentTarget.closest('.rr-comparison')?.getBoundingClientRect() || new DOMRect()); }}
                onPointerMove={(event) => { if (event.buttons === 1) { const rect = event.currentTarget.closest('.rr-comparison')?.getBoundingClientRect(); if (rect) updateSlider(event.clientX, rect); } }}
              ><MoveHorizontal aria-hidden="true" className="h-5 w-5" /></button>
              <span className="absolute left-1/2 top-[calc(50%+38px)] -translate-x-1/2 whitespace-nowrap bg-ink px-3 py-1.5 text-[11px] font-semibold text-cream">Drag to compare</span>
            </div>
            <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-3 bg-ink px-2 py-1 text-[11px] text-cream" aria-hidden="true"><span>←</span><span>→</span></div>
          </div>
          <aside className="lg:col-span-3">
            <p className="rr-label text-ink">Featured project</p>
            <h3 className="mt-4 text-[20px] font-black leading-tight tracking-[-.04em]">{featured.title}</h3>
            <div className="mt-5 border-t border-ink pt-5 text-[11px] leading-5">
              <strong className="block">{featured.service} · {featured.location}</strong>
              <p className="mt-2 text-[12px] leading-5 text-ink">{featured.description}</p>
            </div>
            <a href="#portfolio-section" className="mt-6 inline-flex min-h-11 items-center gap-2 border-b border-gold pb-2 text-[12px] font-bold">Browse all projects <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" /></a>
          </aside>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {supportingItems.map((item, index) => (
            <Tilt key={item.id}>
              <figure>
                <img src={websiteImage(item.image, `${item.service} ${item.title}`, index).src} sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw" alt={item.title} width={1600} height={1067} className="aspect-[3/2] w-full object-cover" loading="lazy" decoding="async" />
                <figcaption className="rr-photo-caption mt-3 pt-3">
                  <strong className="block text-[13px] leading-5">{item.title}</strong>
                  <span className="mt-1 block text-[11px] text-ink">{item.service} · {item.location}</span>
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
    <section id="quality-section" className="rr-section-forest px-5 py-24 text-cream lg:px-12 lg:py-28">
      <div className="mx-auto max-w-[1280px]">
        <Reveal><SectionHeader light eyebrow="06 / Quality check" title="What we check." description="The finish is in the details: materials, fit, road use, clear booking, and a warranty you can bring back to us." /></Reveal>
        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="border-t border-cream lg:col-span-7">
            {QUALITY_CHECKS.map(([title, description], index) => (
              <div key={title} className="rr-quality-row grid grid-cols-[52px_1fr] gap-4 py-5 sm:grid-cols-[62px_190px_1fr] sm:gap-5">
                <span className="rr-tabular text-[27px] font-black text-gold">{String(index + 1).padStart(2, '0')}</span>
                <h3 className="text-[14px] font-bold sm:text-[15px]">{title}</h3>
                <p className="col-start-2 text-[12px] leading-5 text-cream sm:col-start-3">{description}</p>
              </div>
            ))}
          </div>
          {review && (
            <Tilt className="self-start lg:col-span-5">
              <aside className="rr-paper p-7 text-ink lg:p-8">
              <p className="rr-label text-ink">Driver note / verified</p>
              <div className="rr-signature mt-6 text-[39px] leading-none text-panel">“Worth every shilling.”</div>
              <blockquote className="mt-5 text-[16px] font-semibold leading-7">“{review.comment}”</blockquote>
              <div className="mt-8 flex items-end justify-between border-t border-ink pt-5">
                <div>
                  <strong className="block text-[13px]">{review.customerName}</strong>
                  <span className="mt-1 block text-[11px] text-ink">{review.vehicle} · {review.service}</span>
                  <span className="mt-1 block text-[11px] text-ink">{review.location} · {review.date}</span>
                </div>
                <span className="text-[12px] font-black text-gold">{'★'.repeat(review.rating)}</span>
              </div>
              <div className="mt-5 flex items-center gap-1 text-[11px] font-bold text-panel"><ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />Verified booking</div>
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
    <section id="arrival-section" className="rr-section-panel px-5 py-24 text-cream lg:px-12 lg:py-28">
      <div className="mx-auto max-w-[1280px]">
        <Reveal><SectionHeader light eyebrow="Visit us" title="Find the workshop." description="Visit us in Nairobi to review materials, discuss your vehicle, and plan the work with our team." /></Reveal>
        <div className="mt-10 grid grid-cols-1 border border-gold lg:grid-cols-12">
          <div className="rr-map relative min-h-[420px] overflow-hidden lg:col-span-7">
            {mapLoaded ? <iframe title={`${BUSINESS_CONFIG.name} workshop map`} src={location.mapsEmbedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="absolute inset-0 h-full w-full border-0 opacity-70 grayscale-[.25]" /> : (
              <div className="absolute inset-0 flex items-center justify-center bg-ink-deep p-6 text-center">
                <button type="button" onClick={() => setMapLoaded(true)} className="rr-button-gold h-12 px-5 text-[11px]">LOAD INTERACTIVE MAP</button>
              </div>
            )}
            <div className="pointer-events-none absolute left-5 top-5 z-10 border-l-2 border-gold bg-ink px-4 py-3">
              <span className="rr-label text-gold">Workshop coordinates</span>
              <strong className="mt-1 block text-[12px]">{location.area} · {location.city}</strong>
              <span className="mt-1 block text-[11px] text-cream">{location.coordinates.lat}, {location.coordinates.lng}</span>
            </div>
            <a href={location.mapsUrl} target="_blank" rel="noreferrer" className="rr-button-gold absolute bottom-5 right-5 z-10 h-12 px-5 text-[11px]">GET DIRECTIONS <Navigation aria-hidden="true" className="h-3.5 w-3.5" /></a>
          </div>
          <div className="rr-forest p-8 lg:col-span-5 lg:p-10">
            <div className="border-b border-cream pb-7">
              <p className="rr-label text-gold">Rolling Razors Customs workshop</p>
              <h3 className="mt-3 text-xl font-bold">{location.address}</h3>
              <p className="mt-2 text-[13px] leading-6 text-cream">{location.fullAddress}<br />{location.landmark}</p>
            </div>
            <div className="pt-7">
              <p className="rr-label mb-4 text-gold">Workshop hours</p>
              <table className="rr-contact-table w-full text-[13px] rr-tabular">
                <tbody>
                  <tr><td className="py-3 text-cream">Monday – Friday</td><td className="py-3 text-right font-bold">{hours.weekdays}</td></tr>
                  <tr><td className="py-3 text-cream">Saturday</td><td className="py-3 text-right font-bold">{hours.saturday}</td></tr>
                  <tr><td className="py-3 text-cream">Sunday</td><td className="py-3 text-right font-bold text-gold">Special appointments</td></tr>
                </tbody>
              </table>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <a href={phone.telLink} className="rr-button-outline h-12 px-3 text-[12px]"><Phone aria-hidden="true" className="h-3.5 w-3.5" />CALL {phone.formatted}</a>
              <a href={whatsappHref} target="_blank" rel="noreferrer" className="flex h-12 items-center justify-center gap-2 bg-whatsapp px-3 text-[12px] font-black text-white transition-colors hover:bg-whatsapp-dark"><MessageCircle aria-hidden="true" className="h-3.5 w-3.5" />WHATSAPP</a>
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

  const startBooking = (serviceId: string | null = null, draft: FittingDraft | null = null) => {
    setBookingWizardInitialServiceId(serviceId);
    setBookingWizardDraft(draft);
    setView('booking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="rr-page">
      <InspectionHero />
      <section id="fitting-request" className="rr-section-forest px-5 py-20 text-cream lg:px-12 lg:py-24">
        <div className="mx-auto grid max-w-[1280px] gap-12 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-5 lg:pt-8">
            <p className="rr-label text-gold">01 / Start a project</p>
            <h2 className="mt-5 max-w-[480px] text-4xl font-black leading-none sm:text-5xl">Tell us what your vehicle needs.</h2>
            <p className="mt-6 max-w-[420px] text-sm leading-6 text-cream-muted">Choose a service, tell us where you are, and we’ll help you plan the next step.</p>
          </div>
          <div className="lg:col-span-7 lg:border-l lg:border-creamlg: lg:pl-12"><FittingRequest services={services} onSubmit={(serviceId, draft) => startBooking(serviceId, draft)} /></div>
        </div>
      </section>
      <ServiceInspectionBoard services={services} onBook={(serviceId) => startBooking(serviceId)} />
      <BookingRoute onStart={() => startBooking()} />
      <EvidenceGallery portfolio={portfolio} />
      <QualityLedger reviews={reviews} />
      <ArrivalBoard />
      <Footer />
    </div>
  );
};

export default InspectionBayLanding;
