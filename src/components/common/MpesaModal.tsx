import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Loader2, Smartphone, ShieldCheck, ArrowRight, X, Copy, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

export const MpesaModal: React.FC = () => {
  const { mpesaPrompt, closeMpesaPayment, addToast, updateBookingStatus, bookings } = useApp();
  
  const [phoneNumber, setPhoneNumber] = useState(mpesaPrompt.phone || '0712901234');
  const [step, setStep] = useState<'prompt' | 'push_sent' | 'pin_sim' | 'success' | 'failed'>('prompt');
  const [simulatedPin, setSimulatedPin] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [generatedReceipt, setGeneratedReceipt] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (mpesaPrompt.isOpen) {
      setPhoneNumber(mpesaPrompt.phone || '0712901234');
      setStep('prompt');
      setSimulatedPin('');
      setCountdown(30);
      setGeneratedReceipt('');
    }
  }, [mpesaPrompt.isOpen, mpesaPrompt.phone]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'push_sent' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setStep('pin_sim');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  if (!mpesaPrompt.isOpen) return null;

  const currentBooking = bookings.find(b => b.id === mpesaPrompt.bookingId);
  const serviceCost = currentBooking ? currentBooking.estimatedPrice : (mpesaPrompt.amount * 3);
  const depositCost = mpesaPrompt.amount;
  const balanceRemaining = Math.max(0, serviceCost - depositCost);

  const handleInitiateSTK = () => {
    if (!phoneNumber || phoneNumber.length < 9) {
      addToast('error', 'Invalid Phone Number', 'Please enter a valid Safaricom phone number (e.g. 0712345678).');
      return;
    }
    setStep('push_sent');
    setCountdown(4);
  };

  const handleSimulatePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (simulatedPin.length < 4) {
      addToast('error', 'Invalid PIN', 'Enter a 4-digit M-Pesa PIN.');
      return;
    }

    // Generate authentic Safaricom M-Pesa Code e.g. QJ89LK3299
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
    let code = 'RR';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedReceipt(code);
    setStep('success');

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#073B32', '#D6A62E', '#25D366', '#F5F1E8']
      });
    } catch {
      // safe fallback
    }

    if (mpesaPrompt.bookingId) {
      updateBookingStatus(mpesaPrompt.bookingId, 'confirmed', `Deposit of KES ${depositCost.toLocaleString()} paid via M-Pesa (Ref: ${code}).`);
    }

    if (mpesaPrompt.onSuccess) {
      mpesaPrompt.onSuccess(code);
    }

    addToast('success', 'M-Pesa Payment Received!', `Receipt ${code}. Deposit of KES ${depositCost.toLocaleString()} confirmed.`);
  };

  const handleCopyReceipt = () => {
    navigator.clipboard.writeText(generatedReceipt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      id="mpesa-payment-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        id="mpesa-payment-modal-card"
        className="w-full max-w-md bg-[#073B32] border border-[#D6A62E]/40 rounded-2xl shadow-2xl overflow-hidden text-[#F5F1E8]"
      >
        {/* Modal Top Bar */}
        <div className="bg-[#0B4035] px-6 py-4 border-b border-[#D6A62E]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Safaricom Green / M-Pesa Badge */}
            <div className="w-9 h-9 rounded-lg bg-[#00A859] flex items-center justify-center text-white font-black text-xs tracking-tighter shadow">
              M-PESA
            </div>
            <div>
              <h3 className="font-bold text-base text-[#F5F1E8]">Lipa na M-Pesa Online</h3>
              <p className="text-xs text-[#D6A62E]">Paybill: 889900 • Rolling Razors</p>
            </div>
          </div>
          <button 
            id="close-mpesa-modal-btn"
            onClick={closeMpesaPayment}
            className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Financial Summary Card */}
        <div className="p-6 space-y-5">
          <div className="bg-[#052822] p-4 rounded-xl border border-emerald-800/60 space-y-2.5">
            <div className="flex justify-between text-xs text-white/70">
              <span>Service Estimate</span>
              <span className="font-semibold text-white">KES {serviceCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-[#D6A62E] font-bold border-t border-white/10 pt-2">
              <span>Deposit Due Now</span>
              <span>KES {depositCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-white/60">
              <span>Remaining Balance (on vehicle collection)</span>
              <span>KES {balanceRemaining.toLocaleString()}</span>
            </div>
          </div>

          {/* STEP 1: Phone Prompt */}
          {step === 'prompt' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#D6A62E] mb-1.5 uppercase tracking-wider">
                  Safaricom M-Pesa Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#D6A62E] text-sm font-semibold">
                    🇰🇪 +254
                  </div>
                  <input
                    id="mpesa-phone-input"
                    type="tel"
                    value={phoneNumber.replace(/^\+254/, '')}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="712345678"
                    className="w-full pl-20 pr-4 py-3 rounded-xl bg-[#0B4035] border border-[#D6A62E]/50 text-[#F5F1E8] font-bold placeholder-white/30 focus:outline-none focus:border-[#D6A62E] focus:ring-1 focus:ring-[#D6A62E] text-base"
                  />
                </div>
                <p className="text-[11px] text-white/60 mt-1.5 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#25D366]" /> An STK push prompt will be sent directly to this phone.
                </p>
              </div>

              <button
                id="send-stk-push-btn"
                onClick={handleInitiateSTK}
                className="w-full py-3.5 px-4 rounded-xl bg-[#D6A62E] hover:bg-[#c49727] text-[#073B32] font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all transform active:scale-95 cursor-pointer"
              >
                <span>Pay Deposit KES {depositCost.toLocaleString()}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-1">
                <span className="text-[11px] text-white/50">
                  Instant automated verification • No waiting time
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: STK Push Sent animation */}
          {step === 'push_sent' && (
            <div className="text-center py-6 space-y-4 animate-in fade-in">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-[#00A859]/30 animate-ping" />
                <div className="w-16 h-16 rounded-full bg-[#00A859] flex items-center justify-center text-white shadow-lg">
                  <Smartphone className="w-8 h-8 animate-bounce" />
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-lg text-white">Sending STK Push...</h4>
                <p className="text-xs text-white/70 max-w-xs mx-auto">
                  Please unlock your phone <span className="text-[#D6A62E] font-semibold">{phoneNumber}</span> to authorize payment.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-[#D6A62E]">
                <Loader2 className="w-4 h-4 animate-spin" /> Awaiting SIM ToolKit response ({countdown}s)
              </div>
            </div>
          )}

          {/* STEP 3: Simulated Phone Screen for Instant Interactive Demo */}
          {step === 'pin_sim' && (
            <form onSubmit={handleSimulatePinSubmit} className="space-y-4 animate-in fade-in">
              {/* Phone Prompt Box */}
              <div className="bg-[#17201E] border-2 border-[#00A859] p-4 rounded-xl text-center space-y-3 shadow-inner">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#00A859]/20 text-[#25D366] text-[11px] font-bold">
                  SIM TOOLKIT (STK PUSH)
                </div>
                <p className="text-xs text-white/90 leading-snug">
                  Pay <span className="text-[#D6A62E] font-bold">KES {depositCost.toLocaleString()}</span> to <br/>
                  <strong className="text-white">ROLLING RAZORS CUSTOMS</strong><br/>
                  Acc: <span className="text-[#D6A62E]">{mpesaPrompt.bookingId || 'RR-CUSTOM'}</span>
                </p>
                <div>
                  <label className="block text-[11px] text-white/60 mb-1">Enter 4-Digit M-Pesa PIN:</label>
                  <input
                    id="simulated-mpesa-pin"
                    type="password"
                    maxLength={4}
                    autoFocus
                    value={simulatedPin}
                    onChange={(e) => setSimulatedPin(e.target.value)}
                    placeholder="••••"
                    className="w-32 mx-auto text-center py-2 px-3 text-lg tracking-[0.5em] font-mono rounded bg-black/60 border border-[#00A859] text-emerald-400 focus:outline-none focus:ring-2 focus:ring-[#00A859]"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('failed')}
                  className="flex-1 py-2.5 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  id="confirm-simulated-pin-btn"
                  type="submit"
                  className="flex-1 py-2.5 px-3 rounded-lg bg-[#00A859] hover:bg-[#00914d] text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Authorize Payment
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: Success Screen */}
          {step === 'success' && (
            <div className="text-center py-4 space-y-4 animate-in zoom-in-95 duration-300">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-xl text-[#F5F1E8]">Deposit Received!</h4>
                <p className="text-xs text-white/70">
                  Your appointment is officially confirmed with Rolling Razors Customs.
                </p>
              </div>

              {/* Receipt Pill */}
              <div className="bg-[#052822] p-3 rounded-xl border border-emerald-700/60 flex items-center justify-between text-xs">
                <div className="text-left">
                  <span className="text-white/60 block text-[10px] uppercase">M-Pesa Transaction Code</span>
                  <span className="font-mono font-bold text-[#D6A62E] text-sm">{generatedReceipt}</span>
                </div>
                <button
                  id="copy-mpesa-receipt-btn"
                  onClick={handleCopyReceipt}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0B4035] hover:bg-[#D6A62E] hover:text-[#073B32] text-white text-[11px] font-semibold transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>

              <button
                id="done-mpesa-btn"
                onClick={closeMpesaPayment}
                className="w-full py-3 px-4 rounded-xl bg-[#D6A62E] hover:bg-[#c49727] text-[#073B32] font-black text-xs uppercase tracking-wider shadow"
              >
                Return to Dashboard
              </button>
            </div>
          )}

          {/* STEP 5: Failed State */}
          {step === 'failed' && (
            <div className="text-center py-4 space-y-4 animate-in fade-in">
              <div className="w-14 h-14 rounded-full bg-rose-500/20 border-2 border-rose-400 flex items-center justify-center mx-auto text-rose-400">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-lg text-white">Payment Incomplete</h4>
                <p className="text-xs text-white/70">The M-Pesa transaction was cancelled or timed out.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setStep('prompt')}
                  className="flex-1 py-2.5 rounded-lg bg-[#D6A62E] text-[#073B32] font-bold text-xs"
                >
                  Try Again
                </button>
                <button
                  onClick={closeMpesaPayment}
                  className="flex-1 py-2.5 rounded-lg bg-white/10 text-white font-semibold text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
