import React from 'react';
import { ArrowUpRight, Facebook, Instagram, Music2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BUSINESS_CONFIG } from '../../config/business';
import { Logo } from '../common/Logo';

const FOOTER_LINKS = [
  ['Services', 'services-section'],
  ['Build spec', 'spec-section'],
  ['Our work', 'portfolio-section'],
  ['Workshop', 'arrival-section'],
] as const;

export const Footer: React.FC = () => {
  const { setView, setBookingWizardInitialServiceId, setBookingWizardDraft, openLegalModal } = useApp();

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
    else {
      setView('website');
      window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 120);
    }
  };

  const startBooking = () => {
    setBookingWizardInitialServiceId(null);
    setBookingWizardDraft(null);
    setView('booking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-[#D6A62E]/25 bg-[#052822] px-5 py-14 text-[#F5F1E8] lg:px-12">
      <div className="mx-auto max-w-[1280px]">
        <div className="grid grid-cols-1 gap-10 border-b border-[#F5F1E8]/12 pb-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex min-h-11 items-center text-left"><Logo variant="light" size="sm" showTagline /></button>
            <p className="mt-5 max-w-[340px] text-[13px] leading-6 text-[#F5F1E8]/64">Automotive upholstery, custom seats, leather work, cushions, canvas, and vehicle interiors in Nairobi.</p>
            <p className="rr-signature mt-5 text-[19px] text-[#D6A62E]">{BUSINESS_CONFIG.tagline}</p>
          </div>
          <div className="lg:col-span-2">
            <p className="rr-label text-[#D6A62E]">Explore</p>
            <div className="mt-4 space-y-1 text-[13px] text-[#F5F1E8]/68">{FOOTER_LINKS.map(([label, id]) => <button key={id} type="button" onClick={() => scrollTo(id)} className="block min-h-9 transition-colors hover:text-[#D6A62E]">{label}</button>)}</div>
          </div>
          <div className="lg:col-span-3">
            <p className="rr-label text-[#D6A62E]">Popular work</p>
            <div className="mt-4 space-y-1 text-[13px] text-[#F5F1E8]/68">
              <button type="button" onClick={() => { setBookingWizardInitialServiceId('srv-1'); setView('booking'); }} className="block min-h-9 hover:text-[#D6A62E]">Car Upholstery</button>
              <button type="button" onClick={() => { setBookingWizardInitialServiceId('srv-2'); setView('booking'); }} className="block min-h-9 hover:text-[#D6A62E]">Custom Car Seats</button>
              <button type="button" onClick={() => { setBookingWizardInitialServiceId('srv-4'); setView('booking'); }} className="block min-h-9 hover:text-[#D6A62E]">Leather Work & Stitching</button>
              <button type="button" onClick={() => { setBookingWizardInitialServiceId('srv-5'); setView('booking'); }} className="block min-h-9 hover:text-[#D6A62E]">Steering Wheel Stitching</button>
            </div>
          </div>
          <div className="lg:col-span-2">
            <p className="rr-label text-[#D6A62E]">Connect</p>
            <p className="mt-4 text-[13px] leading-6 text-[#F5F1E8]/68">{BUSINESS_CONFIG.phone.formatted}<br />{BUSINESS_CONFIG.email.primary}</p>
            <div className="mt-5 flex items-center gap-3 text-[#F5F1E8]/75">
              <a href={BUSINESS_CONFIG.socials.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="grid h-11 w-11 place-items-center border border-[#F5F1E8]/15 transition-colors hover:border-[#D6A62E] hover:text-[#D6A62E]"><Facebook className="h-4 w-4" /></a>
              <a href={BUSINESS_CONFIG.socials.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="grid h-11 w-11 place-items-center border border-[#F5F1E8]/15 transition-colors hover:border-[#D6A62E] hover:text-[#D6A62E]"><Instagram className="h-4 w-4" /></a>
              <a href={BUSINESS_CONFIG.socials.tiktok} target="_blank" rel="noreferrer" aria-label="TikTok" className="grid h-11 w-11 place-items-center border border-[#F5F1E8]/15 transition-colors hover:border-[#D6A62E] hover:text-[#D6A62E]"><Music2 className="h-4 w-4" /></a>
            </div>
            <button type="button" onClick={startBooking} className="rr-button-gold mt-6 h-12 w-full text-[12px]">BOOK A FITTING <ArrowUpRight className="h-3.5 w-3.5" /></button>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-3 pt-5 text-[11px] text-[#F5F1E8]/52 sm:flex-row">
          <span>© {new Date().getFullYear()} {BUSINESS_CONFIG.legalName} · {BUSINESS_CONFIG.location.city}, {BUSINESS_CONFIG.location.country}</span>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <button type="button" onClick={() => openLegalModal('privacy')} className="min-h-8 hover:text-[#F5F1E8]">Privacy</button>
            <span>·</span>
            <button type="button" onClick={() => openLegalModal('terms')} className="min-h-8 hover:text-[#F5F1E8]">Terms</button>
            <span>·</span>
            <button type="button" onClick={() => openLegalModal('refund')} className="min-h-8 hover:text-[#F5F1E8]">Refund policy</button>
          </div>
        </div>
      </div>
    </footer>
  );
};
