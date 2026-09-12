import React, { useEffect, useState } from 'react';
import { Cookie, ShieldCheck } from 'lucide-react';
import { getCookieConsent, setCookieConsent, type CookieConsent } from '../../lib/consent';
import { initAnalytics } from '../../lib/analytics';
import { useApp } from '../../context/AppContext';

export const CookieConsentBanner: React.FC = () => {
  const { openLegalModal } = useApp();
  const [consent, setConsent] = useState<CookieConsent | null>(() => getCookieConsent());

  useEffect(() => {
    if (consent === 'accepted') initAnalytics();
  }, [consent]);

  if (consent) return null;

  const choose = (value: CookieConsent) => {
    setCookieConsent(value);
    setConsent(value);
    if (value === 'accepted') initAnalytics();
  };

  return (
    <aside className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-3xl rounded-2xl border border-[#D6A62E]/35 bg-[#052822]/95 p-4 text-[#F5F1E8] shadow-2xl backdrop-blur-xl sm:inset-x-6 sm:p-5" role="dialog" aria-label="Cookie preferences">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-xl border border-[#D6A62E]/30 bg-[#0B4035] p-2 text-[#D6A62E]">
          <Cookie className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black">Your privacy, your choice</h2>
            <ShieldCheck className="h-4 w-4 text-[#25D366]" aria-hidden="true" />
          </div>
          <p className="mt-1 text-xs leading-5 text-white/70">
            We use essential cookies to keep the site secure. With your permission, we also use Google Analytics to understand visits and improve the booking experience.
          </p>
          <button type="button" onClick={() => openLegalModal('privacy')} className="mt-2 text-xs font-bold text-[#D6A62E] underline underline-offset-2">
            Read the Privacy Policy
          </button>
        </div>
      </div>
      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={() => choose('essential')} className="rounded-xl border border-white/15 px-4 py-2.5 text-xs font-bold text-white/80 hover:border-[#D6A62E]/50 hover:text-white">
          Essential only
        </button>
        <button type="button" onClick={() => choose('accepted')} className="rounded-xl bg-[#D6A62E] px-4 py-2.5 text-xs font-black uppercase tracking-wide text-[#073B32] hover:bg-[#c39626]">
          Accept analytics
        </button>
      </div>
    </aside>
  );
};
