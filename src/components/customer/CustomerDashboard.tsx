import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Car, 
  Calendar, 
  Clock, 
  CreditCard, 
  Smartphone, 
  ShieldCheck, 
  User, 
  Plus, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  FileText, 
  Layers, 
  Scissors, 
  Phone,
  Trash2,
  Edit,
  X,
  Camera,
  Image as ImageIcon,
  ArrowUpRight,
  LogOut,
  LayoutDashboard
} from 'lucide-react';
import { Booking, Vehicle } from '../../types';
import { phoneKey, phonesMatch } from '../../utils/phone';

export const CustomerDashboard: React.FC = () => {
  const { 
    currentUser, 
    customerTab, 
    setCustomerTab, 
    bookings, 
    vehicles, 
    addVehicle, 
    deleteVehicle,
    updateProfile,
    workOrders, 
    openMpesaPayment, 
    openPaystackPayment,
    setView,
    openAuth,
    setBookingWizardInitialServiceId,
    logout,
    addToast
  } = useApp();

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [inspectedImage, setInspectedImage] = useState<string | null>(null);
  const [showAddVehicleModal, setShowAddVehicleModal] = useState<boolean>(false);
  const [vehicleToRemove, setVehicleToRemove] = useState<Vehicle | null>(null);
  
  // New vehicle form state
  const [newMake, setNewMake] = useState('Toyota');
  const [newModel, setNewModel] = useState('Harrier');
  const [newYear, setNewYear] = useState(2021);
  const [newReg, setNewReg] = useState('KDM 102P');
  const [newType, setNewType] = useState<'Car' | 'SUV' | 'Van' | 'Truck' | 'Matatu' | 'Other'>('SUV');
  const [newColor, setNewColor] = useState('Pearl White');
  const [profileName, setProfileName] = useState(currentUser.name);
  const [profilePhone, setProfilePhone] = useState(currentUser.phone);
  const [profileEmail, setProfileEmail] = useState(currentUser.email);
  const [profileLocation, setProfileLocation] = useState(currentUser.location || 'Nairobi, Kenya');

  // If user is somehow not logged in, show auth gate
  if (!currentUser) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex items-center justify-center bg-ink text-cream px-4">
        <div className="max-w-md w-full bg-panel border border-gold rounded-3xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-gold border border-gold text-gold flex items-center justify-center mx-auto">
            <User className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-white">Driver Authentication Required</h2>
          <p className="text-xs text-white/70">
            Please log in with your Kenyan phone number to view and manage your booked vehicles, stitching progress, and invoices.
          </p>
          <button
            onClick={() => openAuth('customer')}
            className="w-full py-3 rounded-xl bg-gold text-ink font-black text-xs uppercase tracking-wider shadow-lg"
          >
            Sign In to Driver Portal
          </button>
        </div>
      </div>
    );
  }

  const myBookings = [...bookings.filter(b => 
    b.customerId === currentUser.id ||
    (currentUser.phone && b.customerPhone && phonesMatch(b.customerPhone, currentUser.phone)) ||
    (currentUser.email && b.customerEmail && b.customerEmail.toLowerCase() === currentUser.email.toLowerCase())
  )].sort((a,b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime());

  const myVehicles = vehicles.filter(v => v.customerId === currentUser.id);

  const activeBookings = myBookings.filter(b => ['pending','confirmed','checked_in','in_progress','quality_check','ready'].includes(b.status));
  const completedBookings = myBookings.filter(b => b.status === 'completed');
  const latestActiveBooking = [...activeBookings].sort((a,b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime())[0] || null;
  const activeWorkOrder = latestActiveBooking ? workOrders.find(wo => wo.bookingId === latestActiveBooking.id) : null;

  // Dynamic driver loyalty tier based on actual completed jobs
  const completedCount = completedBookings.length;
  const loyaltyTier = completedCount >= 5 
    ? { name: 'VIP Master Driver', badgeClass: 'bg-gold text-ink' }
    : completedCount >= 3
      ? { name: 'Gold Club Driver', badgeClass: 'border border-gold text-gold bg-transparent' }
      : completedCount >= 1
        ? { name: 'Regular Driver', badgeClass: 'bg-mpesa/20 text-mpesa border border-mpesa/40' }
        : { name: 'New Driver', badgeClass: 'bg-white/10 text-white/80 border border-white/20' };

  const handleCreateVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMake || !newModel || !newReg) {
      addToast('error', 'Missing Information', 'Please provide make, model, and registration number.');
      return;
    }

    addVehicle({
      customerId: currentUser.id,
      make: newMake,
      model: newModel,
      year: newYear,
      registrationNo: newReg.toUpperCase(),
      type: newType,
      color: newColor,
      upholsteryHistory: ['Initial Factory Seats']
    });

    setShowAddVehicleModal(false);
  };

  const handlePayBookingDeposit = (booking: Booking) => {
    openPaystackPayment({
      bookingId: booking.id,
      amount: booking.depositAmount,
      email: booking.customerEmail,
      onSuccess: () => {
        setSelectedBooking(null);
      }
    });
  };

  const getStatusBadge = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed': return <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold">Confirmed</span>;
      case 'pending': return <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-bold">Pending Deposit</span>;
      case 'checked_in': return <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40 text-xs font-bold">Checked In</span>;
      case 'in_progress': return <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 text-xs font-bold">Work in progress</span>;
      case 'quality_check': return <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/40 text-xs font-bold">Quality Check</span>;
      case 'ready': return <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 text-xs font-bold">Ready for Pickup</span>;
      case 'completed': return <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40 text-xs font-bold">Completed</span>;
      case 'cancelled': return <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 text-xs font-bold">Cancelled</span>;
      default: return <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/70 border border-white/20 text-xs font-bold">{String(status)}</span>;
    }
  };

  const driverNavigation = [
    { id: 'dashboard' as const, label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'bookings' as const, label: 'My bookings', icon: <Calendar className="h-4 w-4" />, count: myBookings.length },
    { id: 'vehicles' as const, label: 'My garage', icon: <Car className="h-4 w-4" />, count: myVehicles.length },
    { id: 'profile' as const, label: 'Profile & payments', icon: <User className="h-4 w-4" /> },
  ];
  const pageTitle = driverNavigation.find((item) => item.id === customerTab)?.label || 'Overview';
  const changeTab = (tab: typeof customerTab) => setCustomerTab(tab);

  return (
    <div id="customer-portal-container" className="min-h-screen bg-ink text-cream">
      <div className="min-h-screen lg:grid lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-screen flex-col border-r border-white/10 bg-ink-deep px-4 py-6 lg:flex">
          <div className="mb-8 flex items-center gap-3 px-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-gold/40 bg-gold/10 text-gold"><Scissors className="h-5 w-5" /></span>
            <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-gold">Rolling Razors</p><p className="mt-0.5 text-sm font-bold text-cream">Driver garage</p></div>
          </div>
          <nav aria-label="Driver dashboard" className="flex-1 space-y-6">
            <div>
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-white/40">My account</p>
              <div className="space-y-1">
                {driverNavigation.map((item) => (
                  <button key={item.id} type="button" onClick={() => changeTab(item.id)} aria-current={customerTab === item.id ? 'page' : undefined} className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[13px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold ${customerTab === item.id ? 'bg-gold text-ink shadow-lg shadow-black/20' : 'text-cream-muted hover:bg-white/5 hover:text-cream'}`}>
                    {item.icon}<span className="flex-1">{item.label}</span>
                    {'count' in item && <span className={`min-w-6 rounded-full px-1.5 py-0.5 text-center text-[10px] ${customerTab === item.id ? 'bg-ink/10 text-ink' : 'bg-white/5 text-white/60'}`}>{item.count}</span>}
                  </button>
                ))}
              </div>
            </div>
          </nav>
          <div className="mt-6 space-y-2 border-t border-white/10 pt-4">
            <button type="button" onClick={() => setView('website')} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-xs font-semibold text-cream-muted transition-colors hover:bg-white/5 hover:text-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold"><ArrowUpRight className="h-4 w-4" />View website</button>
            <button type="button" onClick={logout} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-xs font-semibold text-cream-muted transition-colors hover:bg-rose-500/10 hover:text-rose-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold"><LogOut className="h-4 w-4" />Sign out</button>
          </div>
        </aside>

        <div className="min-w-0">
          <nav aria-label="Driver account sections" className="sticky top-0 z-30 flex gap-1 overflow-x-auto border-b border-white/10 bg-ink-deep/95 px-3 py-2 backdrop-blur-xl lg:hidden">
            {driverNavigation.map((item) => (
              <button key={item.id} type="button" onClick={() => changeTab(item.id)} aria-current={customerTab === item.id ? 'page' : undefined} className={`flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-xs font-semibold ${customerTab === item.id ? 'bg-gold text-ink' : 'text-cream-muted hover:bg-white/5 hover:text-cream'}`}>
                {item.icon}<span>{item.label}</span>{'count' in item && <span className="opacity-70">{item.count}</span>}
              </button>
            ))}
            <span className="my-1 w-px shrink-0 bg-white/10" aria-hidden="true" />
            <button type="button" onClick={() => setView('website')} className="flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-cream-muted hover:bg-white/5 hover:text-cream"><ArrowUpRight className="h-4 w-4" /><span>Website</span></button>
            <button type="button" onClick={logout} className="flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-cream-muted hover:bg-rose-500/10 hover:text-rose-200"><LogOut className="h-4 w-4" /><span>Sign out</span></button>
          </nav>
          <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-9 lg:py-9">
            <header className="mb-7 flex flex-col justify-between gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.2em] text-gold">Driver garage / Kenya</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <h1 className="font-display text-3xl font-black tracking-tight text-white sm:text-4xl">{pageTitle}</h1>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${loyaltyTier.badgeClass}`}>{loyaltyTier.name}</span>
                </div>
                <p className="mt-2 text-sm text-cream-muted">Karibu, {currentUser.name}. Track your bookings, vehicles, and workshop progress.</p>
              </div>
              <button id="driver-portal-book-new-btn" onClick={() => { setBookingWizardInitialServiceId(null); setView('booking'); }} className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-gold px-5 text-xs font-black uppercase tracking-wider text-ink shadow-lg transition-colors hover:bg-gold-hover sm:self-auto">
                <Plus className="h-4 w-4" /> Book a fitting
              </button>
            </header>
            <div className="space-y-8">
        {/* ================= TAB 1: OVERVIEW ================= */}
        {customerTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in">
            
            {/* Stat Counters */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-panel border border-gold space-y-1">
                <span className="text-[11px] text-white/60 block uppercase font-bold">Active Bookings</span>
                <span className="text-3xl font-black text-gold">{activeBookings.length}</span>
              </div>
              <div className="p-5 rounded-2xl bg-panel border border-gold space-y-1">
                <span className="text-[11px] text-white/60 block uppercase font-bold">Garage Vehicles</span>
                <span className="text-3xl font-black text-white">{myVehicles.length}</span>
              </div>
              <div className="p-5 rounded-2xl bg-panel border border-gold space-y-1">
                <span className="text-[11px] text-white/60 block uppercase font-bold">Completed Jobs</span>
                <span className="text-3xl font-black text-emerald-400">{completedBookings.length}</span>
              </div>
              <div className="p-5 rounded-2xl bg-panel border border-gold space-y-1">
                <span className="text-[11px] text-white/60 block uppercase font-bold">Craftsmanship Warranty</span>
                <span className="text-base font-black text-whatsapp flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" /> 100% Active
                </span>
              </div>
            </div>

            {/* Live Workshop Progress Tracker (If active work order exists) */}
            {latestActiveBooking ? (
              <div className="p-6 sm:p-8 rounded-3xl bg-panel border-2 border-gold shadow-2xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
                  <div>
                    <span className="text-xs font-bold text-gold uppercase tracking-wider flex items-center gap-1.5">
                      <Scissors className="w-3.5 h-3.5" /> YOUR JOB’S PROGRESS
                    </span>
                    <h3 className="text-xl font-black text-white font-display mt-0.5">
                      {latestActiveBooking.vehicleDetails?.make} {latestActiveBooking.vehicleDetails?.model} ({latestActiveBooking.vehicleDetails?.registrationNo})
                    </h3>
                    <p className="text-xs text-white/70">
                      {latestActiveBooking.serviceName} · Upholsterer: {latestActiveBooking.assignedStaffName || 'Workshop team'}
                    </p>
                  </div>
                  <div className="text-right">
                      <span className="inline-flex rounded-full border border-gold/40 bg-ink px-3 py-1 text-xs font-bold text-cream">
                      {activeWorkOrder?.stage ? activeWorkOrder.stage.replace(/_/g, ' ').toLowerCase() : latestActiveBooking.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Multi-step Status Timeline Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                  {[
                    { stage: '1. Booked', done: true, current: latestActiveBooking.status === 'pending' },
                    { stage: '2. Deposit Settled', done: Boolean(latestActiveBooking.depositPaid), current: latestActiveBooking.status === 'confirmed' },
                    { stage: '3. Vehicle Received', done: activeWorkOrder?.stage === 'VEHICLE_RECEIVED' || activeWorkOrder?.stage === 'MATERIALS_PREPARED' || activeWorkOrder?.stage === 'IN_PROGRESS' || activeWorkOrder?.stage === 'QUALITY_CHECK' || activeWorkOrder?.stage === 'READY_FOR_COLLECTION' || activeWorkOrder?.stage === 'COLLECTED', current: latestActiveBooking.status === 'checked_in' },
                    { stage: '4. Stitching & Tailoring', done: activeWorkOrder?.stage === 'QUALITY_CHECK' || activeWorkOrder?.stage === 'READY_FOR_COLLECTION' || activeWorkOrder?.stage === 'COLLECTED', current: latestActiveBooking.status === 'in_progress' },
                    { stage: '5. Ready for Pickup', done: activeWorkOrder?.stage === 'COLLECTED' || latestActiveBooking.status === 'completed', current: latestActiveBooking.status === 'ready' },
                  ].map((st, i) => (
                    <div key={i} className="space-y-2">
                      <div className={`h-2 rounded-full ${
                        st.done 
                          ? 'bg-whatsapp' 
                          : st.current 
                          ? 'bg-gold motion-safe:animate-pulse'
                            : 'bg-white/10'
                      }`} />
                      <div className="flex items-center gap-1 text-[11px]">
                        {st.done && <CheckCircle2 className="w-3 h-3 text-whatsapp" />}
                        {st.current && <span className="w-2 h-2 rounded-full bg-gold motion-safe:animate-ping" />}
                        <span className={`font-semibold ${st.current ? 'text-gold' : st.done ? 'text-white' : 'text-white/40'}`}>
                          {st.stage}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Workshop Inspection & Proof Photos */}
                {((activeWorkOrder?.beforePhotos && activeWorkOrder.beforePhotos.length > 0) ||
                  (activeWorkOrder?.progressPhotos && activeWorkOrder.progressPhotos.length > 0) ||
                  (activeWorkOrder?.afterPhotos && activeWorkOrder.afterPhotos.length > 0) ||
                  (latestActiveBooking.referencePhotos && latestActiveBooking.referencePhotos.length > 0)) && (
                  <div className="pt-4 mt-2 border-t border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-gold uppercase tracking-wider flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5" /> Workshop Inspection & Craftsmanship Photos
                      </h4>
                      <span className="text-[11px] text-white/50">Click photo to zoom</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {latestActiveBooking.referencePhotos?.map((url, i) => (
                        <div
                          key={`ref-${i}`}
                          onClick={() => setInspectedImage(url)}
                          className="group relative aspect-video rounded-xl overflow-hidden bg-ink border border-gold cursor-pointer hover:border-gold transition-all"
                        >
                          <img src={url} alt="Inspiration reference" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-bold text-amber-300">
                            Client Request
                          </span>
                        </div>
                      ))}

                      {activeWorkOrder?.beforePhotos?.map((url, i) => (
                        <div
                          key={`before-${i}`}
                          onClick={() => setInspectedImage(url)}
                          className="group relative aspect-video rounded-xl overflow-hidden bg-ink border border-blue-400/30 cursor-pointer hover:border-blue-400 transition-all"
                        >
                          <img src={url} alt="Bay intake photo" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-bold text-blue-300">
                            Bay Intake
                          </span>
                        </div>
                      ))}

                      {activeWorkOrder?.progressPhotos?.map((url, i) => (
                        <div
                          key={`prog-${i}`}
                          onClick={() => setInspectedImage(url)}
                          className="group relative aspect-video rounded-xl overflow-hidden bg-ink border border-gold cursor-pointer hover:border-gold transition-all"
                        >
                          <img src={url} alt="Bench stitching photo" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-bold text-gold">
                            Bench Crafting
                          </span>
                        </div>
                      ))}

                      {activeWorkOrder?.afterPhotos?.map((url, i) => (
                        <div
                          key={`after-${i}`}
                          onClick={() => setInspectedImage(url)}
                          className="group relative aspect-video rounded-xl overflow-hidden bg-ink border border-emerald-400/40 cursor-pointer hover:border-emerald-400 transition-all"
                        >
                          <img src={url} alt="Finished inspection photo" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-bold text-emerald-300">
                            Quality Approved
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 rounded-3xl bg-panel border border-gold flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold border border-gold flex items-center justify-center text-gold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">No Active Workshop Jobs in Progress</h4>
                    <p className="text-xs text-white/60">Schedule an upholstery upgrade, custom seat refit, or car shade canopy anytime.</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setBookingWizardInitialServiceId(null);
                    setView('booking');
                  }}
                  className="py-2.5 px-4 rounded-xl bg-gold text-ink font-black text-xs uppercase tracking-wider whitespace-nowrap shadow"
                >
                  Book New Service
                </button>
              </div>
            )}

            {/* Upcoming Appointments */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white font-display">Active & Upcoming Appointments</h3>
                <button
                  onClick={() => setCustomerTab('bookings')}
                  className="text-xs text-gold font-bold hover:underline"
                >
                  View All ({myBookings.length})
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeBookings.slice(0, 2).map((booking) => (
                  <div 
                    key={booking.id}
                    className="p-5 rounded-2xl bg-panel border border-gold shadow-lg space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-gold font-bold">{booking.id}</span>
                        {getStatusBadge(booking.status)}
                      </div>
                      <h4 className="font-bold text-base text-white">{booking.serviceName}</h4>
                      <p className="text-xs text-white/70">
                        {booking.vehicleDetails?.make} {booking.vehicleDetails?.model} • <span className="text-gold font-mono">{booking.vehicleDetails?.registrationNo}</span>
                      </p>
                    </div>

                    <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-white/50 block text-[10px]">APPOINTMENT</span>
                        <span className="font-bold text-white">{booking.appointmentDate} ({booking.appointmentTime})</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {!booking.depositPaid && (
                          <button
                            id={`pay-deposit-btn-${booking.id}`}
                            onClick={() => handlePayBookingDeposit(booking)}
                            className="py-1.5 px-3 rounded-lg bg-mpesa hover:bg-mpesa-dark text-white font-bold text-xs flex items-center gap-1 shadow"
                          >
                            <Smartphone className="w-3 h-3" /> Pay Deposit
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedBooking(booking)}
                          className="py-1.5 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ================= TAB 2: MY BOOKINGS ================= */}
        {customerTab === 'bookings' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white font-display">All Service Bookings</h3>
              <button
                onClick={() => { setBookingWizardInitialServiceId(null); setView('booking'); }}
                className="py-2 px-4 rounded-xl bg-gold text-ink font-black text-xs uppercase tracking-wider flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Book Service
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {myBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="p-5 rounded-2xl bg-panel border border-gold hover:border-gold transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-gold">{booking.id}</span>
                      {getStatusBadge(booking.status)}
                      <span className="text-xs text-white/50">{booking.createdAt}</span>
                    </div>

                    <h4 className="font-bold text-base text-white">{booking.serviceName}</h4>
                    <p className="text-xs text-white/70">
                      Vehicle: <strong>{booking.vehicleDetails?.make} {booking.vehicleDetails?.model}</strong> ({booking.vehicleDetails?.registrationNo}) • Date: <strong>{booking.appointmentDate}</strong> ({booking.appointmentTime})
                    </p>
                  </div>

                  <div className="flex items-center gap-4 justify-between md:justify-end pt-3 md:pt-0 border-t md:border-t-0 border-white/10">
                    <div className="text-right">
                      <span className="text-[10px] text-white/50 block">EST. TOTAL</span>
                      <span className="font-bold text-gold text-sm">KES {booking.estimatedPrice.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!booking.depositPaid && booking.status !== 'cancelled' && (
                        <button
                          onClick={() => handlePayBookingDeposit(booking)}
                          className="py-2 px-3.5 rounded-xl bg-mpesa hover:bg-mpesa-dark text-white font-bold text-xs flex items-center gap-1.5 shadow"
                        >
                          <Smartphone className="w-3.5 h-3.5" /> Pay Deposit (KES {booking.depositAmount.toLocaleString()})
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedBooking(booking)}
                        className="py-2 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
                      >
                        View Order
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 3: MY GARAGE VEHICLES ================= */}
        {customerTab === 'vehicles' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white font-display">My Registered Vehicles</h3>
                <p className="text-xs text-white/70">Manage saved vehicles in your garage for fast 1-click booking and tailoring history.</p>
              </div>
              <button
                id="add-vehicle-to-garage-btn"
                onClick={() => setShowAddVehicleModal(true)}
                className="py-2.5 px-4 rounded-xl bg-gold text-ink font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow"
              >
                <Plus className="w-3.5 h-3.5" /> Add Vehicle
              </button>
            </div>

            {myVehicles.length === 0 ? (
              <div className="p-12 rounded-3xl bg-panel border border-dashed border-gold text-center space-y-4 shadow-xl">
                <div className="w-14 h-14 rounded-2xl bg-gold border border-gold flex items-center justify-center mx-auto text-gold">
                  <Car className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-base text-white">Your Garage is Empty</h4>
                  <p className="text-xs text-white/70 max-w-md mx-auto">
                    You haven't added any vehicles to your driver profile yet. Register your vehicle to easily track custom tailoring progress and book maintenance services.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddVehicleModal(true)}
                  className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-gold hover:bg-gold-hover text-ink font-black text-xs uppercase tracking-wider shadow-lg"
                >
                  <Plus className="w-4 h-4" /> Add Your Vehicle Now
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myVehicles.map((v) => {
                  const regDisplay = v.registrationNo || (v as any).registrationNumber || 'NO PLATE';
                  const typeDisplay = v.type || (v as any).vehicleType || 'Car';
                  return (
                    <div
                      key={v.id}
                      className="p-6 rounded-2xl bg-panel border border-gold shadow-xl space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="p-2.5 rounded-xl bg-ink text-gold border border-gold">
                            <Car className="w-5 h-5" />
                          </div>
                          <span className="font-mono font-bold text-xs text-gold bg-ink px-2.5 py-1 rounded-lg border border-white/10">
                            {regDisplay}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-bold text-lg text-white font-display">{v.make} {v.model}</h4>
                          <p className="text-xs text-white/70">{v.year} • {v.color || 'Custom'} • {typeDisplay}</p>
                        </div>

                        <div className="space-y-1 text-xs text-white/70 bg-ink p-3 rounded-xl border border-white/5">
                          <span className="text-[10px] text-gold uppercase font-bold block">Upholstery History</span>
                          {v.upholsteryHistory && v.upholsteryHistory.length > 0 ? (
                            v.upholsteryHistory.map((h, i) => (
                              <div key={i} className="flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-whatsapp" /> {h}
                              </div>
                            ))
                          ) : (
                            <div className="text-white/40 italic">Factory Standard Interior</div>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                        <button onClick={() => setVehicleToRemove(v)} className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"> <Trash2 className="w-3.5 h-3.5" /> Remove </button>

                        <button
                          onClick={() => {
                            setBookingWizardInitialServiceId('srv-1');
                            setView('booking');
                          }}
                          className="py-2 px-3 rounded-xl bg-gold hover:bg-gold-hover text-ink font-black text-xs uppercase"
                        >
                          Book Service
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: PROFILE & SETTINGS ================= */}
        {customerTab === 'profile' && (
          <div className="max-w-2xl bg-panel border border-gold rounded-3xl p-6 sm:p-8 space-y-6 animate-in fade-in">
            <h3 className="text-xl font-bold text-white font-display border-b border-white/10 pb-3">
              Driver Profile & Preferences
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-white/70 mb-1">Full Name</label>
                <input type="text" value={profileName} onChange={e=>setProfileName(e.target.value)} className="w-full py-2.5 px-3.5 rounded-xl bg-ink border border-gold text-white font-bold" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 mb-1">Kenyan Phone (M-Pesa registered)</label>
                  <input type="text" value={profilePhone} onChange={e=>setProfilePhone(e.target.value)} className="w-full py-2.5 px-3.5 rounded-xl bg-ink border border-gold text-white font-bold" />
                </div>
                <div>
                  <label className="block text-white/70 mb-1">Email</label>
                  <input type="email" value={profileEmail} onChange={e=>setProfileEmail(e.target.value)} className="w-full py-2.5 px-3.5 rounded-xl bg-ink border border-gold text-white font-bold" />
                </div>
              </div>
              <div>
                <label className="block text-white/70 mb-1">Primary Estate / Area in Kenya</label>
                <input type="text" value={profileLocation} onChange={e=>setProfileLocation(e.target.value)} className="w-full py-2.5 px-3.5 rounded-xl bg-ink border border-gold text-white font-bold" />
              </div>

              <div className="pt-2">
                <span className="text-xs font-bold text-gold block mb-2 uppercase">Communication Preferences</span>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded text-gold" />
                    <span>Get in-app and email updates when vehicle stitching stages change</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded text-gold" />
                    <span>Share work-in-progress photos via WhatsApp on request</span>
                  </label>
                </div>
              </div>

              <button onClick={() => updateProfile({ name: profileName, phone: profilePhone, email: profileEmail, location: profileLocation })} className="py-3 px-6 rounded-xl bg-gold hover:bg-gold-hover text-ink font-black text-xs uppercase tracking-wider shadow">Save Changes</button>
            </div>
          </div>
        )}

            </div>
          </main>
        </div>
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-ink border-2 border-gold rounded-2xl max-w-lg w-full p-6 text-cream shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] text-white/60 uppercase">Job Order</span>
                <h4 className="font-mono font-black text-lg text-gold">{selectedBooking.id}</h4>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs divide-y divide-white/5">
              <div className="flex justify-between pt-1">
                <span className="text-white/60">Service:</span>
                <span className="font-bold text-white">{selectedBooking.serviceName}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-white/60">Vehicle:</span>
                <span className="font-bold text-white">{selectedBooking.vehicleDetails?.make} {selectedBooking.vehicleDetails?.model} ({selectedBooking.vehicleDetails?.registrationNo})</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-white/60">Date & Slot:</span>
                <span className="text-white">{selectedBooking.appointmentDate} ({selectedBooking.appointmentTime})</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-white/60">Material / Color:</span>
                <span className="text-white">{selectedBooking.customOptions?.material} • {selectedBooking.customOptions?.color}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-white/60">Deposit Status:</span>
                <span className={selectedBooking.depositPaid ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                  {selectedBooking.depositPaid ? "Paid (KES " + selectedBooking.depositAmount.toLocaleString() + ")" : "Pending Deposit"}
                </span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-white/60">Estimated Total:</span>
                <span className="font-bold text-gold">KES {selectedBooking.estimatedPrice.toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
              {!selectedBooking.depositPaid && selectedBooking.status !== 'cancelled' && (
                <button
                  onClick={() => handlePayBookingDeposit(selectedBooking)}
                  className="py-2.5 px-4 rounded-xl bg-mpesa hover:bg-mpesa-dark text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <Smartphone className="w-3.5 h-3.5" /> Pay Deposit (M-Pesa)
                </button>
              )}
              <button
                onClick={() => setSelectedBooking(null)}
                className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showAddVehicleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <form onSubmit={handleCreateVehicle} className="bg-ink border-2 border-gold rounded-2xl max-w-md w-full p-6 text-cream shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h4 className="font-bold text-base text-white font-display">Add Vehicle to Garage</h4>
              <button type="button" onClick={() => setShowAddVehicleModal(false)} className="text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/70 mb-1">Make</label>
                  <input
                    type="text"
                    value={newMake}
                    onChange={(e) => setNewMake(e.target.value)}
                    placeholder="Toyota"
                    className="w-full py-2 px-3 rounded-lg bg-panel border border-white/20 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-white/70 mb-1">Model</label>
                  <input
                    type="text"
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    placeholder="Prado"
                    className="w-full py-2 px-3 rounded-lg bg-panel border border-white/20 text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/70 mb-1">Number Plate</label>
                  <input
                    type="text"
                    value={newReg}
                    onChange={(e) => setNewReg(e.target.value.toUpperCase())}
                    placeholder="KDF 123X"
                    className="w-full py-2 px-3 rounded-lg bg-panel border border-white/20 text-gold font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-white/70 mb-1">Year</label>
                  <input
                    type="number"
                    value={newYear}
                    onChange={(e) => setNewYear(Number(e.target.value))}
                    className="w-full py-2 px-3 rounded-lg bg-panel border border-white/20 text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/70 mb-1">Category</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full py-2 px-3 rounded-lg bg-panel border border-white/20 text-white font-bold"
                  >
                    <option value="Car">Car</option>
                    <option value="SUV">SUV</option>
                    <option value="Van">Van</option>
                    <option value="Truck">Truck</option>
                    <option value="Matatu">Matatu</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white/70 mb-1">Color</label>
                  <input
                    type="text"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    placeholder="Black"
                    className="w-full py-2 px-3 rounded-lg bg-panel border border-white/20 text-white font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddVehicleModal(false)}
                className="py-2 px-4 rounded-xl bg-white/10 text-white font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2 px-4 rounded-xl bg-gold text-ink font-black text-xs uppercase tracking-wider"
              >
                Save Vehicle
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirm Vehicle Removal Modal */}
      {vehicleToRemove && (
        <div role="dialog" aria-modal="true" aria-labelledby="remove-vehicle-title" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-ink border-2 border-gold rounded-2xl max-w-sm w-full p-6 text-cream shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h4 id="remove-vehicle-title" className="font-bold text-base text-white font-display">Remove Vehicle?</h4>
              <button type="button" onClick={() => setVehicleToRemove(null)} aria-label="Close" className="text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              Remove {vehicleToRemove.make} {vehicleToRemove.model} ({vehicleToRemove.registrationNo}) from your garage? This cannot be undone.
            </p>
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setVehicleToRemove(null)}
                className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
              >
                Cancel
              </button>
              <button
                id="confirm-remove-vehicle-btn"
                type="button"
                onClick={() => { deleteVehicle(vehicleToRemove.id); setVehicleToRemove(null); }}
                className="py-2.5 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black text-xs uppercase tracking-wider"
              >
                Remove Vehicle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Inspection Zoom Modal */}
      {inspectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setInspectedImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[85vh] bg-ink border border-gold rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b border-white/10 bg-panel">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-gold" /> Workshop Craftsmanship Inspection
              </span>
              <button
                onClick={() => setInspectedImage(null)}
                className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center max-h-[75vh] overflow-auto">
              <img
                src={inspectedImage}
                alt="Workshop inspection photo"
                className="max-h-[70vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
