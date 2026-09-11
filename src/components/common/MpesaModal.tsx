import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Loader2, Smartphone, ShieldCheck, ArrowRight, X, Copy, Check, Lock, Radio } from 'lucide-react';
import { BUSINESS_CONFIG } from '../../config/business';
import { useModalA11y } from '../../utils/useModalA11y';
import confetti from 'canvas-confetti';

export const MpesaModal: React.FC = () => {
  const { mpesaPrompt, closeMpesaPayment, addToast, recordPayment, bookings } = useApp();
  
  const [phoneNumber, setPhoneNumber] = useState(mpesaPrompt.phone || '0712901234');
  const [step, setStep] = useState<'prompt' | 'initiating' | 'waiting' | 'success' | 'failed'>('prompt');
  const [countdown, setCountdown] = useState(90);
  const [confirmedReceipt, setConfirmedReceipt] = useState('');
  const [failureMessage, setFailureMessage] = useState('');
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    if (mpesaPrompt.isOpen) {
      setPhoneNumber(mpesaPrompt.phone || '0712901234');
      setStep('prompt');
      setCountdown(90);
      setConfirmedReceipt('');
      setFailureMessage('');
      setCheckoutRequestId(null);
      hasProcessedRef.current = false;
    }
  }, [mpesaPrompt.isOpen, mpesaPrompt.phone]);

  const currentBooking = bookings.find(b => b.id === mpesaPrompt.bookingId);
  const serviceCost = currentBooking ? currentBooking.estimatedPrice : (mpesaPrompt.amount * 3);
  const depositCost = mpesaPrompt.amount;
  const balanceRemaining = Math.max(0, serviceCost - depositCost);

  const handlePaymentConfirmed = useCallback((receiptCode: string) => {
    if (hasProcessedRef.current) return;
    hasProcessedRef.current = true;

    setConfirmedReceipt(receiptCode);
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

    // Atomically record payment in application state
    if (mpesaPrompt.bookingId) {
      recordPayment({
        bookingId: mpesaPrompt.bookingId,
        amount: depositCost,
        method: 'M-Pesa',
        status: 'deposit_paid',
        transactionReference: receiptCode,
        invoiceId: mpesaPrompt.invoiceId
      });
    }

    if (mpesaPrompt.onSuccess) {
      mpesaPrompt.onSuccess(receiptCode);
    }
  }, [depositCost, mpesaPrompt, recordPayment]);

  // Initiate STK Push
  const handleInitiateSTK = async () => {
    if (!phoneNumber || phoneNumber.length < 9) {
      addToast('error', 'Invalid Phone Number', 'Please enter a valid Safaricom phone number (e.g. 0712345678).');
      return;
    }

    setStep('initiating');
    setFailureMessage('');
    hasProcessedRef.current = false;

    try {
      const response = await fetch('/api/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneNumber,
          amount: depositCost,
          bookingId: mpesaPrompt.bookingId,
          invoiceId: mpesaPrompt.invoiceId,
          accountReference: mpesaPrompt.bookingId || 'RollingRazors',
          transactionDesc: 'Custom Auto Upholstery Deposit'
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Strict production rule: If Daraja fails or credentials missing, FAIL explicitly
        const errorMsg = data.error || 'Failed to dispatch Lipa Na M-Pesa STK push. Gateway unavailable.';
        setFailureMessage(errorMsg);
        setStep('failed');
        addToast('error', 'M-Pesa Request Failed', errorMsg);
        return;
      }

      setCheckoutRequestId(data.CheckoutRequestID);
      setCountdown(90);
      setStep('waiting');
      addToast('info', 'STK Push Sent', `Please check handset ${phoneNumber} and enter your M-Pesa PIN.`);
    } catch (err: any) {
      const networkError = err?.message || 'Unable to connect to M-Pesa payment server.';
      setFailureMessage(networkError);
      setStep('failed');
      addToast('error', 'Connection Error', networkError);
    }
  };

  // Poll transaction status while waiting for user PIN
  useEffect(() => {
    if (step !== 'waiting' || !checkoutRequestId) return;

    let isSubscribed = true;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/mpesa/query/${checkoutRequestId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!isSubscribed) return;

        if (data.success && data.transaction) {
          if (data.transaction.status === 'SUCCESS') {
            clearInterval(interval);
            handlePaymentConfirmed(data.transaction.receiptNumber || 'M-PESA-PAID');
          } else if (data.transaction.status === 'FAILED') {
            clearInterval(interval);
            setFailureMessage(data.transaction.failureReason || 'Transaction cancelled by customer or failed on handset.');
            setStep('failed');
          }
        }
      } catch (err) {
        console.warn('Error polling M-Pesa status:', err);
      }
    }, 3500);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [step, checkoutRequestId, handlePaymentConfirmed]);

  // Countdown timer for handset entry
  useEffect(() => {
    if (step !== 'waiting') return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Countdown timeout without confirmation -> Fail strictly
      setFailureMessage('Transaction timed out waiting for M-Pesa PIN authorization on handset.');
      setStep('failed');
    }
  }, [step, countdown]);

  const modalRef = useModalA11y(mpesaPrompt.isOpen, closeMpesaPayment);

  if (!mpesaPrompt.isOpen) return null;

  const handleCopyReceipt = async () => {
    try { await navigator.clipboard.writeText(confirmedReceipt); } catch { const t=document.createElement('textarea'); t.value=confirmedReceipt; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      id="mpesa-payment-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        ref={modalRef}
        id="mpesa-payment-modal-card"
        role="dialog"
        aria-modal="true"
        aria-label="Lipa na M-Pesa payment"
        tabIndex={-1}
        className="w-full max-w-md bg-[#073B32] border border-[#D6A62E]/40 rounded-2xl shadow-2xl overflow-hidden text-[#F5F1E8] focus:outline-none"
      >
        {/* Modal Top Bar */}
        <div className="bg-[#0B4035] px-6 py-4 border-b border-[#D6A62E]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Safaricom Green / M-Pesa Badge */}
            <div className="w-10 h-10 rounded-xl bg-[#00A859] flex items-center justify-center text-white font-black text-xs tracking-tighter shadow-md">
              M-PESA
            </div>
            <div>
              <h3 className="font-bold text-base text-[#F5F1E8]">Lipa na M-Pesa Online</h3>
              <p className="text-xs text-[#D6A62E]">Paybill: {BUSINESS_CONFIG.mpesa.paybill} • Rolling Razors Customs</p>
            </div>
          </div>
          <button 
            id="close-mpesa-modal-btn"
            onClick={closeMpesaPayment}
            className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close payment dialog"
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
              <span>Deposit Payable Now</span>
              <span>KES {depositCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-white/60">
              <span>Remaining Balance (on vehicle collection)</span>
              <span>KES {balanceRemaining.toLocaleString()}</span>
            </div>
          </div>

          {/* STEP 1: Phone Prompt & STK Request */}
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
                    className="w-full pl-20 pr-4 py-3 rounded-xl bg-[#0B4035] border border-[#D6A62E]/50 text-[#F5F1E8] font-bold placeholder-white/30 focus:outline-none focus:border-[#D6A62E] focus:ring-1 focus:ring-[#D6A62E] text-base font-mono"
                  />
                </div>
                <p className="text-[11px] text-white/70 mt-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#25D366] shrink-0" />
                  <span>A Safaricom STK prompt will be sent directly to this handset.</span>
                </p>
              </div>

              <div className="bg-[#052822]/80 p-3 rounded-xl border border-white/10 flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-[#D6A62E] shrink-0 mt-0.5" />
                <p className="text-[11px] text-white/70 leading-relaxed">
                  <strong className="text-white">Security Note:</strong> You will authorize the transaction by entering your M-Pesa PIN <span className="text-[#D6A62E]">only on your physical mobile phone</span>. We never ask for your PIN online.
                </p>
              </div>

              <button
                id="send-stk-push-btn"
                onClick={handleInitiateSTK}
                className="w-full py-3.5 px-4 rounded-xl bg-[#00A859] hover:bg-[#00914d] text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all transform active:scale-95 cursor-pointer"
              >
                <span>Send STK Push • KES {depositCost.toLocaleString()}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-1">
                <span className="text-[11px] text-white/50">
                  Direct Safaricom Daraja API Gateway Verification
                </span>
              </div>
            </div>
          )}

          {/* STEP: Initiating STK Push */}
          {step === 'initiating' && (
            <div className="text-center py-6 space-y-4 animate-in fade-in">
              <Loader2 className="w-10 h-10 animate-spin text-[#25D366] mx-auto" />
              <div>
                <h4 className="font-bold text-base text-white">Connecting to Safaricom Daraja...</h4>
                <p className="text-xs text-white/70 mt-1">Dispatching STK Push request to {phoneNumber}...</p>
              </div>
            </div>
          )}

          {/* STEP 2: STK Push Sent - Waiting for Handset Confirmation */}
          {step === 'waiting' && (
            <div className="text-center py-4 space-y-5 animate-in fade-in">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-[#00A859]/30 animate-ping" />
                <div className="w-20 h-20 rounded-full bg-[#00A859] flex items-center justify-center text-white shadow-xl">
                  <Smartphone className="w-10 h-10 animate-bounce" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00A859]/20 text-[#25D366] text-xs font-bold border border-[#00A859]/30">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  STK PUSH SENT TO HANDSET
                </div>
                <h4 className="font-bold text-lg text-white">Check Your Phone</h4>
                <p className="text-xs text-white/80 max-w-xs mx-auto leading-relaxed">
                  Please unlock <span className="text-[#D6A62E] font-bold font-mono">+{phoneNumber.replace(/^\+/, '')}</span> and enter your M-Pesa PIN on the SIM prompt to complete payment.
                </p>
              </div>

              {/* Status Polling Indicator */}
              <div className="bg-[#052822] p-3.5 rounded-xl border border-emerald-800/60 flex items-center justify-center gap-2.5 text-xs text-[#D6A62E]">
                <Loader2 className="w-4 h-4 animate-spin text-[#25D366]" />
                <span>Awaiting Safaricom transaction confirmation ({countdown}s)...</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFailureMessage('Payment cancelled by user.');
                  setStep('failed');
                }}
                className="py-2 px-4 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel or Use Different Number
              </button>
            </div>
          )}

          {/* STEP 3: Success Screen (Verified Daraja Receipt) */}
          {step === 'success' && (
            <div className="text-center py-4 space-y-4 animate-in zoom-in-95 duration-300">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto text-emerald-400 shadow-lg">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-xl text-[#F5F1E8]">Payment Confirmed!</h4>
                <p className="text-xs text-white/70">
                  Deposit of <strong className="text-white">KES {depositCost.toLocaleString()}</strong> has been recorded and verified.
                </p>
              </div>

              {/* Receipt Pill */}
              <div className="bg-[#052822] p-4 rounded-xl border border-emerald-700/60 flex items-center justify-between text-xs">
                <div className="text-left">
                  <span className="text-white/60 block text-[10px] uppercase font-bold tracking-wider">M-Pesa Receipt Number</span>
                  <span className="font-mono font-black text-[#D6A62E] text-base">{confirmedReceipt}</span>
                </div>
                <button
                  id="copy-mpesa-receipt-btn"
                  onClick={handleCopyReceipt}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0B4035] hover:bg-[#D6A62E] hover:text-[#073B32] text-white text-xs font-semibold transition-all shadow cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>

              <div className="bg-[#052822]/60 p-3 rounded-lg border border-white/5 text-left text-xs space-y-1 text-white/80">
                <div className="flex justify-between">
                  <span className="text-white/50">Status:</span>
                  <span className="text-emerald-400 font-bold">Booking Confirmed</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Balance Remaining:</span>
                  <span className="text-white font-bold">KES {balanceRemaining.toLocaleString()}</span>
                </div>
              </div>

              <button
                id="done-mpesa-btn"
                onClick={closeMpesaPayment}
                className="w-full py-3.5 px-4 rounded-xl bg-[#D6A62E] hover:bg-[#c49727] text-[#073B32] font-black text-xs uppercase tracking-wider shadow-lg transition-colors cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          )}

          {/* STEP 4: Failed State (Explicit error, NO fake fallback) */}
          {step === 'failed' && (
            <div className="text-center py-4 space-y-4 animate-in fade-in">
              <div className="w-14 h-14 rounded-full bg-rose-500/20 border-2 border-rose-400 flex items-center justify-center mx-auto text-rose-400">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-lg text-white">Payment Unsuccessful</h4>
                <p className="text-xs text-rose-300 font-medium px-2">
                  {failureMessage || 'The M-Pesa transaction could not be completed.'}
                </p>
                <p className="text-[11px] text-white/50 mt-1">
                  No funds were deducted. Check your network or M-Pesa gateway credentials.
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setFailureMessage('');
                    setStep('prompt');
                  }}
                  className="flex-1 py-2.5 rounded-lg bg-[#D6A62E] hover:bg-[#c49727] text-[#073B32] font-bold text-xs cursor-pointer transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={closeMpesaPayment}
                  className="flex-1 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs cursor-pointer transition-colors"
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
