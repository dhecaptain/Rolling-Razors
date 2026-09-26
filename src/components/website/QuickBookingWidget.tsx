import React, { useState } from 'react';
import { isStaff, useApp } from '../../context/AppContext';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Car, 
  Sparkles, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { VehicleType } from '../../types';

export const QuickBookingWidget: React.FC = () => {
  const { services, currentUser, setView, setBookingWizardInitialServiceId, setBookingWizardDraft } = useApp();
  if (currentUser && isStaff(currentUser.role)) return null;

  const [serviceId, setServiceId] = useState<string>(services[0]?.id || 'srv-1');
  const [vehicleType, setVehicleType] = useState<VehicleType>('Car');
  
  // Set default preferred date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [preferredDate, setPreferredDate] = useState<string>(defaultDateStr);
  const [preferredTime, setPreferredTime] = useState<string>('10:00 AM - 12:00 PM');
  const [locationType, setLocationType] = useState<'workshop' | 'customer_location'>('workshop');

  const vehicleOptions: VehicleType[] = ['Car', 'SUV', 'Van', 'Truck', 'Matatu', 'Other'];

  const timeSlots = [
    '8:00 AM - 10:00 AM',
    '10:00 AM - 12:00 PM',
    '1:00 PM - 3:00 PM',
    '3:00 PM - 5:00 PM'
  ];

  const handleCheckAvailability = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingWizardInitialServiceId(serviceId);
    setBookingWizardDraft({ vehicleType, preferredDate, preferredTime, locationType });
    setView('booking');
  };

  const selectedService = services.find(s => s.id === serviceId);

  return (
    <div 
      id="quick-booking-card"
      className="bg-panel border-2 border-gold rounded-2xl p-6 sm:p-7 shadow-2xl backdrop-blur-md text-cream relative overflow-hidden"
    >
      {/* Subtle Corner Accent */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gold rounded-bl-full pointer-events-none" />

      {/* Card Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
        <div>
          <h3 className="text-xl font-black text-cream font-display flex items-center gap-2">
            <span>Book Your Service</span>
            <span className="w-2 h-2 rounded-full bg-whatsapp animate-pulse" />
          </h3>
          <p className="text-xs text-gold mt-0.5">Instant scheduling with Kenyan master craftsmen</p>
        </div>
        <div className="hidden sm:block text-right">
          <span className="text-[10px] text-white/50 block">EST. DEPOSIT</span>
          <span className="text-xs font-bold text-gold">M-Pesa Supported</span>
        </div>
      </div>

      <form onSubmit={handleCheckAvailability} className="space-y-4">
        {/* 1. Service Selection */}
        <div>
          <label className="block text-xs font-bold text-gold mb-1.5 uppercase tracking-wider">
            Select Service
          </label>
          <div className="relative">
            <select
              id="quick-booking-service-select"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full py-2.5 px-3.5 rounded-xl bg-ink border border-gold text-cream text-xs font-semibold focus:outline-none focus:border-gold cursor-pointer appearance-none"
            >
              {services.map(srv => (
                <option key={srv.id} value={srv.id} className="bg-ink text-white">
                  {srv.name} (from KES {srv.startingPrice.toLocaleString()})
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gold">
              ▼
            </div>
          </div>
        </div>

        {/* 2. Vehicle Type Selection Chips */}
        <div>
          <label className="block text-xs font-bold text-gold mb-1.5 uppercase tracking-wider">
            Vehicle Type
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {vehicleOptions.map(vt => (
              <button
                key={vt}
                type="button"
                id={`vehicle-type-pill-${vt.toLowerCase()}`}
                onClick={() => setVehicleType(vt)}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center border ${
                  vehicleType === vt 
                    ? 'bg-gold text-ink border-gold shadow-sm' 
                    : 'bg-ink text-cream border-white/10 hover:border-gold'
                }`}
              >
                {vt}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Preferred Date & Preferred Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gold mb-1.5 uppercase tracking-wider flex items-center gap-1">
              <CalendarIcon className="w-3 h-3 text-gold" /> Preferred Date
            </label>
            <input
              id="quick-booking-date-input"
              type="date"
              value={preferredDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setPreferredDate(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl bg-ink border border-gold text-cream text-xs font-semibold focus:outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gold mb-1.5 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3 text-gold" /> Preferred Time
            </label>
            <select
              id="quick-booking-time-select"
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl bg-ink border border-gold text-cream text-xs font-semibold focus:outline-none focus:border-gold cursor-pointer"
            >
              {timeSlots.map(time => (
                <option key={time} value={time} className="bg-ink text-white">
                  {time}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4. Location Choice */}
        <div>
          <label className="block text-xs font-bold text-gold mb-1.5 uppercase tracking-wider flex items-center gap-1">
            <MapPin className="w-3 h-3 text-gold" /> Service Location
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              id="loc-type-workshop-btn"
              onClick={() => setLocationType('workshop')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-left border flex items-center gap-2 ${
                locationType === 'workshop'
                  ? 'bg-ink border-gold text-white ring-1 ring-gold'
                  : 'bg-ink border-white/10 text-white/70 hover:bg-ink'
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${locationType === 'workshop' ? 'border-gold' : 'border-white/30'}`}>
                {locationType === 'workshop' && <div className="w-1.5 h-1.5 rounded-full bg-gold" />}
              </div>
              <div>
                <span className="block leading-tight">Rolling Razors Workshop</span>
                <span className="text-[10px] text-white/50 font-normal">Narok Workshop</span>
              </div>
            </button>

            <button
              type="button"
              id="loc-type-customer-btn"
              onClick={() => setLocationType('customer_location')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-left border flex items-center gap-2 ${
                locationType === 'customer_location'
                  ? 'bg-ink border-gold text-white ring-1 ring-gold'
                  : 'bg-ink border-white/10 text-white/70 hover:bg-ink'
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${locationType === 'customer_location' ? 'border-gold' : 'border-white/30'}`}>
                {locationType === 'customer_location' && <div className="w-1.5 h-1.5 rounded-full bg-gold" />}
              </div>
              <div>
                <span className="block leading-tight">Customer Location</span>
                <span className="text-[10px] text-white/50 font-normal">On-site / Mobile Fit</span>
              </div>
            </button>
          </div>
        </div>

        {/* Selected Service Price Estimate Banner */}
        {selectedService && (
          <div className="bg-ink-deep p-3 rounded-xl border border-emerald-800/40 flex items-center justify-between text-xs">
            <span className="text-white/80">Starting estimate:</span>
            <span className="font-bold text-gold text-sm">
              KES {selectedService.startingPrice.toLocaleString()}
            </span>
          </div>
        )}

        {/* Submit Button */}
        <button
          id="check-availability-submit-btn"
          type="submit"
          className="w-full py-3.5 px-4 rounded-xl bg-gold hover:bg-gold-hover text-ink font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all transform active:scale-95 cursor-pointer mt-2"
        >
          <span>Check Availability & Proceed</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-[11px] text-center text-white/60 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-whatsapp" /> Free cancellation up to 24 hours before appointment
        </p>
      </form>
    </div>
  );
};
