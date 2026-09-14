import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Loader2, CreditCard, ShieldCheck, ArrowRight, X, Copy, Check, Lock } from 'lucide-react';
import { useModalA11y } from '../../utils/useModalA11y';
import confetti from 'canvas-confetti';

const PAYSTACK_PUBLIC_KEY = (import.meta as any).env?.VITE_PAYSTACK_PUBLIC_KEY || '';

let paystackScriptPromise: Promise<boolean> | null = null;
function loadPaystackInline(): Promise<boolean> {
  if (typeof (window as any).PaystackPop !== 'undefined') return Promise.resolve(true);
  if (!paystackScriptPromise) {
    paystackScriptPromise = new Promise(resolve => {
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      script.onload = () => resolve(typeof (window as any).PaystackPop !== 'undefined');
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  }
  return paystackScriptPromise;
}

export const PaystackModal: React.FC = () => {
  const { paystackPrompt, closePaystackPayment, addToast, recordPayment, bookings, authFetch } = useApp();

  const [email, setEmail] = useState(paystackPrompt.email || '');
  const [step, setStep] = useState<'prompt' | 'initiating' | 'verifying' | 'success' | 'failed'>('prompt');
  const [confirmedReceipt, setConfirmedReceipt] = useState('');
  const [failureMessage, setFailureMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const hasProcessedRef = useRef(false);

  const currentBooking = bookings.find(b => b.id === paystackPrompt.bookingId);
  const serviceCost = currentBooking ? currentBooking.estimatedPrice : (paystackPrompt.amount * 3);
  const depositCost = paystackPrompt.amount;
  const balanceRemaining = Math.max(0, serviceCost - depositCost);

  useEffect(() => {
    if (paystackPrompt.isOpen) {
      setEmail(paystackPrompt.email || '');
      setStep('prompt');
      setConfirmedReceipt('');
      setFailureMessage('');
      hasProcessedRef.current = false;
    }
  }, [paystackPrompt.isOpen, paystackPrompt.email]);

  useEffect(() => {
    if (!paystackPrompt.isOpen || email) return;
    const booking = bookings.find(b => b.id === paystackPrompt.bookingId);
    if (booking?.customerEmail) setEmail(booking.customerEmail);
  }, [paystackPrompt.isOpen, paystackPrompt.bookingId, bookings, email]);

  const handlePaymentConfirmed = useCallback((reference: string) => {
    if (hasProcessedRef.current) return;
    hasProcessedRef.current = true;

    setConfirmedReceipt(reference);
    setStep('success');

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#073B32', '#D6A62E', '#2563EB', '#F5F1E8']
      });
    } catch {
      // safe fallback
    }

    if (paystackPrompt.bookingId) {
      recordPayment({
        bookingId: paystackPrompt.bookingId,
        amount: depositCost,
        method: 'Paystack',
        status: 'deposit_paid',
        transactionReference: reference,
        invoiceId: paystackPrompt.invoiceId
      });
    }

    if (paystackPrompt.onSuccess) {
      paystackPrompt.onSuccess(reference);
    }
  }, [depositCost, paystackPrompt, recordPayment]);

  // Server-side verification loop after the Paystack inline callback completes.
  const verifyPayment = useCallback(async (reference: string): Promise<string | null> => {
    for (let attempt = 0; attempt < 6; attempt++) {
      try {
        const res = await authFetch(`/api/paystack/verify?reference=${encodeURIComponent(reference)}`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          setFailureMessage(data.error || 'Could not verify your payment. Please contact support with your reference.');
          setStep('failed');
          return null;
        }
        if (data.transaction?.status === 'SUCCESS') return reference;
        if (data.transaction?.status === 'FAILED' || data.status === 'FAILED') {
          setFailureMessage(data.transaction?.failureReason || 'Payment was not completed.');
          setStep('failed');
          return null;
        }
      } catch {
        // transient error — keep polling
      }
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    setFailureMessage('Payment is taking longer than expected. We will confirm it via webhook shortly — your booking is safe.');
    setStep('failed');
    return null;
  }, [authFetch]);

  const handleInitiateCheckout = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      addToast('error', 'Invalid Email', 'Please enter the email where your payment receipt should be sent.');
      return;
    }
    if (!PAYSTACK_PUBLIC_KEY) {
      addToast('error', 'Gateway Not Configured', 'Paystack public key is missing. Please configure VITE_PAYSTACK_PUBLIC_KEY.');
      setFailureMessage('Paystack is not configured yet. Please contact the administrator.');
      setStep('failed');
      return;
    }

    setStep('initiating');
    setFailureMessage('');
    hasProcessedRef.current = false;

    try {
      const response = await authFetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: depositCost,
          email,
          bookingId: paystackPrompt.bookingId,
          invoiceId: paystackPrompt.invoiceId
        })
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        const errorMsg = data.error || 'Failed to start the Paystack checkout. Please try again.';
        setFailureMessage(errorMsg);
        setStep('failed');
        addToast('error', 'Checkout Failed', errorMsg);
        return;
      }

      const loaded = await loadPaystackInline();
      if (!loaded) {
        setFailureMessage('Could not load the secure Paystack checkout window. Please check your connection or use M-Pesa.');
        setStep('failed');
        return;
      }

      const PaystackPop = (window as any).PaystackPop;
      const popup = PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email,
        amount: Math.round(depositCost * 100),
        currency: 'KES',
        ref: data.reference,
        callback: (result: any) => {
          const ref = result?.reference || data.reference;
          setStep('verifying');
          verifyPayment(ref).then(confirmed => {
            if (confirmed) handlePaymentConfirmed(confirmed);
          }).catch(() => {
            setFailureMessage('Could not verify your payment. Please contact support with your reference.');
            setStep('failed');
          });
        },
        onClose: () => {
          if (!hasProcessedRef.current) {
            setFailureMessage('Payment window closed before completion. No money was deducted.');
            setStep('failed');
          }
        }
      });
      popup.openIframe();
      setStep('verifying');
      addToast('info', 'Secure Checkout', `Paystack checkout opened for KES ${depositCost.toLocaleString()}.`);
    } catch (err: any) {
      const networkError = err?.message || 'Unable to connect to the payment gateway.';
      setFailureMessage(networkError);
      setStep('failed');
      addToast('error', 'Connection Error', networkError);
    }
  };

  const modalRef = useModalA11y(paystackPrompt.isOpen, closePaystackPayment);

  if (!paystackPrompt.isOpen) return null;

  const handleCopyReceipt = async () => {
    try { await navigator.clipboard.writeText(confirmedReceipt); } catch { const t = document.createElement('textarea'); t.value = confirmedReceipt; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="paystack-payment-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        ref={modalRef}
        id="paystack-payment-modal-card"
        role="dialog"
        aria-modal="true"
        aria-label="Paystack payment"
        tabIndex={-1}
        className="w-full max-w-md bg-[#073B32] border border-[#D6A62E]/40 rounded-2xl shadow-2xl overflow-hidden text-[#F5F1E8] focus:outline-none"
      >
        {/* Modal Top Bar */}
        <div className="bg-[#0B4035] px-6 py-4 border-b border-[#D6A62E]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2563EB] flex items-center justify-center text-white font-black text-[10px] tracking-tighter shadow-md">
              PS
            </div>
            <div>
              <h3 className="font-bold text-base text-[#F5F1E8]">Pay Deposit Securely</h3>
              <p className="text-xs text-[#D6A62E]">Card • Bank Transfer • M-Pesa • Rolling Razors Customs</p>
            </div>
          </div>
          <button
            id="close-paystack-modal-btn"
            onClick={closePaystackPayment}
            className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close payment dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Financial Summary Card */}
        <div className="p-6 space-y-5">
          <div className="bg-[#052822] p-4 rounded-xl border border-blue-900/60 space-y-2.5">
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

          {step === 'prompt' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#D6A62E] mb-1.5 uppercase tracking-wider">
                  Receipt Email
                </label>
                <input
                  id="paystack-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-[#0B4035] border border-[#D6A62E]/50 text-[#F5F1E8] font-semibold placeholder-white/30 focus:outline-none focus:border-[#D6A62E] focus:ring-1 focus:ring-[#D6A62E] text-base"
                />
                <p className="text-[11px] text-white/70 mt-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#25D366] shrink-0" />
                  <span>Your payment receipt is emailed here immediately.</span>
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Card', sub: 'Visa • Mastercard' },
                  { label: 'M-Pesa', sub: 'Mobile money' },
                  { label: 'Bank', sub: 'Transfer • USSD' }
                ].map(ch => (
                  <div key={ch.label} className="bg-[#052822]/80 p-2.5 rounded-xl border border-white/10 text-center">
                    <p className="text-[11px] font-bold text-white">{ch.label}</p>
                    <p className="text-[9px] text-white/50">{ch.sub}</p>
                  </div>
                ))}
              </div>

              <div className="bg-[#052822]/80 p-3 rounded-xl border border-white/10 flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-[#D6A62E] shrink-0 mt-0.5" />
                <p className="text-[11px] text-white/70 leading-relaxed">
                  <strong className="text-white">Security Note:</strong> Payment is processed inside the PCI-DSS compliant Paystack checkout window. We never see your card details.
                </p>
              </div>

              <button
                id="open-paystack-checkout-btn"
                onClick={handleInitiateCheckout}
                className="w-full py-3.5 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all transform active:scale-95 cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>Pay KES {depositCost.toLocaleString()}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-1">
                <span className="text-[11px] text-white/50">Powered by Paystack • Kenya Shillings (KES)</span>
              </div>
            </div>
          )}

          {/* STEP: Initializing Checkout */}
          {step === 'initiating' && (
            <div className="text-center py-6 space-y-4 animate-in fade-in">
              <Loader2 className="w-10 h-10 animate-spin text-[#2563EB] mx-auto" />
              <div>
                <h4 className="font-bold text-base text-white">Contacting Paystack...</h4>
                <p className="text-xs text-white/70 mt-1">Creating a secure checkout for KES {depositCost.toLocaleString()}...</p>
              </div>
            </div>
          )}

          {/* STEP: Verifying after popup */}
          {step === 'verifying' && (
            <div className="text-center py-6 space-y-4 animate-in fade-in">
              <Loader2 className="w-10 h-10 animate-spin text-[#2563EB] mx-auto" />
              <div>
                <h4 className="font-bold text-base text-white">Verifying Payment...</h4>
                <p className="text-xs text-white/70 mt-1">Confirming your payment with Paystack. This takes a few seconds.</p>
              </div>
            </div>
          )}

          {/* STEP: Success */}
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

              <div className="bg-[#052822] p-4 rounded-xl border border-blue-900/60 flex items-center justify-between text-xs">
                <div className="text-left">
                  <span className="text-white/60 block text-[10px] uppercase font-bold tracking-wider">Paystack Reference</span>
                  <span className="font-mono font-black text-[#D6A62E] text-sm">{confirmedReceipt}</span>
                </div>
                <button
                  id="copy-paystack-receipt-btn"
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
                id="done-paystack-btn"
                onClick={closePaystackPayment}
                className="w-full py-3.5 px-4 rounded-xl bg-[#D6A62E] hover:bg-[#c49727] text-[#073B32] font-black text-xs uppercase tracking-wider shadow-lg transition-colors cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          )}

          {/* STEP: Failed */}
          {step === 'failed' && (
            <div className="text-center py-4 space-y-4 animate-in fade-in">
              <div className="w-14 h-14 rounded-full bg-rose-500/20 border-2 border-rose-400 flex items-center justify-center mx-auto text-rose-400">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-lg text-white">Payment Unsuccessful</h4>
                <p className="text-xs text-rose-300 font-medium px-2">
                  {failureMessage || 'The payment could not be completed.'}
                </p>
                <p className="text-[11px] text-white/50 mt-1">
                  No funds were deducted. You can retry or use M-Pesa.
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
                  onClick={closePaystackPayment}
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