import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Service, VehicleType } from '../../types';
import { 
  Scissors, 
  Calendar, 
  Car, 
  Sparkles, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  Smartphone,
  CheckCircle2,
  FileText,
  MessageCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const BookingWizard: React.FC = () => {
  const { 
    services, 
    addBooking, 
    currentUser, 
    setView, 
    openMpesaPayment, 
    openAuth,
    bookingWizardInitialServiceId,
    setBookingWizardInitialServiceId,
    bookingWizardDraft,
    setBookingWizardDraft,
    setCustomerTab,
    addToast,
    openLegalModal
  } = useApp();

  // Wizard Steps: 1: Service, 2: Vehicle & Customization, 3: Date & Details, 4: Deposit & M-Pesa, 5: Confirmed
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    bookingWizardInitialServiceId || services[0]?.id || 'srv-1'
  );
  const [vehicleMake, setVehicleMake] = useState<string>('Toyota');
  const [vehicleModel, setVehicleModel] = useState<string>('Land Cruiser Prado TX');
  const [vehicleYear, setVehicleYear] = useState<number>(2021);
  const [vehicleReg, setVehicleReg] = useState<string>('KDF 892J');
  const [vehicleType, setVehicleType] = useState<VehicleType>('SUV');
  const [material, setMaterial] = useState<string>('Genuine Nappa Leather');
  const [color, setColor] = useState<string>('Saddle Brown & Black');
  const [pattern, setPattern] = useState<string>('Diamond Quilted');
  const [notes, setNotes] = useState<string>('Please reinforce the driver seat lumbar bolster with heavy-duty orthopedic foam.');

  // Date and Time
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [selectedDate, setSelectedDate] = useState<string>(tomorrow.toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string>('10:00 AM - 12:00 PM');
  const [locationType, setLocationType] = useState<'workshop' | 'customer_location'>('workshop');
  const [customerLocationAddress, setCustomerLocationAddress] = useState<string>('Kilimani, Nairobi');

  // Customer Details
  const [customerName, setCustomerName] = useState<string>(currentUser?.name || '');
  const [customerPhone, setCustomerPhone] = useState<string>(currentUser?.phone || '');
  const [customerEmail, setCustomerEmail] = useState<string>(currentUser?.email || '');
  const [policyConsent, setPolicyConsent] = useState(false);

  // Confirmed booking state
  const [confirmedBookingId, setConfirmedBookingId] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      if (!customerName) setCustomerName(currentUser.name || '');
      if (!customerPhone) setCustomerPhone(currentUser.phone || '');
      if (!customerEmail) setCustomerEmail(currentUser.email || '');
    }
  }, [currentUser]);

  useEffect(() => {
    if (bookingWizardInitialServiceId) {
      setSelectedServiceId(bookingWizardInitialServiceId);
    }
    if (bookingWizardDraft) {
      if (bookingWizardDraft.vehicleType) setVehicleType(bookingWizardDraft.vehicleType as any);
      if (bookingWizardDraft.preferredDate) setSelectedDate(bookingWizardDraft.preferredDate);
      if (bookingWizardDraft.preferredTime) setSelectedTime(bookingWizardDraft.preferredTime);
      if (bookingWizardDraft.locationType) setLocationType(bookingWizardDraft.locationType);
      if (bookingWizardDraft.vehicleMake) setVehicleMake(bookingWizardDraft.vehicleMake);
      if (bookingWizardDraft.vehicleModel) setVehicleModel(bookingWizardDraft.vehicleModel);
      if (bookingWizardDraft.vehicleYear) setVehicleYear(bookingWizardDraft.vehicleYear);
      if (bookingWizardDraft.vehicleReg) setVehicleReg(bookingWizardDraft.vehicleReg);
      if (bookingWizardDraft.customerName) setCustomerName(bookingWizardDraft.customerName);
      if (bookingWizardDraft.customerPhone) setCustomerPhone(bookingWizardDraft.customerPhone);
      if (bookingWizardDraft.customerEmail) setCustomerEmail(bookingWizardDraft.customerEmail);
      if (bookingWizardDraft.notes) setNotes(bookingWizardDraft.notes);
      if (bookingWizardDraft.customerLocationAddress) setCustomerLocationAddress(bookingWizardDraft.customerLocationAddress);
      if ((bookingWizardDraft as any).material) setMaterial((bookingWizardDraft as any).material);
      if ((bookingWizardDraft as any).color) setColor((bookingWizardDraft as any).color);
      if ((bookingWizardDraft as any).pattern) setPattern((bookingWizardDraft as any).pattern);
    }
  }, [bookingWizardInitialServiceId, bookingWizardDraft]);

  const selectedService = services.find(s => s.id === selectedServiceId) || services[0];
  const serviceCost = selectedService.startingPrice;
  const depositAmount = Math.round(serviceCost * 0.35); // 35% deposit
  const balanceRemaining = serviceCost - depositAmount;

  const timeSlots = [
    '8:00 AM - 10:00 AM',
    '10:00 AM - 12:00 PM',
    '1:00 PM - 3:00 PM',
    '3:00 PM - 5:00 PM'
  ];

  const vehicleTypes: VehicleType[] = ['Car', 'SUV', 'Van', 'Truck', 'Matatu', 'Other'];

  const materials = [
    'Genuine Nappa Leather',
    'Italian Full Grain',
    'Heavy-Duty Commercial Vinyl',
    'Alcantara Suede & Leather Combo',
    'Waterproof Ripstop Canvas'
  ];

  const colors = [
    'Saddle Brown & Black',
    'Cognac Tan & Jet Black',
    'All Jet Black with Red Stitch',
    'Deep Burgundy Wine',
    'Forest Green & Gold Accent',
    'Classic Charcoal Grey'
  ];

  const patterns = [
    'Diamond Quilted',
    'Double French Stitch',
    'Honeycomb Hexagon',
    'Classic Horizontal Pleats',
    'Perforated Motorsport'
  ];

  const handleNext = () => {
    if (currentStep === 1) {
      if (!selectedServiceId) return;
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!vehicleMake || !vehicleModel || !vehicleReg) {
        addToast('warning', 'Missing Vehicle Details', 'Please fill in vehicle make, model and registration plate number.');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!customerName || !customerPhone || !selectedDate) {
        addToast('warning', 'Missing Contact Details', 'Please provide your name, Kenyan phone number, and appointment date.');
        return;
      }
      setCurrentStep(4);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleCompleteBookingWithMpesa = async () => {
    if (!policyConsent) {
      addToast('warning', 'Confirm the booking terms', 'Please accept the Privacy Policy and Terms of Service before submitting your booking.');
      return;
    }
    if (!currentUser) {
      setBookingWizardDraft({
        vehicleType, preferredDate: selectedDate, preferredTime: selectedTime, locationType,
        material, color, pattern, vehicleMake, vehicleModel, vehicleYear, vehicleReg,
        customerName, customerPhone, customerEmail, notes, customerLocationAddress,
      });
      addToast('info', 'Sign in to continue', 'Please sign in before submitting a booking so we can securely save it to your account.');
      openAuth('customer', 'booking');
      return;
    }
    // 1. Create booking object with standardized vehicleDetails and authenticated customerId
    let newBooking;
    try {
      newBooking = await addBooking({
      customerId: currentUser?.id,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      customerName,
      customerPhone,
      customerEmail,
      vehicleDetails: {
        type: vehicleType,
        make: vehicleMake,
        model: vehicleModel,
        year: Number(vehicleYear) || 2022,
        registrationNo: vehicleReg.toUpperCase()
      },
      appointmentDate: selectedDate,
      appointmentTime: selectedTime,
      locationType,
      customerLocation: locationType === 'customer_location' ? customerLocationAddress : undefined,
      notes,
      customOptions: {
        material,
        color,
        pattern
      },
      estimatedPrice: serviceCost,
      depositAmount: depositAmount,
      depositPaid: false,
      paymentMethod: 'mpesa',
      status: 'pending',
      privacyAccepted: true,
      termsAccepted: true,
      privacyAcceptedAt: new Date().toISOString(),
      termsAcceptedAt: new Date().toISOString(),
      });
    } catch (error) {
      addToast('error', 'Booking not saved', error instanceof Error ? error.message : 'Please try again.');
      return;
    }

    setBookingWizardDraft(null);
    setConfirmedBookingId(newBooking.id);

    // 2. Trigger M-Pesa STK push prompt
    openMpesaPayment({
      bookingId: newBooking.id,
      amount: depositAmount,
      phone: customerPhone,
      onSuccess: (receiptCode) => {
        setCurrentStep(5);
        try {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.5 },
            colors: ['#073B32', '#D6A62E', '#25D366', '#F5F1E8']
          });
        } catch {}
      }
    });
  };

  const handleCompleteBookingPayLater = async () => {
    if (!policyConsent) {
      addToast('warning', 'Confirm the booking terms', 'Please accept the Privacy Policy and Terms of Service before submitting your booking.');
      return;
    }
    if (!currentUser) {
      setBookingWizardDraft({
        vehicleType, preferredDate: selectedDate, preferredTime: selectedTime, locationType,
        material, color, pattern, vehicleMake, vehicleModel, vehicleYear, vehicleReg,
        customerName, customerPhone, customerEmail, notes, customerLocationAddress,
      });
      addToast('info', 'Sign in to continue', 'Please sign in before submitting a booking so we can securely save it to your account.');
      openAuth('customer', 'booking');
      return;
    }
    let newBooking;
    try {
      newBooking = await addBooking({
      customerId: currentUser?.id,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      customerName,
      customerPhone,
      customerEmail,
      vehicleDetails: {
        type: vehicleType,
        make: vehicleMake,
        model: vehicleModel,
        year: Number(vehicleYear) || 2022,
        registrationNo: vehicleReg.toUpperCase()
      },
      appointmentDate: selectedDate,
      appointmentTime: selectedTime,
      locationType,
      customerLocation: locationType === 'customer_location' ? customerLocationAddress : undefined,
      notes,
      customOptions: {
        material,
        color,
        pattern
      },
      estimatedPrice: serviceCost,
      depositAmount: depositAmount,
      depositPaid: false,
      paymentMethod: 'cash_at_workshop',
      status: 'pending',
      privacyAccepted: true,
      termsAccepted: true,
      privacyAcceptedAt: new Date().toISOString(),
      termsAcceptedAt: new Date().toISOString(),
      });
    } catch (error) {
      addToast('error', 'Booking not saved', error instanceof Error ? error.message : 'Please try again.');
      return;
    }

    setBookingWizardDraft(null);
    setConfirmedBookingId(newBooking.id);
    setCurrentStep(5);
  };

  const handleShareWhatsApp = () => {
    const text = `Hello Rolling Razors Customs! I have just booked service *${selectedService.name}* for my *${vehicleMake} ${vehicleModel} (${vehicleReg})* under Booking ID *${confirmedBookingId}*. Date: ${selectedDate} at ${selectedTime}.`;
    window.open(`https://wa.me/254712345678?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div id="booking-wizard-page" className="min-h-screen pt-28 pb-20 bg-[#073B32] text-[#F5F1E8] relative">
      {/* Background Texture */}
      <div className="absolute inset-0 bg-leather-texture opacity-5 pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Header */}
        <div className="text-center mb-8 space-y-2">
          <button
            id="wizard-back-to-home-btn"
            onClick={() => setView('website')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D6A62E] hover:underline mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Rolling Razors Home
          </button>
          
          <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-[#F5F1E8]">
            {currentStep === 5 ? 'Booking Confirmed!' : 'Book Your Custom Craftsmanship'}
          </h1>
          <p className="text-xs sm:text-sm text-[#F5F1E8]/75">
            Fast, transparent, premium scheduling with Kenyan master upholsterers.
          </p>
        </div>

        {!currentUser && (
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-[#D6A62E]/35 bg-[#0B4035]/80 p-4 text-left shadow-lg sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[.12em] text-[#D6A62E]">Your booking is not submitted yet</p>
              <p className="mt-1 text-xs leading-5 text-[#F5F1E8]/70">Complete your vehicle details first, then sign in securely before we save the appointment to your account.</p>
            </div>
            <button type="button" onClick={() => openAuth('customer', 'booking')} className="rr-button-outline h-11 shrink-0 px-4 text-[11px]">
              SIGN IN NOW <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Progress Bar (Steps 1 to 4) */}
        {currentStep < 5 && (
          <div className="rr-md-card mb-10 p-4 border-[#D6A62E]/30 shadow-lg">
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className={`space-y-1 ${currentStep >= 1 ? 'text-[#D6A62E] font-bold' : 'text-white/40'}`}>
                <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center font-black ${currentStep >= 1 ? 'bg-[#D6A62E] text-[#073B32]' : 'bg-white/10 text-white'}`}>
                  1
                </div>
                <span className="hidden sm:block text-[11px]">Choose Service</span>
              </div>

              <div className={`space-y-1 ${currentStep >= 2 ? 'text-[#D6A62E] font-bold' : 'text-white/40'}`}>
                <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center font-black ${currentStep >= 2 ? 'bg-[#D6A62E] text-[#073B32]' : 'bg-white/10 text-white'}`}>
                  2
                </div>
                <span className="hidden sm:block text-[11px]">Vehicle & Style</span>
              </div>

              <div className={`space-y-1 ${currentStep >= 3 ? 'text-[#D6A62E] font-bold' : 'text-white/40'}`}>
                <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center font-black ${currentStep >= 3 ? 'bg-[#D6A62E] text-[#073B32]' : 'bg-white/10 text-white'}`}>
                  3
                </div>
                <span className="hidden sm:block text-[11px]">Date & Contact</span>
              </div>

              <div className={`space-y-1 ${currentStep >= 4 ? 'text-[#D6A62E] font-bold' : 'text-white/40'}`}>
                <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center font-black ${currentStep >= 4 ? 'bg-[#D6A62E] text-[#073B32]' : 'bg-white/10 text-white'}`}>
                  4
                </div>
                <span className="hidden sm:block text-[11px]">Deposit & Pay</span>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Main Card Container */}
        <div className="rr-md-card border-2 border-[#D6A62E]/30 p-6 sm:p-8 shadow-2xl">
          
          {/* ================= STEP 1: SELECT SERVICE ================= */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-white/10 pb-4">
                <h3 className="text-xl font-bold text-[#F5F1E8] font-display">Select Your Service</h3>
                <p className="text-xs text-white/70">Pick the specialization that matches your vehicle or custom canvas project.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[520px] overflow-y-auto pr-1">
                {services.map(srv => {
                  const isSelected = selectedServiceId === srv.id;
                  return (
                    <div
                      key={srv.id}
                      id={`wizard-service-option-${srv.id}`}
                      onClick={() => setSelectedServiceId(srv.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex gap-3.5 ${
                        isSelected
                          ? 'bg-[#073B32] border-[#D6A62E] ring-2 ring-[#D6A62E] shadow-xl'
                          : 'bg-[#073B32]/60 border-white/10 hover:border-[#D6A62E]/50'
                      }`}
                    >
                      <img
                        src={srv.image}
                        alt={srv.name}
                        className="w-20 h-20 rounded-xl object-cover shrink-0 border border-white/10"
                      />
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-sm text-[#F5F1E8]">{srv.name}</h4>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-[#D6A62E]" />}
                          </div>
                          <p className="text-[11px] text-white/70 line-clamp-2 mt-1 leading-snug">
                            {srv.shortDesc}
                          </p>
                        </div>
                        <div className="flex items-center justify-between pt-2 text-xs">
                          <span className="text-[#D6A62E] font-bold">KES {srv.startingPrice.toLocaleString()}</span>
                          <span className="text-[10px] text-white/50">{srv.estimatedDuration}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end">
                <button
                  id="wizard-step-1-next-btn"
                  onClick={handleNext}
                  className="py-3 px-6 rounded-xl bg-[#D6A62E] hover:bg-[#c39626] text-[#073B32] font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer"
                >
                  <span>Continue to Vehicle Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 2: VEHICLE & CUSTOMIZATION ================= */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-white/10 pb-4">
                <h3 className="text-xl font-bold text-[#F5F1E8] font-display">Vehicle & Customization Specs</h3>
                <p className="text-xs text-white/70">Tell us what you drive and how you want your upholstery styled.</p>
              </div>

              {/* Vehicle Type Selection */}
              <div>
                <label className="block text-xs font-bold text-[#D6A62E] uppercase mb-1.5">Vehicle Category</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {vehicleTypes.map(vt => (
                    <button
                      key={vt}
                      type="button"
                      onClick={() => setVehicleType(vt)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                        vehicleType === vt
                          ? 'bg-[#D6A62E] text-[#073B32] border-[#D6A62E]'
                          : 'bg-[#073B32] text-white/80 border-white/10 hover:border-white/30'
                      }`}
                    >
                      {vt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Make, Model, Year, Plate */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#D6A62E] uppercase mb-1.5">Vehicle Make</label>
                  <input
                    id="wizard-vehicle-make"
                    type="text"
                    value={vehicleMake}
                    onChange={(e) => setVehicleMake(e.target.value)}
                    placeholder="e.g. Toyota, Nissan"
                    className="w-full py-2.5 px-3.5 rounded-xl bg-[#073B32] border border-[#D6A62E]/40 text-[#F5F1E8] text-xs font-semibold focus:outline-none focus:border-[#D6A62E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#D6A62E] uppercase mb-1.5">Vehicle Model</label>
                  <input
                    id="wizard-vehicle-model"
                    type="text"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    placeholder="e.g. Prado TX, Axio"
                    className="w-full py-2.5 px-3.5 rounded-xl bg-[#073B32] border border-[#D6A62E]/40 text-[#F5F1E8] text-xs font-semibold focus:outline-none focus:border-[#D6A62E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#D6A62E] uppercase mb-1.5">Model Year</label>
                  <input
                    id="wizard-vehicle-year"
                    type="number"
                    value={vehicleYear}
                    onChange={(e) => setVehicleYear(Number(e.target.value))}
                    placeholder="e.g. 2021"
                    className="w-full py-2.5 px-3.5 rounded-xl bg-[#073B32] border border-[#D6A62E]/40 text-[#F5F1E8] text-xs font-semibold focus:outline-none focus:border-[#D6A62E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#D6A62E] uppercase mb-1.5">Kenyan Number Plate</label>
                  <input
                    id="wizard-vehicle-reg"
                    type="text"
                    value={vehicleReg}
                    onChange={(e) => setVehicleReg(e.target.value.toUpperCase())}
                    placeholder="e.g. KDF 782G"
                    className="w-full py-2.5 px-3.5 rounded-xl bg-[#073B32] border border-[#D6A62E]/40 text-[#F5F1E8] text-xs font-mono font-bold focus:outline-none focus:border-[#D6A62E]"
                  />
                </div>
              </div>

              {/* Material, Color & Stitch Pattern */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-[#D6A62E] uppercase mb-1.5">Material Choice</label>
                  <select
                    id="wizard-material-select"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#073B32] border border-[#D6A62E]/40 text-[#F5F1E8] text-xs font-semibold focus:outline-none"
                  >
                    {materials.map(m => (
                      <option key={m} value={m} className="bg-[#073B32] text-white">{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#D6A62E] uppercase mb-1.5">Color Preference</label>
                  <select
                    id="wizard-color-select"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#073B32] border border-[#D6A62E]/40 text-[#F5F1E8] text-xs font-semibold focus:outline-none"
                  >
                    {colors.map(c => (
                      <option key={c} value={c} className="bg-[#073B32] text-white">{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#D6A62E] uppercase mb-1.5">Stitch Pattern</label>
                  <select
                    id="wizard-pattern-select"
                    value={pattern}
                    onChange={(e) => setPattern(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#073B32] border border-[#D6A62E]/40 text-[#F5F1E8] text-xs font-semibold focus:outline-none"
                  >
                    {patterns.map(p => (
                      <option key={p} value={p} className="bg-[#073B32] text-white">{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block text-xs font-bold text-[#D6A62E] uppercase mb-1.5">Special Instructions / Custom Notes</label>
                <textarea
                  id="wizard-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Please bolster driver thigh support, repair sagging roof headliner, match door cards."
                  className="w-full py-2.5 px-3.5 rounded-xl bg-[#073B32] border border-[#D6A62E]/40 text-[#F5F1E8] text-xs focus:outline-none focus:border-[#D6A62E]"
                />
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-between">
                <button
                  type="button"
                  onClick={handleBack}
                  className="py-3 px-5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  id="wizard-step-2-next-btn"
                  onClick={handleNext}
                  className="py-3 px-6 rounded-xl bg-[#D6A62E] hover:bg-[#c39626] text-[#073B32] font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer"
                >
                  <span>Select Date & Time</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 3: SCHEDULE & CONTACT ================= */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-white/10 pb-4">
                <h3 className="text-xl font-bold text-[#F5F1E8] font-display">Schedule & Contact Information</h3>
                <p className="text-xs text-white/70">Choose your appointment slot and enter contact details. Status updates are available in the Driver Portal and by email.</p>
              </div>

              {/* Location Preference */}
              <div>
                <label className="block text-xs font-bold text-[#D6A62E] uppercase mb-1.5">Service Location</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setLocationType('workshop')}
                    className={`p-3.5 rounded-xl text-left border transition-all ${
                      locationType === 'workshop'
                        ? 'bg-[#073B32] border-[#D6A62E] text-white ring-1 ring-[#D6A62E]'
                        : 'bg-[#073B32]/50 border-white/10 text-white/70'
                    }`}
                  >
                    <div className="font-bold text-xs">Rolling Razors Workshop</div>
                    <div className="text-[11px] text-white/60">Industrial Area / Mombasa Road, Nairobi</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLocationType('customer_location')}
                    className={`p-3.5 rounded-xl text-left border transition-all ${
                      locationType === 'customer_location'
                        ? 'bg-[#073B32] border-[#D6A62E] text-white ring-1 ring-[#D6A62E]'
                        : 'bg-[#073B32]/50 border-white/10 text-white/70'
                    }`}
                  >
                    <div className="font-bold text-xs">Mobile Customer Location</div>
                    <div className="text-[11px] text-white/60">On-site fitting at your home or office</div>
                  </button>
                </div>

                {locationType === 'customer_location' && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={customerLocationAddress}
                      onChange={(e) => setCustomerLocationAddress(e.target.value)}
                      placeholder="Enter your exact estate/location in Nairobi (e.g. Westlands, Kilimani, Karen)"
                      className="w-full py-2.5 px-3.5 rounded-xl bg-[#073B32] border border-[#D6A62E]/40 text-[#F5F1E8] text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Date & Time Slot Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#D6A62E] uppercase mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Appointment Date
                  </label>
                  <input
                    id="wizard-date-input"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-[#073B32] border border-[#D6A62E]/40 text-[#F5F1E8] text-xs font-semibold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#D6A62E] uppercase mb-1.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Time Slot
                  </label>
                  <select
                    id="wizard-time-select"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-[#073B32] border border-[#D6A62E]/40 text-[#F5F1E8] text-xs font-semibold focus:outline-none"
                  >
                    {timeSlots.map(t => (
                      <option key={t} value={t} className="bg-[#073B32] text-white">{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-[#D6A62E] uppercase">Your Contact Information</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-white/70 mb-1">Full Name</label>
                    <input
                      id="wizard-cust-name"
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Brian Mwangi"
                      className="w-full py-2.5 px-3 rounded-xl bg-[#073B32] border border-[#D6A62E]/40 text-[#F5F1E8] text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-white/70 mb-1">Kenyan Phone (Safaricom / Airtel)</label>
                    <input
                      id="wizard-cust-phone"
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="0712 345 678"
                      className="w-full py-2.5 px-3 rounded-xl bg-[#073B32] border border-[#D6A62E]/40 text-[#F5F1E8] text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-white/70 mb-1">Email Address</label>
                    <input
                      id="wizard-cust-email"
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="brian@gmail.com"
                      className="w-full py-2.5 px-3 rounded-xl bg-[#073B32] border border-[#D6A62E]/40 text-[#F5F1E8] text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-between">
                <button
                  type="button"
                  onClick={handleBack}
                  className="py-3 px-5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  id="wizard-step-3-next-btn"
                  onClick={handleNext}
                  className="py-3 px-6 rounded-xl bg-[#D6A62E] hover:bg-[#c39626] text-[#073B32] font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer"
                >
                  <span>Review & Pay Deposit</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 4: SUMMARY & M-PESA DEPOSIT ================= */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-white/10 pb-4">
                <h3 className="text-xl font-bold text-[#F5F1E8] font-display">Booking Summary & Deposit</h3>
                <p className="text-xs text-white/70">Review your customized vehicle work order and authorize deposit via M-Pesa.</p>
              </div>

              {/* Summary Breakdown Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left: Job Specs */}
                <div className="bg-[#073B32] p-5 rounded-2xl border border-white/10 space-y-3">
                  <h4 className="font-bold text-xs text-[#D6A62E] uppercase tracking-wider flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5" /> Vehicle & Service Details
                  </h4>
                  
                  <div className="space-y-2 text-xs divide-y divide-white/5">
                    <div className="flex justify-between pt-1">
                      <span className="text-white/60">Service:</span>
                      <span className="font-bold text-white">{selectedService.name}</span>
                    </div>
                    <div className="flex justify-between pt-2">
                      <span className="text-white/60">Vehicle:</span>
                      <span className="font-bold text-white">{vehicleMake} {vehicleModel}</span>
                    </div>
                    <div className="flex justify-between pt-2">
                      <span className="text-white/60">Number Plate:</span>
                      <span className="font-mono font-bold text-[#D6A62E]">{vehicleReg}</span>
                    </div>
                    <div className="flex justify-between pt-2">
                      <span className="text-white/60">Material:</span>
                      <span className="text-white">{material}</span>
                    </div>
                    <div className="flex justify-between pt-2">
                      <span className="text-white/60">Color & Pattern:</span>
                      <span className="text-white">{color} • {pattern}</span>
                    </div>
                    <div className="flex justify-between pt-2">
                      <span className="text-white/60">Date & Slot:</span>
                      <span className="font-semibold text-white">{selectedDate} ({selectedTime})</span>
                    </div>
                    <div className="flex justify-between pt-2">
                      <span className="text-white/60">Location:</span>
                      <span className="text-white capitalize">{locationType.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Kenyan Financial Quotation & Deposit */}
                <div className="bg-[#052822] p-5 rounded-2xl border border-[#D6A62E]/40 space-y-4 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-[#D6A62E] uppercase tracking-wider flex items-center gap-1.5 mb-3">
                      <FileText className="w-3.5 h-3.5" /> Price Breakdown (KES)
                    </h4>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between text-white/80">
                        <span>Service Estimate</span>
                        <span className="font-semibold text-white">KES {serviceCost.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-white/80">
                        <span>Workshop Booking Fee</span>
                        <span className="text-[#25D366] font-semibold">FREE (Included)</span>
                      </div>
                      <div className="flex justify-between text-base font-black text-[#D6A62E] border-t border-b border-white/10 py-2.5">
                        <span>Deposit Required (35%)</span>
                        <span>KES {depositAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs text-white/60">
                        <span>Remaining Balance on Handover</span>
                        <span>KES {balanceRemaining.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Safaricom Paybill Notice */}
                  <div className="p-3 bg-[#073B32] rounded-xl border border-white/5 text-[11px] text-white/70 space-y-1">
                    <div className="flex items-center gap-1.5 text-[#25D366] font-bold">
                      <Smartphone className="w-3.5 h-3.5" /> Instant Lipa na M-Pesa Online
                    </div>
                    <p>Paybill: <strong>889900</strong> • Automatic payment confirmation</p>
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-[#073B32]/70 p-4 text-xs text-white/75">
                <input
                  type="checkbox"
                  checked={policyConsent}
                  onChange={(event) => setPolicyConsent(event.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#D6A62E]"
                />
                <span>
                  I agree to the <button type="button" onClick={() => openLegalModal('terms')} className="font-bold text-[#D6A62E] underline">Terms of Service</button> and acknowledge the <button type="button" onClick={() => openLegalModal('privacy')} className="font-bold text-[#D6A62E] underline">Privacy Policy</button>. My details will be used to schedule and manage this booking.
                </span>
              </label>
              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-full sm:w-auto py-3 px-5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleCompleteBookingPayLater}
                    className="py-3.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
                  >
                    Pay Deposit at Workshop
                  </button>

                  <button
                    id="wizard-pay-mpesa-deposit-btn"
                    type="button"
                    onClick={handleCompleteBookingWithMpesa}
                    className="py-3.5 px-6 rounded-xl bg-[#D6A62E] hover:bg-[#c39626] text-[#073B32] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Pay Deposit with M-Pesa (KES {depositAmount.toLocaleString()})</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 5: SUCCESS CONFIRMATION ================= */}
          {currentStep === 5 && (
            <div className="text-center py-8 space-y-6 animate-in zoom-in-95 duration-300">
              
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto shadow-2xl">
                <CheckCircle2 className="w-12 h-12" />
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <span className="text-xs font-bold text-[#D6A62E] uppercase tracking-widest">
                  APPOINTMENT CONFIRMED
                </span>
                <h3 className="text-3xl font-black text-white font-display">
                  We’re Ready for Your Ride!
                </h3>
                <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                  Your appointment is logged in the Rolling Razors workshop system. Our master upholsterers will have materials and tools prepped.
                </p>
              </div>

              {/* Confirmation Card */}
              <div className="max-w-md mx-auto bg-[#073B32] border-2 border-[#D6A62E]/40 rounded-2xl p-6 text-left space-y-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <span className="text-[10px] text-white/50 uppercase">Booking Reference</span>
                    <h4 className="font-mono font-black text-lg text-[#D6A62E]">{confirmedBookingId}</h4>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40">
                    Confirmed
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-white/80">
                  <div className="flex justify-between">
                    <span className="text-white/50">Service:</span>
                    <span className="font-bold text-white">{selectedService.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Vehicle:</span>
                    <span className="font-bold text-white">{vehicleMake} {vehicleModel} ({vehicleReg})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Scheduled:</span>
                    <span className="font-bold text-[#D6A62E]">{selectedDate} @ {selectedTime}</span>
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 max-w-md mx-auto">
                <button
                  id="wizard-share-whatsapp-btn"
                  onClick={handleShareWhatsApp}
                  className="w-full sm:w-auto py-3 px-5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg"
                >
                  <MessageCircle className="w-4 h-4" /> Share on WhatsApp
                </button>

                <button
                  id="wizard-go-driver-portal-btn"
                  onClick={() => {
                    setCustomerTab('bookings');
                    setView('customer_dashboard');
                  }}
                  className="w-full sm:w-auto py-3 px-5 rounded-xl bg-[#D6A62E] hover:bg-[#c39626] text-[#073B32] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
                >
                  <Car className="w-4 h-4" /> View in Driver Portal
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
