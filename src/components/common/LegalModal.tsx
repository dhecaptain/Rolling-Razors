import React from 'react';
import { X, ShieldCheck, FileText, RefreshCw, Lock, CheckCircle2 } from 'lucide-react';
import { BUSINESS_CONFIG } from '../../config/business';
import { useModalA11y } from '../../utils/useModalA11y';

export type LegalDocType = 'privacy' | 'terms' | 'refund';

interface LegalModalProps {
  isOpen: boolean;
  type: LegalDocType;
  onClose: () => void;
  onSwitchType: (type: LegalDocType) => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  type,
  onClose,
  onSwitchType
}) => {
  const modalRef = useModalA11y(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div 
      id="legal-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div 
        ref={modalRef}
        id="legal-modal-content"
        role="dialog"
        aria-modal="true"
        aria-label="Rolling Razors legal policies"
        tabIndex={-1}
        className="bg-[#073B32] border-2 border-[#D6A62E]/40 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col text-[#F5F1E8] shadow-2xl overflow-hidden focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 bg-[#0B4035] border-b border-[#D6A62E]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#073B32] text-[#D6A62E] border border-[#D6A62E]/40">
              {type === 'privacy' && <Lock className="w-5 h-5" />}
              {type === 'terms' && <FileText className="w-5 h-5" />}
              {type === 'refund' && <RefreshCw className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-[10px] text-[#D6A62E] uppercase font-bold tracking-wider">
                {BUSINESS_CONFIG.name} Legal Policies
              </span>
              <h3 className="text-xl font-black text-white font-display">
                {type === 'privacy' && 'Privacy & Data Protection Policy'}
                {type === 'terms' && 'Terms of Service & Craftsmanship Warranty'}
                {type === 'refund' && 'Deposit, Cancellation & Refund Policy'}
              </h3>
            </div>
          </div>

          <button 
            id="close-legal-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 px-6 pt-4 pb-2 bg-[#073B32] border-b border-white/10 overflow-x-auto">
          <button
            onClick={() => onSwitchType('privacy')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              type === 'privacy'
                ? 'bg-[#D6A62E] text-[#073B32] shadow-sm'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            Privacy Policy
          </button>
          <button
            onClick={() => onSwitchType('terms')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              type === 'terms'
                ? 'bg-[#D6A62E] text-[#073B32] shadow-sm'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            Terms of Service
          </button>
          <button
            onClick={() => onSwitchType('refund')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              type === 'refund'
                ? 'bg-[#D6A62E] text-[#073B32] shadow-sm'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            Refund & Cancellation Policy
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm text-white/85 leading-relaxed">
          
          {/* PRIVACY POLICY */}
          {type === 'privacy' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#0B4035] border border-emerald-800/40 text-xs">
                <span className="font-bold text-[#D6A62E] block mb-1">Kenya Data Protection Act (2019) Compliance</span>
                Rolling Razors Customs respects the privacy rights of all vehicle owners, fleet operators, and clients. We collect only necessary vehicle details, contact phone numbers, and appointment records to schedule and execute your custom tailoring services.
              </div>

              <section className="space-y-2">
                <h4 className="font-bold text-base text-white font-display">1. Information We Collect</h4>
                <p>When booking a service or registering your vehicle in the driver garage, we collect:</p>
                <ul className="list-disc pl-5 space-y-1 text-white/75">
                  <li><strong>Personal Identification:</strong> Full Name, Kenyan Phone Number, and Email address.</li>
                  <li><strong>Vehicle Data:</strong> Make, Model, Year of Manufacture, Registration Plate Number, and interior specifications.</li>
                  <li><strong>Transaction Records:</strong> Safaricom M-Pesa transaction reference numbers and billing statements.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-base text-white font-display">2. How We Protect & Use Your Data</h4>
                <p>Your information is used strictly to:</p>
                <ul className="list-disc pl-5 space-y-1 text-white/75">
                  <li>Process appointments, verify M-Pesa deposits, and generate verified electronic invoices.</li>
                  <li>Provide real-time SMS / WhatsApp work-in-progress status updates regarding your vehicle tailoring.</li>
                  <li>Maintain your vehicle's warranty and historical upholstery service record.</li>
                </ul>
                <p>We do not sell, rent, or trade your contact or vehicle information to any third parties.</p>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-base text-white font-display">3. Workshop Security & Photography</h4>
                <p>
                  Before-and-after photographs of vehicle interiors taken for quality assurance and portfolio purposes will never display owner identity documents or personal belongings left inside the vehicle.
                </p>
              </section>
            </div>
          )}

          {/* TERMS OF SERVICE */}
          {type === 'terms' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#0B4035] border border-emerald-800/40 text-xs flex items-start gap-3">
                <ShieldCheck className="w-6 h-6 text-[#25D366] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block mb-0.5">1-Year Master Craftsmanship Guarantee</span>
                  <p className="text-white/75">
                    All genuine leather stitching, foam reconstructions, and seam alignments completed at {BUSINESS_CONFIG.name} are backed by our 12-month workshop warranty against thread unraveling, foam sagging, or adhesive detachment.
                  </p>
                </div>
              </div>

              <section className="space-y-2">
                <h4 className="font-bold text-base text-white font-display">1. Booking, Measurement & Pricing</h4>
                <p>
                  Service estimates provided via the online portal or phone represent standard packages. Any specialized seat welding, heavy rust treatment on seat rails, or non-standard electrical seat motor repair will be quoted transparently upon physical vehicle check-in before work commences.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-base text-white font-display">2. Vehicle Check-in & Security</h4>
                <p>
                  Our workshop in Industrial Area Nairobi is equipped with 24/7 CCTV surveillance and secured vehicle bays. Clients are advised to remove high-value personal electronics, money, and loose items prior to handing over vehicle keys for upholstery work.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-base text-white font-display">3. Payment Terms</h4>
                <p>
                  A 35% commitment deposit is required upon scheduling or vehicle drop-off to reserve genuine leather hides and master craftsman bench time. The remaining balance is payable upon physical inspection and satisfaction prior to vehicle release.
                </p>
              </section>
            </div>
          )}

          {/* REFUND & CANCELLATION */}
          {type === 'refund' && (
            <div className="space-y-4">
              <section className="space-y-2">
                <h4 className="font-bold text-base text-white font-display">1. Cancellation Window</h4>
                <p>
                  We understand Kenyan traffic, mechanical delays, and busy schedules. You may cancel or reschedule your service appointment free of charge up to <strong>24 hours</strong> prior to your scheduled booking time.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-base text-white font-display">2. M-Pesa Deposit Refund Policy</h4>
                <ul className="list-disc pl-5 space-y-1.5 text-white/75">
                  <li><strong>Notice &gt; 24 Hours:</strong> Full 100% deposit refunded via M-Pesa within 1 business day, or converted to flexible workshop credits.</li>
                  <li><strong>Custom Hides Cut:</strong> If specialized custom leather or bespoke embroidery has already been patterned and cut specifically for your vehicle, the raw material cost is deducted from the refund.</li>
                  <li><strong>Workshop Re-Inspection:</strong> If you are not 100% satisfied with the fit or alignment of any seam upon completion, our master craftsmen will adjust and refine it free of charge within 14 days of vehicle delivery.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-base text-white font-display">3. Contacting Billing & Support</h4>
                <p>
                  For any cancellation, receipt verification, or warranty claim inquiries, contact our billing desk at <a href={`mailto:${BUSINESS_CONFIG.email.billing}`} className="text-[#D6A62E] underline">{BUSINESS_CONFIG.email.billing}</a> or call <a href={BUSINESS_CONFIG.phone.telLink} className="text-[#D6A62E] underline">{BUSINESS_CONFIG.phone.formatted}</a>.
                </p>
              </section>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-5 bg-[#052822] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-white/60 text-center sm:text-left">
            <span>{BUSINESS_CONFIG.legalName} • Nairobi, Kenya</span>
          </div>
          <button
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl bg-[#D6A62E] hover:bg-[#c39626] text-[#073B32] font-black text-xs uppercase tracking-wider shadow cursor-pointer"
          >
            I Understand & Close
          </button>
        </div>

      </div>
    </div>
  );
};
