import React, { useState } from 'react';
import { MessageCircle, X, Send, PhoneCall, Clock, CheckCircle2 } from 'lucide-react';
import { BUSINESS_CONFIG } from '../../config/business';

interface WhatsAppFloatProps {
  defaultMessage?: string;
  vehiclePlate?: string;
}

export const WhatsAppFloat: React.FC<WhatsAppFloatProps> = ({ 
  defaultMessage = BUSINESS_CONFIG.whatsapp.defaultMessage,
  vehiclePlate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customMsg, setCustomMsg] = useState(
    vehiclePlate 
      ? `Hello Rolling Razors, I would like to inquire about upholstery for my vehicle (${vehiclePlate}).`
      : defaultMessage
  );

  const handleSend = () => {
    const encoded = encodeURIComponent(customMsg);
    window.open(`https://wa.me/${BUSINESS_CONFIG.whatsapp.number}?text=${encoded}`, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  const quickTemplates = [
    "I want a quote for full car interior leather work.",
    "Do you do custom steering wheel stitching?",
    "Can you replace sagging roof headliner today?",
    "I need heavy-duty cushions for my matatu shuttle."
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* WhatsApp Chat Popup */}
      {isOpen && (
        <div 
          id="whatsapp-chat-popup"
          className="mb-4 w-80 sm:w-96 rounded-xl bg-[#073B32] border border-[#D6A62E]/40 text-[#F5F1E8] shadow-2xl overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
        >
          {/* Header */}
          <div className="bg-[#0B4035] p-4 border-b border-[#D6A62E]/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white shadow-md">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0B4035]" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#F5F1E8]">Rolling Razors Support</h4>
                <p className="text-xs text-[#D6A62E] flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Typically replies in 5 mins
                </p>
              </div>
            </div>
            <button 
              id="close-whatsapp-popup-btn"
              onClick={() => setIsOpen(false)}
              className="text-[#F5F1E8]/70 hover:text-[#F5F1E8] p-1 rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 bg-[#073B32]/95 space-y-3">
            <div className="bg-[#0B4035]/80 p-3 rounded-lg border border-emerald-800/40 text-xs leading-relaxed">
              <p className="text-[#F5F1E8] mb-1 font-medium">
                Habari! 👋 Welcome to Rolling Razors Customs Kenya.
              </p>
              <p className="text-[#F5F1E8]/80">
                Share photos of your seats or tell us your vehicle model for an instant tailored quote.
              </p>
            </div>

            {/* Quick Prompts */}
            <div className="space-y-1.5 pt-1">
              <p className="text-[11px] font-semibold text-[#D6A62E] uppercase tracking-wider">
                Quick Questions:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {quickTemplates.map((tmpl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCustomMsg(tmpl)}
                    className="text-left text-[11px] px-2.5 py-1 rounded bg-[#0B4035] hover:bg-[#D6A62E] hover:text-[#073B32] text-[#F5F1E8] border border-white/10 transition-colors"
                  >
                    {tmpl}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input */}
            <div className="pt-2">
              <textarea
                id="whatsapp-custom-msg-input"
                rows={2}
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                placeholder="Type your vehicle inquiry here..."
                className="w-full text-xs p-2.5 rounded-lg bg-[#052822] border border-emerald-700/50 text-[#F5F1E8] placeholder-white/40 focus:outline-none focus:border-[#D6A62E] resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                id="send-whatsapp-chat-btn"
                onClick={handleSend}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs shadow transition-colors"
              >
                <Send className="w-3.5 h-3.5" /> Start WhatsApp Chat
              </button>
              <a
                href={BUSINESS_CONFIG.phone.telLink}
                id="direct-phone-call-btn"
                className="flex items-center justify-center p-2 rounded-lg bg-[#0B4035] hover:bg-[#D6A62E] hover:text-[#073B32] text-[#F5F1E8] border border-[#D6A62E]/30 transition-colors"
                title={`Call ${BUSINESS_CONFIG.phone.formatted}`}
              >
                <PhoneCall className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Trigger Button */}
      <button
        id="toggle-whatsapp-float-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white font-semibold text-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
        aria-label="Chat on WhatsApp with Rolling Razors Customs"
      >
        <MessageCircle className="w-6 h-6 fill-white" />
        <span className="hidden sm:inline font-medium tracking-wide">Chat on WhatsApp</span>
        <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
      </button>
    </div>
  );
};
