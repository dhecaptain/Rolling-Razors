import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  MessageCircle,
  Navigation,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BUSINESS_CONFIG } from '../../config/business';
import { PortfolioItem, Review, Service, VehicleType } from '../../types';
import { cdnUrl, srcSet } from '../../utils/image';
import Reveal from './Reveal';
import { Footer } from './Footer';

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

const COLORS = [
  { name: 'Saddle Brown & Black', primary: '#8C5E3C', secondary: '#111111' },
  { name: 'Cognac Tan & Jet Black', primary: '#C2844B', secondary: '#171717' },
  { name: 'Deep Burgundy Wine', primary: '#58111A', secondary: '#21070B' },
] as const;

const PATTERNS = [
  { name: 'Diamond Quilted', type: 'diamond' },
  { name: 'Double French', type: 'double' },
  { name: 'Perforated Motorsport', type: 'perforated' },
  { name: 'Horizontal Pleats', type: 'pleats' },
] as const;

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
          <span className="block text-[11px] uppercase tracking-[.1em] text-[#F5F1E8]/55">Deposit</span>
          <strong className="text-[13px] text-[#D6A62E]">M-Pesa supported</strong>
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
                  {service.name} — from {formatKES(service.startingPrice)}
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

        <div className="flex items-center justify-between gap-4 border-l-2 border-[#D6A62E] bg-[#052822] px-4 py-4" aria-live="polite">
          <span className="text-[13px] text-[#F5F1E8]/74">Starting estimate</span>
          <strong className="rr-tabular text-[22px] text-[#D6A62E]">{formatKES(selectedService?.startingPrice || 0)}</strong>
        </div>

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
}> = ({ services, onSubmit }) => (
  <section id="hero-section" className="rr-section-forest border-b border-[#D6A62E]/30">
    <div className="grid min-h-[650px] grid-cols-1 lg:grid-cols-12">
      <div className="relative min-h-[610px] overflow-hidden lg:col-span-7 lg:min-h-[650px]">
        <img
          src={cdnUrl('/images/upholstery/upholstery-01.jpg', { w: 1600, q: 78 })}
          srcSet={srcSet('/images/upholstery/upholstery-01.jpg', [800, 1200, 1600])}
          sizes="(max-width: 1024px) 100vw, 58vw"
          alt="Handcrafted vehicle interior with stitched leather seats"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#073B32]/95 via-[#073B32]/72 to-[#073B32]/15" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#073B32] via-transparent to-[#073B32]/20" />
        <div className="relative z-10 flex h-full max-w-[640px] flex-col justify-end px-7 py-14 sm:px-10 lg:px-14 lg:py-20">
          <div className="mb-6 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[.18em] text-[#D6A62E]">
            <span className="h-px w-8 bg-[#D6A62E]" />
            Inspection bay / 01
          </div>
          <h1 className="max-w-[570px] text-[3rem] font-black leading-[.98] tracking-[-.04em] text-[#F5F1E8] sm:text-[4.2rem] lg:text-[4.75rem]">
            Transform your ride.
            <br />
            <span className="text-[#D6A62E]">Made for your vehicle.</span>
          </h1>
          <p className="mt-7 max-w-[500px] text-[16px] leading-7 text-[#F5F1E8]/84">
            Choose a service, see its starting KES price, then request a fitting at our Nairobi workshop or on-site.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-[#F5F1E8]/78">
            <span className="flex items-center gap-2"><CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5 text-[#D6A62E]" />M-Pesa deposits</span>
            <span className="h-1 w-1 rounded-full bg-[#D6A62E]" />
            <span>Free cancellation up to 24 hours</span>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#F5F1E8]/20 pt-5 text-[13px]">
            <span className="rr-tabular font-black text-[#D6A62E]">4.9 / 5</span>
            <span className="text-[#F5F1E8]/65">from verified drivers</span>
            <span className="text-[#D6A62E]">•</span>
            <span className="text-[#F5F1E8]/65">850+ rides transformed</span>
          </div>
        </div>
      </div>
      <div className="rr-panel flex items-center px-7 py-10 lg:col-span-5 lg:px-12">
        <FittingRequest services={services} onSubmit={onSubmit} />
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
    <section id="services-section" className="rr-paper px-5 py-20 lg:px-12 lg:py-28">
      <div className="mx-auto max-w-[1280px]">
        <Reveal>
          <SectionHeader
            eyebrow="02 / Services"
            title="Choose the work."
            description="From a four-hour steering stitch to a full cabin re-trim, every service starts with a clear estimate and workshop time."
          />
          <StitchRule />
        </Reveal>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-9">
          <div className="lg:col-span-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="rr-label text-[#073B32]/55">Service board</span>
              <span className="rr-tabular text-[11px] text-[#073B32]/55">{services.length} service types</span>
            </div>
            <div className="border-t border-[#073B32]/20">
              {services.map((service, index) => (
                <button
                  key={service.id}
                  type="button"
                  aria-label={service.name}
                  aria-pressed={selectedService.id === service.id}
                  onClick={() => { setSelectedId(service.id); setShowDetails(false); }}
                  className={`rr-service-row flex min-h-[48px] w-full items-center gap-3 px-3 text-left text-[13px] text-[#073B32] transition-colors ${selectedService.id === service.id ? 'is-active text-[#F5F1E8]' : ''}`}
                >
                  <span className={`rr-tabular text-[11px] ${selectedService.id === service.id ? 'text-[#D6A62E]' : 'text-[#073B32]/50'}`}>{String(index + 1).padStart(2, '0')}</span>
                  <span className="min-w-0 flex-1 font-semibold">{service.name}</span>
                  {selectedService.id === service.id && <span className="h-1 w-1 rounded-full bg-[#D6A62E]" />}
                </button>
              ))}
            </div>
          </div>

          <figure className="relative overflow-hidden bg-[#073B32] lg:col-span-5">
            <img
              id="service-board-image"
              src={cdnUrl(selectedService.image, { w: 1000 })}
              srcSet={srcSet(selectedService.image, [600, 900, 1200])}
              sizes="(max-width: 1024px) 100vw, 42vw"
              alt={selectedService.name}
              className="h-[430px] w-full object-cover sm:h-[520px]"
              loading="lazy"
              decoding="async"
            />
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
  const [activeMaterial, setActiveMaterial] = useState(MATERIALS[0].name);
  const [activeColor, setActiveColor] = useState(COLORS[0].name);
  const [activePattern, setActivePattern] = useState(PATTERNS[0].name);
  const [focusOnSeats, setFocusOnSeats] = useState(false);

  const material = MATERIALS.find((option) => option.name === activeMaterial) || MATERIALS[0];
  const color = COLORS.find((option) => option.name === activeColor) || COLORS[0];

  return (
    <section id="spec-section" className="rr-section-forest px-5 py-24 text-[#F5F1E8] lg:px-12 lg:py-28">
      <div className="mx-auto max-w-[1280px]">
        <Reveal>
          <SectionHeader light eyebrow="03 / Build specification" title="Choose the finish." description="Specify a direction for your interior. Final materials are confirmed at the workshop." />
          <StitchRule light />
        </Reveal>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="relative overflow-hidden bg-[#052822] lg:col-span-7">
            <div className="relative h-[470px] overflow-hidden sm:h-[620px]">
              <img
                id="spec-image"
                src={cdnUrl(material.image, { w: 1200 })}
                srcSet={srcSet(material.image, [700, 1000, 1400])}
                sizes="(max-width: 1024px) 100vw, 58vw"
                alt={`${activeMaterial} interior preview`}
                className={`h-full w-full object-cover object-center transition-transform duration-700 ${focusOnSeats ? 'scale-110' : 'scale-100'}`}
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#073B32] via-transparent to-black/10" />
              <span className="absolute left-4 top-4 rr-label text-[#F5F1E8]/70">Material study / RR-01</span>
              <button type="button" aria-pressed={focusOnSeats} onClick={() => setFocusOnSeats((focused) => !focused)} className="absolute right-4 top-4 min-h-11 border border-[#F5F1E8]/30 bg-[#073B32]/85 px-3 py-2 text-[11px] font-bold text-[#F5F1E8] transition-colors hover:border-[#D6A62E]">
                {focusOnSeats ? 'RETURN TO FULL VIEW' : 'FOCUS ON SEATS'} <ArrowUpRight aria-hidden="true" className="ml-1 inline h-3 w-3" />
              </button>
              <div className="absolute inset-x-4 bottom-4 border-t border-dashed border-[#D6A62E]/65 pt-3 text-[13px] font-semibold text-[#F5F1E8]" aria-live="polite">
                <span id="spec-summary">{activeMaterial} <b className="px-1 text-[#D6A62E]">·</b> {activeColor} <b className="px-1 text-[#D6A62E]">·</b> {activePattern}</span>
                <span className="mt-1 block text-[11px] font-normal text-[#F5F1E8]/62">Preview shows the selected direction; final materials are confirmed at the workshop.</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <fieldset className="border-t border-[#F5F1E8]/20 pt-4">
              <legend className="flex w-full items-center justify-between rr-label text-[#D6A62E]"><span>M01 / Material</span><span className="text-[#F5F1E8]/45">Choose one</span></legend>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {MATERIALS.map((option) => (
                  <button key={option.name} type="button" aria-pressed={activeMaterial === option.name} onClick={() => setActiveMaterial(option.name)} className={`min-h-[64px] border p-3 text-left transition-colors ${activeMaterial === option.name ? 'border-[#D6A62E] bg-[#D6A62E]/[.08]' : 'border-[#F5F1E8]/18 hover:border-[#D6A62E]/65'}`}>
                    <span className="block text-[12px] font-bold">{option.shortName}</span>
                    <span className="mt-1 block text-[11px] text-[#F5F1E8]/58">{option.desc}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-7 border-t border-[#F5F1E8]/20 pt-4">
              <legend className="flex w-full items-center justify-between rr-label text-[#D6A62E]"><span>C01 / Colour pairing</span><span className="text-[#F5F1E8]/45">Choose one</span></legend>
              <div className="mt-3 space-y-1">
                {COLORS.map((option) => (
                  <button key={option.name} type="button" aria-pressed={activeColor === option.name} onClick={() => setActiveColor(option.name)} className={`flex min-h-[48px] w-full items-center gap-3 border px-3 text-left text-[12px] font-semibold transition-colors ${activeColor === option.name ? 'border-[#D6A62E] bg-[#D6A62E]/[.08]' : 'border-[#F5F1E8]/18 hover:border-[#D6A62E]/65'}`}>
                    <span className="flex h-7 w-8 shrink-0"><span className="w-1/2" style={{ backgroundColor: option.primary }} /><span className="w-1/2" style={{ backgroundColor: option.secondary }} /></span>
                    {option.name}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-7 border-t border-[#F5F1E8]/20 pt-4">
              <legend className="flex w-full items-center justify-between rr-label text-[#D6A62E]"><span>P01 / Stitch pattern</span><span className="text-[#F5F1E8]/45">Choose one</span></legend>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1">
                {PATTERNS.map((option) => (
                  <button key={option.name} type="button" aria-pressed={activePattern === option.name} onClick={() => setActivePattern(option.name)} className={`min-h-[48px] border-b py-3 text-left text-[12px] font-semibold transition-colors ${activePattern === option.name ? 'border-[#D6A62E] text-[#F5F1E8]' : 'border-[#F5F1E8]/20 text-[#F5F1E8]/76 hover:border-[#D6A62E]/70'}`}>
                    <span className={`mb-2 block h-3 w-full ${option.type === 'diamond' ? 'rr-pattern-diamond' : option.type === 'perforated' ? 'rr-pattern-dots' : option.type === 'pleats' ? 'rr-pattern-pleats' : 'rr-pattern-double'}`} aria-hidden="true" />
                    {option.name}
                  </button>
                ))}
              </div>
            </fieldset>

            <button type="button" onClick={() => onBook({ material: activeMaterial, color: activeColor, pattern: activePattern })} className="rr-button-gold mt-7 h-14 w-full text-[12px] tracking-[.08em]">
              BOOK THIS INTERIOR BUILD <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
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
          <aside className="self-end border-l-2 border-[#D6A62E] bg-[#052822] p-7 lg:col-span-4">
            <p className="rr-label text-[#D6A62E]">Step 04 / Appointment</p>
            <h3 className="mt-4 text-[21px] font-black">Choose a fitting time.</h3>
            <p className="mt-2 text-[12px] leading-5 text-[#F5F1E8]/68">Free cancellation up to 24 hours before your appointment. M-Pesa deposit instructions appear before confirmation.</p>
            <button type="button" onClick={onStart} className="rr-button-gold mt-7 h-12 w-full text-[12px] tracking-[.08em]">START BOOKING <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" /></button>
          </aside>
        </div>
      </div>
    </section>
  );
};

const EvidenceGallery: React.FC<{ portfolio: PortfolioItem[] }> = ({ portfolio }) => {
  const [activeFilter, setActiveFilter] = useState<PortfolioItem['category']>('All');
  const [sliderPosition, setSliderPosition] = useState(46);
  const featured = portfolio.find((item) => item.beforeImage && item.afterImage) || portfolio[0];
  const filteredItems = useMemo(() => portfolio.filter((item) => activeFilter === 'All' || item.category === activeFilter), [activeFilter, portfolio]);
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
            className="rr-comparison relative h-[360px] cursor-ew-resize select-none overflow-hidden bg-[#0B4035] sm:h-[520px] lg:col-span-9"
            role="slider"
            tabIndex={0}
            aria-label="Before and after comparison slider"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(sliderPosition)}
            aria-valuetext={`${Math.round(sliderPosition)}% before, ${100 - Math.round(sliderPosition)}% after`}
            onKeyDown={handleSliderKeyDown}
            onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); updateSlider(event.clientX, event.currentTarget.getBoundingClientRect()); }}
            onPointerMove={(event) => { if (event.buttons === 1) updateSlider(event.clientX, event.currentTarget.getBoundingClientRect()); }}
          >
            <img src={cdnUrl(featured.afterImage || featured.image, { w: 1400 })} alt={`${featured.title} after handcrafted work`} className="absolute inset-0 h-full w-full object-cover" loading="lazy" decoding="async" />
            <span className="absolute right-4 top-4 z-10 bg-[#D6A62E] px-3 py-2 text-[11px] font-black text-[#073B32]">AFTER / HANDCRAFTED</span>
            <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${sliderPosition}%` }}>
              <img src={cdnUrl(featured.beforeImage || featured.image, { w: 1400 })} alt={`${featured.title} before restoration`} className="absolute left-0 top-0 h-full max-w-none object-cover" style={{ width: `${10000 / Math.max(sliderPosition, 1)}%` }} loading="lazy" decoding="async" />
              <span className="absolute left-4 top-4 z-10 bg-[#073B32] px-3 py-2 text-[11px] font-black text-[#F5F1E8]">BEFORE / ORIGINAL</span>
            </div>
            <div className="pointer-events-none absolute inset-y-0 z-20 w-24 -translate-x-1/2" style={{ left: `${sliderPosition}%` }}>
              <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[#D6A62E]" />
              <span className="absolute left-1/2 top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center border-2 border-[#073B32] bg-[#D6A62E] text-sm font-black text-[#073B32]">↔</span>
              <span className="absolute left-1/2 top-[calc(50%+38px)] -translate-x-1/2 whitespace-nowrap bg-[#073B32] px-3 py-1.5 text-[11px] font-semibold text-[#F5F1E8]">Drag to compare</span>
            </div>
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

        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {supportingItems.map((item, index) => (
            <figure key={item.id} className={`${index === 1 ? 'lg:mt-8' : index === 3 ? 'lg:mt-4' : ''}`}>
              <img src={cdnUrl(item.image, { w: 700 })} srcSet={srcSet(item.image, [400, 700, 1000])} sizes="(max-width: 640px) 100vw, 25vw" alt={item.title} className={`w-full object-cover ${index === 1 ? 'h-[270px]' : 'h-[220px]'}`} loading="lazy" decoding="async" />
              <figcaption className="rr-photo-caption mt-3 pt-3">
                <strong className="block text-[13px] leading-5">{item.title}</strong>
                <span className="mt-1 block text-[11px] text-[#073B32]/62">{item.service} · {item.location}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};

const QualityLedger: React.FC<{ reviews: Review[] }> = ({ reviews }) => {
  const review = reviews.find((item) => item.customerName === 'Kiprono Cheruiyot') || reviews[0];

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
            <aside className="rr-paper self-start p-7 text-[#073B32] lg:col-span-5 lg:p-8">
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
          )}
        </div>
      </div>
    </section>
  );
};

const ArrivalBoard: React.FC = () => {
  const { location, hours, phone, whatsapp } = BUSINESS_CONFIG;
  const whatsappHref = `${whatsapp.link}?text=${encodeURIComponent(whatsapp.defaultMessage)}`;

  return (
    <section id="arrival-section" className="rr-section-panel px-5 py-24 text-[#F5F1E8] lg:px-12 lg:py-28">
      <div className="mx-auto max-w-[1280px]">
        <Reveal><SectionHeader light eyebrow="07 / Arrival board" title="Find the workshop." description="Bring your vehicle for a material inspection, a leather swatch review, or a sit-down ergonomics consultation." /></Reveal>
        <div className="mt-10 grid grid-cols-1 border border-[#D6A62E]/40 lg:grid-cols-12">
          <div className="rr-map relative min-h-[420px] overflow-hidden lg:col-span-7">
            <iframe title={`${BUSINESS_CONFIG.name} workshop map`} src={location.mapsEmbedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="absolute inset-0 h-full w-full border-0 opacity-70 grayscale-[.25]" />
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
      <ServiceInspectionBoard services={services} onBook={(serviceId) => startBooking(serviceId)} />
      <BuildSpecification onBook={(draft) => {
        try { localStorage.setItem('rr_visualizer_draft', JSON.stringify(draft)); } catch {}
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
