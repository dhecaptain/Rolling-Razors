import React, { useState, useEffect } from 'react';
import { useApp, isStaff } from '../../context/AppContext';
import {
  BarChart3, Calendar as CalendarIcon, Car, CheckCircle2, Clock, DollarSign, FileText, Filter, Layers, MapPin, Plus, Scissors, ShieldAlert, Smartphone, Trash2, UserCheck, Users, X, TrendingUp, Search, Check, Phone, ArrowRight, AlertTriangle, History, Camera, Power, PowerOff, UserPlus, KeyRound, LayoutDashboard, Image as ImageIcon, CalendarDays, CreditCard, LogOut, ArrowUpRight
} from 'lucide-react';
import { Booking, Service, WorkOrder, WorkOrderStage, STAFF_ROLE_LABEL, STAFF_STATUS_LABEL, StaffRole, UserRole } from '../../types';
import { PhotoUploader } from '../common/PhotoUploader';

const readableStatus = (value: string) => value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const BOOKING_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'completed', label: 'Completed' },
];

export const AdminDashboard: React.FC = () => {
  const {
    currentUser, adminTab, setAdminTab, bookings, updateBookingStatus, workOrders, updateWorkOrderStage, updateWorkOrderPhotos, services, addService, updateServiceDetails, staff, customers, addToast, setView, logout, openAuth, authFetch, refreshStaff
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedBookingForAdmin, setSelectedBookingForAdmin] = useState<Booking | null>(null);
  const [selectedWorkOrderForPhotos, setSelectedWorkOrderForPhotos] = useState<WorkOrder | null>(null);
  const [bookingFilterStatus, setBookingFilterStatus] = useState<string>('all');
  const [bookingsPage, setBookingsPage] = useState(1);
  const [bookingsTotal, setBookingsTotal] = useState(0);
  const [paginatedBookings, setPaginatedBookings] = useState<Booking[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [showAudit, setShowAudit] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState(15000);
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState('1 - 2 Days');
  const [newServiceImage, setNewServiceImage] = useState('');
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceSaveBusy, setServiceSaveBusy] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffTemp, setNewStaffTemp] = useState<string | null>(null);
  const [newStaffForm, setNewStaffForm] = useState<{ name: string; phone: string; email: string; role: UserRole; specialty: string }>({ name: '', phone: '', email: '', role: 'craftsman', specialty: '' });

  const role = (currentUser?.role || 'customer') as UserRole;

  // Role-scoped workspace tabs — mirrored from server/casbin/policy.csv so the
  // UI never offers actions the backend would reject with 403.
  const TAB_SCOPE: Record<string, string[]> = {
    owner: ['overview', 'kanban', 'bookings', 'calendar', 'services', 'customers', 'staff', 'payments'],
    manager: ['overview', 'kanban', 'bookings', 'calendar', 'services', 'customers', 'staff', 'payments'],
    craftsman: ['kanban', 'bookings'],
    receptionist: ['bookings', 'customers'],
  };
  const allowedTabs = TAB_SCOPE[role] || [];
  const canConfirmBookings = ['owner', 'manager', 'receptionist'].includes(role);
  const canManageStaff = ['owner', 'manager'].includes(role);
  const canAddStaff = role === 'owner';
  const canSetOwnerRole = role === 'owner';
  // Inventory + audit trails are owner/manager-only on the server; skip the
  // requests entirely for other roles to avoid guaranteed 403 noise.
  const canAccessAdmin = canManageStaff;

  useEffect(() => {
    if (!allowedTabs.includes(adminTab)) {
      setAdminTab((allowedTabs[0] || 'overview') as any);
    }
  }, [adminTab, role]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    if (adminTab !== 'bookings') return;
    const params = new URLSearchParams({ page: String(bookingsPage), limit: '10', status: bookingFilterStatus });
    if (debouncedSearch) params.set('q', debouncedSearch);
    authFetch(`/api/bookings?${params.toString()}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) { setPaginatedBookings(d.bookings); setBookingsTotal(d.pagination?.total ?? d.bookings.length); }
      }).catch(()=>{});
  }, [adminTab, bookingsPage, bookingFilterStatus, debouncedSearch]);

  useEffect(() => { setBookingsPage(1); }, [bookingFilterStatus, debouncedSearch]);

  useEffect(() => {
    if (adminTab !== 'payments') return;
    authFetch('/api/mpesa/transactions?page=1&limit=20')
      .then(r=>r.json()).then(d=>{ if(d.success) setTransactions(d.transactions); }).catch(()=>{});
  }, [adminTab]);

  useEffect(() => {
    if (!canAccessAdmin) return;
    authFetch('/api/inventory/low')
      .then(r=>r.json()).then(d=>{ if(d.success) setLowStock(d.lowStock || []); }).catch(()=>{});
  }, [adminTab, canAccessAdmin]);

  useEffect(() => {
    if (!canAccessAdmin || !selectedBookingForAdmin) return;
    authFetch(`/api/audit-logs?entityType=Booking&entityId=${selectedBookingForAdmin.id}&limit=20`)
      .then(r=>r.json()).then(d=>{ if(d.success) setAuditLogs(d.logs); else setAuditLogs([]); }).catch(()=>setAuditLogs([]));
  }, [selectedBookingForAdmin]);

  if (!currentUser || !isStaff(currentUser.role)) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex items-center justify-center bg-ink text-cream px-4">
        <div className="max-w-md w-full bg-panel border-2 border-rose-500/40 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500 text-rose-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-white">Workshop Admin Access Restricted</h2>
          <p className="text-xs text-white/70 leading-relaxed">
            This operations hub is strictly restricted to authorized Rolling Razors workshop managers and master craftsmen.
          </p>
          <div className="pt-2 space-y-2">
            <button onClick={() => openAuth('admin')} className="w-full py-3 rounded-xl bg-gold text-ink font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer">
              <ShieldAlert className="w-4 h-4" />
              <span>Authenticate as Workshop Staff</span>
            </button>
            <button onClick={() => setView('website')} className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-semibold cursor-pointer">
              Return to Website
            </button>
          </div>
        </div>
      </div>
    );
  }

  const displayBookings = adminTab === 'bookings' ? paginatedBookings : bookings;
  const totalRevenue = transactions.length ? transactions.filter(t=>t.status==='SUCCESS').reduce((sum:number,t:any)=>sum+(t.amount||0),0) : bookings.reduce((sum,b)=>b.depositPaid ? sum+b.depositAmount : sum,0);
  const inWorkshopCount = workOrders.filter(w=>w.stage!=='COLLECTED').length;
  const pages = Math.max(1, Math.ceil(bookingsTotal/10));

  const kanbanStages: { id: WorkOrderStage; label: string }[] = [
    { id: 'BOOKED', label: '1. Booked' },
    { id: 'VEHICLE_RECEIVED', label: '2. Vehicle Received' },
    { id: 'MATERIALS_PREPARED', label: '3. Materials Ready' },
    { id: 'IN_PROGRESS', label: '4. Stitching / Crafting' },
    { id: 'QUALITY_CHECK', label: '5. Quality Check' },
    { id: 'READY_FOR_COLLECTION', label: '6. Ready for Collection' }
  ];

  const navigationItems = [
    { id: 'overview', label: 'Overview', group: 'Workspace', icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'kanban', label: 'Work orders', group: 'Operations', icon: <Scissors className="h-4 w-4" /> },
    { id: 'bookings', label: 'Bookings', group: 'Operations', icon: <FileText className="h-4 w-4" />, count: bookingsTotal || bookings.length },
    { id: 'calendar', label: 'Schedule', group: 'Operations', icon: <CalendarDays className="h-4 w-4" /> },
    { id: 'services', label: 'Services', group: 'Manage', icon: <Layers className="h-4 w-4" />, count: services.length },
    { id: 'customers', label: 'Customers', group: 'Manage', icon: <Users className="h-4 w-4" />, count: customers.length },
    { id: 'staff', label: 'Staff', group: 'Manage', icon: <UserCheck className="h-4 w-4" />, count: staff.length },
    { id: 'payments', label: 'Payments', group: 'Manage', icon: <CreditCard className="h-4 w-4" /> },
  ].filter((item) => allowedTabs.includes(item.id));
  const pageTitle = navigationItems.find((item) => item.id === adminTab)?.label || 'Workshop';
  const bookingStatusBreakdown = [
    { label: 'Pending', value: bookings.filter((booking) => booking.status === 'pending').length, color: '#C2844B' },
    { label: 'Confirmed', value: bookings.filter((booking) => ['confirmed', 'checked_in'].includes(booking.status)).length, color: '#D6A62E' },
    { label: 'In progress', value: bookings.filter((booking) => ['in_progress', 'quality_check', 'ready'].includes(booking.status)).length, color: '#6E9984' },
    { label: 'Completed', value: bookings.filter((booking) => booking.status === 'completed').length, color: '#A9B98B' },
  ];
  const bookingStatusTotal = bookingStatusBreakdown.reduce((total, segment) => total + segment.value, 0);
  const circumference = 2 * Math.PI * 42;

  const handleStageChange = async (orderId: string, newStage: WorkOrderStage, version?: number) => {
    const res = await authFetch(`/api/work-orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ stage: newStage, version }),
    });
    const data = await res.json();
    if (!res.ok) {
      if (data.conflict) addToast('error','Version Conflict', data.error || 'Another craftsman updated this order. Refresh.');
      else addToast('error','Update Failed', data.error || 'Could not move stage.');
      return;
    }
    updateWorkOrderStage(orderId, newStage as any);
    addToast('success','Work Order Updated', `Moved to ${newStage.replace(/_/g,' ').toLowerCase()}.`);
  };

  const openServiceEditor = (service?: Service) => {
    setEditingServiceId(service?.id || null);
    setNewServiceName(service?.name || '');
    setNewServicePrice(service?.startingPrice ?? 15000);
    setNewServiceDesc(service?.shortDesc || '');
    setNewServiceDuration(service?.estimatedDuration || '1 - 2 Days');
    setNewServiceImage(service?.image || '');
    setShowAddServiceModal(true);
  };

  const closeServiceEditor = () => {
    setShowAddServiceModal(false);
    setEditingServiceId(null);
    setNewServiceName('');
    setNewServicePrice(15000);
    setNewServiceDesc('');
    setNewServiceDuration('1 - 2 Days');
    setNewServiceImage('');
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newServiceName.trim();
    const description = newServiceDesc.trim();
    if (!name || !Number.isSafeInteger(newServicePrice) || newServicePrice < 0) {
      addToast('error', 'Check the service details', 'Enter a service name and a valid whole-number price.');
      return;
    }
    setServiceSaveBusy(true);
    const serviceImage = newServiceImage || '/images/services/leather-seats.jpg';
    try {
      if (editingServiceId) {
        await updateServiceDetails(editingServiceId, {
          name,
          shortDesc: description,
          longDesc: description,
          startingPrice: newServicePrice,
          estimatedDuration: newServiceDuration.trim() || '1 - 2 Days',
          image: serviceImage,
        });
      } else {
        addService({
          name,
          shortDesc: description || 'Professional upholstery customization.',
          longDesc: description || 'High quality tailoring for Kenyan vehicles.',
          startingPrice: newServicePrice,
          estimatedDuration: newServiceDuration.trim() || '1 - 2 Days',
          image: serviceImage,
          iconName: 'Scissors',
          includedFeatures: ['Custom measurement', 'High density foam', '1 Year warranty'],
          materialsAvailable: ['Nappa Leather', 'Vinyl', 'Alcantara']
        });
        addToast('success', 'Service added', `${name} is being published to the catalog.`);
      }
      closeServiceEditor();
    } catch (error) {
      addToast('error', 'Could not save service', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setServiceSaveBusy(false);
    }
  };

  // Refresh the live staff directory whenever its tab is opened.
  useEffect(() => {
    if (adminTab === 'staff') refreshStaff();
  }, [adminTab, refreshStaff]);

  const handleStaffDeactivate = async (memberId: string) => {
    const res = await authFetch(`/api/staff/${memberId}/deactivate`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
      addToast('error', 'Deactivation Failed', data.error || 'Could not deactivate staff member.');
      return;
    }
    await refreshStaff();
    addToast('success', 'Staff Deactivated', data.message || 'Staff account suspended and sessions revoked.');
  };

  const handleStaffReactivate = async (memberId: string) => {
    const res = await authFetch(`/api/staff/${memberId}/reactivate`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
      addToast('error', 'Reactivation Failed', data.error || 'Could not reactivate staff member.');
      return;
    }
    await refreshStaff();
    addToast('success', 'Staff Reactivated', data.message || 'Staff account can sign in again.');
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffForm.name || !newStaffForm.phone) return;
    try {
      const res = await authFetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStaffForm.name,
          phone: newStaffForm.phone,
          email: newStaffForm.email || undefined,
          role: newStaffForm.role,
          specialization: newStaffForm.specialty || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        addToast('error', 'Add Failed', data.error || 'Could not add staff member.');
        return;
      }
      await refreshStaff();
      setShowAddStaffModal(false);
      setNewStaffTemp(data.temporaryPassword || null);
      setNewStaffForm({ name: '', phone: '', email: '', role: 'craftsman', specialty: '' });
    } catch {
      addToast('error', 'Add Failed', 'Server unreachable when adding the staff member.');
    }
  };

  return (
    <div id="admin-dashboard-container" className="min-h-screen bg-ink text-cream">
      <div className="min-h-screen lg:grid lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-screen flex-col border-r border-white/10 bg-ink-deep px-4 py-6 lg:flex">
          <div className="mb-8 flex items-center gap-3 px-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-gold/40 bg-gold/10 text-gold"><Scissors className="h-5 w-5" /></span>
            <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-gold">Rolling Razors</p><p className="mt-0.5 text-sm font-bold text-cream">Workshop</p></div>
          </div>
          <nav aria-label="Workshop dashboard" className="flex-1 space-y-6 overflow-y-auto">
            {['Workspace', 'Operations', 'Manage'].map((group) => {
              const items = navigationItems.filter((item) => item.group === group);
              if (!items.length) return null;
              return <div key={group}>
                <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-white/40">{group}</p>
                <div className="space-y-1">
                  {items.map((item) => (
                    <button key={item.id} type="button" onClick={() => setAdminTab(item.id)} aria-current={adminTab === item.id ? 'page' : undefined} className={`group flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[13px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold ${adminTab === item.id ? 'bg-gold text-ink shadow-lg shadow-black/20' : 'text-cream-muted hover:bg-white/5 hover:text-cream'}`}>
                      {item.icon}<span className="flex-1">{item.label}</span>
                      {item.count !== undefined && <span className={`min-w-6 rounded-full px-1.5 py-0.5 text-center text-[10px] ${adminTab === item.id ? 'bg-ink/10 text-ink' : 'bg-white/5 text-white/60'}`}>{item.count}</span>}
                    </button>
                  ))}
                </div>
              </div>;
            })}
          </nav>
          <div className="mt-6 space-y-2 border-t border-white/10 pt-4">
            <button type="button" onClick={() => setView('website')} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-xs font-semibold text-cream-muted transition-colors hover:bg-white/5 hover:text-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold"><ArrowUpRight className="h-4 w-4" />View website</button>
            <button type="button" onClick={logout} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-xs font-semibold text-cream-muted transition-colors hover:bg-rose-500/10 hover:text-rose-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold"><LogOut className="h-4 w-4" />Sign out</button>
          </div>
        </aside>

        <div className="min-w-0">
          <nav aria-label="Workshop sections" className="sticky top-0 z-30 flex gap-1 overflow-x-auto border-b border-white/10 bg-ink-deep/95 px-3 py-2 backdrop-blur-xl lg:hidden">
            {navigationItems.map((item) => (
              <button key={item.id} type="button" onClick={() => setAdminTab(item.id)} aria-current={adminTab === item.id ? 'page' : undefined} className={`flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-xs font-semibold ${adminTab === item.id ? 'bg-gold text-ink' : 'text-cream-muted hover:bg-white/5 hover:text-cream'}`}>
                {item.icon}<span>{item.label}</span>
              </button>
            ))}
            <span className="my-1 w-px shrink-0 bg-white/10" aria-hidden="true" />
            <button type="button" onClick={() => setView('website')} className="flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-cream-muted hover:bg-white/5 hover:text-cream"><ArrowUpRight className="h-4 w-4" /><span>Website</span></button>
            <button type="button" onClick={logout} className="flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-cream-muted hover:bg-rose-500/10 hover:text-rose-200"><LogOut className="h-4 w-4" /><span>Sign out</span></button>
          </nav>

          <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-9 lg:py-9">
            <header className="mb-7 flex flex-col justify-between gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.2em] text-gold">Workshop / Narok</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <h1 className="font-display text-3xl font-black tracking-tight text-white sm:text-4xl">{pageTitle}</h1>
                  <span className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-gold">{STAFF_ROLE_LABEL[role as StaffRole] || role}</span>
                </div>
                <p className="mt-2 text-sm text-cream-muted">Welcome back, {currentUser?.name}. Here’s what’s happening in your workshop.</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-cream-muted"><Clock className="h-4 w-4 text-gold" />{new Date().toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</div>
            </header>

            {lowStock.length > 0 && (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/[.08] p-4 text-xs">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                <div><div className="font-bold text-amber-200">Low stock · {lowStock.length} items need attention</div><div className="mt-1 text-cream-muted">{lowStock.map((item: any) => `${item.sku} (${item.qtyOnHand}${item.unit})`).join(', ')}</div></div>
              </div>
            )}

        {adminTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="p-5 rounded-2xl bg-panel border border-gold space-y-1">
                <span className="text-[11px] text-white/60 block uppercase font-bold">Total Bookings</span>
                <span className="text-3xl font-black text-white">{bookingsTotal||bookings.length}</span>
                <p className="text-[11px] text-gold flex items-center gap-1"><TrendingUp className="w-3 h-3" /> All requests</p>
              </div>
              <div className="p-5 rounded-2xl bg-panel border border-gold space-y-1">
                <span className="text-[11px] text-white/60 block uppercase font-bold">Jobs at workshop</span>
                <span className="text-3xl font-black text-gold">{inWorkshopCount}</span>
                <p className="text-[11px] text-white/70">Currently at the workshop</p>
              </div>
              <div className="p-5 rounded-2xl bg-panel border border-gold space-y-1">
                <span className="text-[11px] text-white/60 block uppercase font-bold">Deposits collected</span>
                <span className="text-2xl sm:text-3xl font-black text-whatsapp">KES {totalRevenue.toLocaleString()}</span>
                <p className="text-[11px] text-white/70">Recorded payments</p>
              </div>
              <div className="p-5 rounded-2xl bg-panel border border-gold space-y-1">
                <span className="text-[11px] text-white/60 block uppercase font-bold">Master Craftsmen</span>
                <span className="text-3xl font-black text-purple-400">{staff.length}</span>
                <p className="text-[11px] text-white/70">Upholstery & Canvas</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <section className="rounded-2xl border border-white/10 bg-panel p-5 shadow-xl sm:p-6" aria-labelledby="booking-status-chart-title">
                <div className="flex items-start justify-between gap-4">
                  <div><h2 id="booking-status-chart-title" className="font-display text-lg font-bold text-white">Booking status</h2><p className="mt-1 text-xs text-cream-muted">A live view of customer requests</p></div>
                  <span className="rounded-lg border border-white/10 bg-ink px-3 py-1.5 text-[10px] font-semibold text-cream-muted">{bookings.length} total</span>
                </div>
                <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row">
                  <div className="relative h-40 w-40 shrink-0" role="img" aria-label={`Bookings by status: ${bookingStatusBreakdown.map((segment) => `${segment.label} ${segment.value}`).join(', ')}`}>
                    <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="10" />
                      {bookingStatusBreakdown.map((segment, index) => {
                        const length = bookingStatusTotal ? circumference * segment.value / bookingStatusTotal : 0;
                        const offset = bookingStatusBreakdown.slice(0, index).reduce((sum, previous) => sum + (bookingStatusTotal ? circumference * previous.value / bookingStatusTotal : 0), 0);
                        return <circle key={segment.label} cx="50" cy="50" r="42" fill="none" stroke={segment.color} strokeWidth="10" strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-offset} />;
                      })}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="font-display text-3xl font-black text-white">{bookings.length}</span><span className="text-[10px] uppercase tracking-wide text-cream-muted">Bookings</span></div>
                  </div>
                  <div className="grid w-full grid-cols-2 gap-x-4 gap-y-4">
                    {bookingStatusBreakdown.map((segment) => <div key={segment.label} className="flex items-center gap-2.5"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} /><div><p className="text-[11px] text-cream-muted">{segment.label}</p><p className="mt-0.5 text-lg font-bold text-white">{segment.value}</p></div></div>)}
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-panel p-5 shadow-xl sm:p-6" aria-labelledby="workload-chart-title">
                <div className="flex items-start justify-between gap-4">
                  <div><h2 id="workload-chart-title" className="font-display text-lg font-bold text-white">Workshop workload</h2><p className="mt-1 text-xs text-cream-muted">Active jobs by stage</p></div>
                  <span className="rounded-lg border border-white/10 bg-ink px-3 py-1.5 text-[10px] font-semibold text-cream-muted">{inWorkshopCount} active</span>
                </div>
                <div className="mt-6 space-y-4" role="img" aria-label={`Active work orders by stage: ${kanbanStages.map((stage) => `${stage.label}, ${workOrders.filter((order) => order.stage === stage.id).length}`).join('; ')}`}>
                  {kanbanStages.map((stage, index) => {
                    const count = workOrders.filter((order) => order.stage === stage.id).length;
                    const maxCount = Math.max(1, ...kanbanStages.map((item) => workOrders.filter((order) => order.stage === item.id).length));
                    return <div key={stage.id} className="grid grid-cols-[112px_minmax(0,1fr)_28px] items-center gap-3 text-[11px]">
                      <span className="truncate text-cream-muted">{stage.label.replace(/^\d+\. /, '')}</span>
                      <span className="h-2 overflow-hidden rounded-full bg-ink"><span className="block h-full rounded-full bg-gold transition-all" style={{ width: `${count ? Math.max(6, count / maxCount * 100) : 0}%`, opacity: 1 - index * 0.07 }} /></span>
                      <span className="text-right font-bold text-white">{count}</span>
                    </div>;
                  })}
                </div>
              </section>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 bg-panel border border-gold rounded-3xl p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="font-bold text-base text-white font-display flex items-center gap-2"><Scissors className="w-4 h-4 text-gold" /> Live Workshop Floor Activity</h3>
                  <button onClick={() => setAdminTab('kanban')} className="text-xs text-gold font-bold hover:underline">Open Full Board</button>
                </div>
                <div className="space-y-3">
                  {workOrders.slice(0,5).map((wo) => (
                    <div key={wo.id} className="p-4 rounded-xl bg-ink border border-white/10 flex items-center justify-between gap-4 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-gold">{wo.id}</span>
                          <span className="text-white font-bold">{wo.vehicleDisplayName}</span>
                        </div>
                        <p className="text-white/70">{wo.serviceName} · {wo.assignedStaffName || 'Unassigned'}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <span className="inline-block rounded-full border border-gold/40 bg-ink px-2.5 py-1 text-xs font-bold text-cream">{wo.stage.replace(/_/g,' ').toLowerCase()}</span>
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-[10px] text-white/50">{wo.progressPercentage}%</span>
                          <button
                            onClick={() => setSelectedWorkOrderForPhotos(wo)}
                            className="p-1 rounded bg-panel hover:bg-white/10 text-gold text-[10px] font-bold flex items-center gap-1 border border-white/10"
                            title="Inspect Bay Photos"
                          >
                            <Camera className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-5 bg-panel border border-gold rounded-3xl p-6 space-y-5">
                <h3 className="font-bold text-base text-white font-display border-b border-white/10 pb-3">Pending Driver Requests</h3>
                <div className="space-y-3">
                  {bookings.slice(0,3).map((b) => (
                    <div key={b.id} className="p-3.5 rounded-xl bg-ink border border-white/5 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{b.customerName}</span>
                        <span className="text-gold font-mono">{b.vehicleDetails?.registrationNo}</span>
                      </div>
                      <p className="text-white/70">{b.serviceName} on {b.appointmentDate}</p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-white/50">{b.paymentMethod==='mpesa' ? 'Lipa na M-Pesa' : 'Pay at Shop'}</span>
                        <button onClick={() => { setSelectedBookingForAdmin(b); setAdminTab('bookings'); }} className="text-xs text-gold font-bold hover:underline">Review & Assign</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {adminTab === 'kanban' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white font-display">Work orders</h3>
                <p className="text-xs text-white/70">Move a job to the next stage as work progresses. Items with low stock may need restocking before preparation.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
              {kanbanStages.map(stage => {
                const stageOrders = workOrders.filter(w=>w.stage===stage.id);
                return (
                  <div key={stage.id} className="bg-panel rounded-2xl border border-white/10 p-3 space-y-3 flex flex-col min-w-[210px]">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <span className="text-xs font-bold text-white leading-tight">{stage.label}</span>
                      <span className="px-2 py-0.5 rounded-full bg-black/40 text-[11px] font-bold text-gold">{stageOrders.length}</span>
                    </div>
                    <div className="space-y-2.5 flex-1">
                      {stageOrders.map(order => (
                        <div key={order.id} className="p-3.5 rounded-xl bg-ink border border-gold shadow-md space-y-2 text-xs hover:border-gold transition-all">
                          <div className="font-mono text-[11px] text-gold font-bold">{order.id}</div>
                          <h5 className="font-bold text-white text-xs leading-tight">{order.vehicleDisplayName}</h5>
                          <p className="text-[11px] text-white/70">{order.serviceName}</p>
                          <div className="text-[10px] text-cream-muted">{order.assignedStaffName || 'Unassigned'}</div>
                          <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                            <label htmlFor={`work-order-stage-${order.id}`} className="text-[10px] text-white/70">Move to</label>
                            <select id={`work-order-stage-${order.id}`} aria-label={`Move ${order.vehicleDisplayName} to a stage`} value={order.stage} onChange={(e)=>handleStageChange(order.id, e.target.value as WorkOrderStage, (order as any).version)} className="min-h-10 max-w-[125px] rounded-lg border border-white/20 bg-panel px-2 text-[10px] font-bold text-white focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30">
                              <option value="BOOKED">1. Booked</option>
                              <option value="VEHICLE_RECEIVED">2. Received</option>
                              <option value="MATERIALS_PREPARED">3. Prepped</option>
                              <option value="IN_PROGRESS">4. Stitching</option>
                              <option value="QUALITY_CHECK">5. QC Check</option>
                              <option value="READY_FOR_COLLECTION">6. Ready</option>
                              <option value="COLLECTED">7. Collected</option>
                            </select>
                          </div>
                          <button
                            onClick={() => setSelectedWorkOrderForPhotos(order)}
                            aria-label={`View photos for ${order.vehicleDisplayName}`}
                            className="mt-2 flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-panel px-2 text-[10px] font-bold text-white/80 transition-colors hover:bg-white/10 hover:text-gold"
                          >
                            <Camera className="w-3 h-3 text-gold" />
                            <span>Bay Photos ({((order.beforePhotos?.length || 0) + (order.progressPhotos?.length || 0) + (order.afterPhotos?.length || 0))})</span>
                          </button>
                        </div>
                      ))}
                      {stageOrders.length===0 && <div className="text-center py-6 text-[11px] text-white/30 italic">No active vehicles in this bay</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {adminTab === 'bookings' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white font-display">Customer Bookings Directory</h3>
                <p className="text-xs text-white/70">Find a booking, review the details, and update its status.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-white/40" />
                  <input type="search" aria-label="Search bookings" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search name, phone or plate" className="min-h-10 w-full rounded-lg border border-white/10 bg-panel pl-8 pr-3 text-xs text-white placeholder:text-white/40 sm:w-48" />
                </div>
                {BOOKING_FILTERS.map(({ id, label }) => (
                  <button key={id} onClick={()=>setBookingFilterStatus(id)} aria-pressed={bookingFilterStatus===id} className={`min-h-10 rounded-lg px-3 text-xs font-bold transition-colors ${bookingFilterStatus===id ? 'bg-gold text-ink' : 'bg-panel text-cream-muted hover:text-cream'}`}>{label}</button>
                ))}
              </div>
            </div>
            <div className="bg-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-cream">
                  <thead className="bg-ink text-gold uppercase font-bold tracking-wider border-b border-white/10">
                    <tr><th className="py-3 px-4">Booking ID</th><th className="py-3 px-4">Customer</th><th className="py-3 px-4">Vehicle</th><th className="py-3 px-4">Service</th><th className="py-3 px-4">Date & Slot</th><th className="py-3 px-4">Deposit</th><th className="py-3 px-4">Status</th><th className="py-3 px-4 text-right">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {displayBookings.map(booking => (
                      <tr key={booking.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-gold">{booking.id}</td>
                        <td className="py-3.5 px-4"><div className="font-bold text-white">{booking.customerName}</div><div className="text-[11px] text-white/60">{booking.customerPhone}</div></td>
                        <td className="py-3.5 px-4"><div className="font-bold">{booking.vehicleDetails?.make} {booking.vehicleDetails?.model}</div><div className="font-mono text-[11px] text-gold">{booking.vehicleDetails?.registrationNo}</div></td>
                        <td className="py-3.5 px-4">{booking.serviceName}</td>
                        <td className="py-3.5 px-4"><div>{booking.appointmentDate}</div><div className="text-[10px] text-white/60">{booking.appointmentTime}</div></td>
                        <td className="py-3.5 px-4"><span className={booking.depositPaid?"text-emerald-400 font-bold":"text-amber-400 font-bold"}>{booking.depositPaid?`Paid (KES ${booking.depositAmount.toLocaleString()})`:`Pending KES ${booking.depositAmount.toLocaleString()}`}</span></td>
                        <td className="py-3.5 px-4"><span className="font-bold text-xs">{readableStatus(booking.status)}</span></td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {booking.status==='pending' && canConfirmBookings && (
                              <button onClick={async()=>{
                                const res=await authFetch(`/api/bookings/${booking.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'confirmed'})});
                                const data=await res.json();
                                if(!res.ok) addToast('error','Confirm Failed', data.error||'We could not confirm this booking. Refresh and try again.');
                                else { updateBookingStatus(booking.id,'confirmed','Admin confirmed schedule.'); addToast('success','Booking Confirmed',`Booking ${booking.id} is confirmed.`); }
                              }} className="py-1 px-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px] font-bold hover:bg-emerald-500 hover:text-white">Confirm</button>
                            )}
                            <button onClick={()=>setSelectedBookingForAdmin(booking)} className="min-h-10 rounded-lg bg-white/10 px-3 text-white text-[11px] font-bold transition-colors hover:bg-white/20">Details</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between p-3 border-t border-white/10 text-xs">
                <span className="text-white/60">Page {bookingsPage} of {pages} — {bookingsTotal} total</span>
                <div className="flex gap-2">
                  <button disabled={bookingsPage<=1} onClick={()=>setBookingsPage(p=>Math.max(1,p-1))} className="px-3 py-1.5 rounded-lg bg-white/10 disabled:opacity-40 text-white text-xs">Prev</button>
                  <button disabled={bookingsPage>=pages} onClick={()=>setBookingsPage(p=>p+1)} className="px-3 py-1.5 rounded-lg bg-white/10 disabled:opacity-40 text-white text-xs">Next</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {adminTab === 'calendar' && (
          <div className="bg-panel border border-gold rounded-3xl p-6 sm:p-8 space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div><h3 className="text-xl font-bold text-white font-display">Workshop Weekly Appointment Grid</h3><p className="text-xs text-white/70">Grouped by real appointmentDate.</p></div>
              <span className="px-3 py-1 rounded-full bg-ink border border-gold text-xs font-bold text-gold">Live Schedule</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from(new Set(bookings.map(b=>b.appointmentDate))).slice(0,6).map((date) => {
                const dayBookings = bookings.filter(b=>b.appointmentDate===date);
                return (
                  <div key={date} className="p-4 rounded-2xl bg-ink border border-white/10 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <h4 className="font-bold text-sm text-gold">{date}</h4>
                      <span className="text-[10px] text-white/60">{dayBookings.length} bookings</span>
                    </div>
                    <div className="space-y-2">
                      {dayBookings.map(b => (
                        <div key={b.id} className="p-2.5 rounded-xl bg-panel border border-gold text-xs space-y-1">
                          <div className="flex items-center justify-between"><span className="font-bold text-white truncate">{b.vehicleDetails?.make} {b.vehicleDetails?.model}</span><span className="font-mono text-[10px] text-gold">{b.appointmentTime}</span></div>
                          <p className="text-[11px] text-white/70">{b.serviceName}</p>
                          <span className="text-[10px] text-emerald-400 font-medium block">Driver: {b.customerName}</span>
                        </div>
                      ))}
                      {dayBookings.length===0 && <p className="text-center py-4 text-xs text-white/30 italic">No bookings</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {adminTab === 'services' && (
          <section className="space-y-6 animate-in fade-in">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div><h2 className="font-display text-2xl font-bold text-white">Service catalog</h2><p className="mt-1 text-sm text-cream-muted">Keep service details, pricing, and customer-facing photos up to date.</p></div>
              <button id="add-new-service-btn" type="button" onClick={() => openServiceEditor()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gold px-4 text-xs font-black uppercase tracking-wide text-ink shadow-lg transition-colors hover:bg-gold-hover"><Plus className="h-4 w-4" />Add service</button>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
              {services.map((service) => (
                <article key={service.id} className="overflow-hidden rounded-2xl border border-white/10 bg-panel shadow-xl transition-transform duration-200 hover:-translate-y-0.5 hover:border-gold/40">
                  <div className="relative aspect-[16/9] overflow-hidden bg-ink-deep">
                    {service.image ? <img src={service.image} alt={`${service.name} service`} className="h-full w-full object-cover" loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : <div className="grid h-full place-items-center text-gold/70"><ImageIcon className="h-9 w-9" /></div>}
                    <span className="absolute bottom-3 left-3 rounded-full border border-white/10 bg-ink/80 px-3 py-1.5 text-[10px] font-semibold text-cream backdrop-blur">{service.estimatedDuration || 'Timing confirmed on request'}</span>
                  </div>
                  <div className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-3"><h3 className="font-display text-lg font-bold leading-snug text-white">{service.name}</h3><span className="shrink-0 rounded-lg bg-gold/10 px-2.5 py-1.5 text-xs font-bold text-gold">KES {service.startingPrice.toLocaleString()}</span></div>
                    <p className="min-h-10 text-xs leading-5 text-cream-muted">{service.shortDesc}</p>
                    <div className="flex items-center justify-between border-t border-white/10 pt-3"><span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-300">Available online</span><button type="button" onClick={() => openServiceEditor(service)} className="min-h-10 rounded-lg border border-white/10 px-3 text-xs font-bold text-cream transition-colors hover:border-gold hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold">Edit service</button></div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {adminTab === 'customers' && (
          <div className="bg-panel rounded-3xl border border-white/10 p-6 sm:p-8 space-y-6 animate-in fade-in">
            <h3 className="text-xl font-bold text-white font-display border-b border-white/10 pb-3">Driver & Fleet Directory</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customers.map(c => (
                <div key={c.id} className="p-4 rounded-2xl bg-ink border border-white/10 space-y-2 text-xs">
                  <div className="flex items-center justify-between"><h4 className="font-bold text-sm text-white">{c.name}</h4><span className="font-mono text-[10px] text-gold">{c.id}</span></div>
                  <p className="text-white/70 flex items-center gap-1"><Phone className="w-3 h-3 text-gold" /> {c.phone}</p>
                  <p className="text-white/70 flex items-center gap-1"><MapPin className="w-3 h-3 text-gold" /> {c.location}</p>
                  <div className="pt-2 border-t border-white/10 flex justify-between text-[11px]"><span className="text-white/50">Total Spent:</span><span className="font-bold text-whatsapp">KES {c.totalSpent.toLocaleString()}</span></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {adminTab === 'staff' && (
          <div className="bg-panel rounded-3xl border border-white/10 p-6 sm:p-8 space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div><h3 className="text-xl font-bold text-white font-display">Workshop staff</h3><p className="text-xs text-white/70">Manage staff roles and sign-in access.</p></div>
              {canAddStaff && (
                <button id="add-staff-btn" onClick={() => setShowAddStaffModal(true)} className="py-2.5 px-4 rounded-xl bg-gold text-ink font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow"><UserPlus className="w-3.5 h-3.5" /> Add Staff Member</button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {staff.map(member => {
                const memberStatus: string = member.status || 'active';
                const isSelf = Boolean(member.userId && member.userId === currentUser?.id);
                const isOwnerRow = member.role === 'owner';
                const canToggle = canManageStaff && !isSelf && (isOwnerRow ? canSetOwnerRole : true);
                const statusStyle = memberStatus === 'active'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : memberStatus === 'deactivated'
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/40';
                return (
                  <div key={member.id} className="p-5 rounded-2xl bg-ink border border-gold space-y-3 text-center shadow-lg">
                    <img src={member.avatar} alt={member.name} className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-gold" />
                    <div>
                      <h4 className="font-bold text-base text-white">{member.name}</h4>
                      <p className="text-xs text-gold">{STAFF_ROLE_LABEL[member.role as StaffRole] || member.role}</p>
                      {member.email && <p className="text-[10px] text-white/40 truncate">{member.email}</p>}
                    </div>
                    <div>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${statusStyle}`}>{STAFF_STATUS_LABEL[memberStatus as any] || memberStatus}</span>
                      {isSelf && <span className="inline-block ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gold text-ink">You</span>}
                    </div>
                    <div className="text-xs text-white/70 space-y-1 bg-panel p-2.5 rounded-xl">
                      <div>Specialty: <strong>{member.specialization || member.specialty || 'General'}</strong></div>
                      <div>Active Assigned Jobs: <strong className="text-gold">{member.activeJobs}</strong></div>
                      <div>Rating: ⭐ {member.rating} / 5.0</div>
                    </div>
                    {canToggle && (
                      <div className="pt-1">
                        {memberStatus === 'deactivated' ? (
                          <button onClick={() => handleStaffReactivate(member.id)} className="w-full py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500 hover:text-white text-[11px] font-black flex items-center justify-center gap-1.5 transition-colors"><PowerOff className="w-3 h-3" /> Reactivate</button>
                        ) : (
                          <button onClick={() => handleStaffDeactivate(member.id)} className="w-full py-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 hover:bg-rose-500 hover:text-white text-[11px] font-black flex items-center justify-center gap-1.5 transition-colors"><Power className="w-3 h-3" /> Deactivate</button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {adminTab === 'payments' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="p-6 rounded-3xl bg-ink-deep border-2 border-mpesa flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-mpesa flex items-center justify-center text-white font-black text-sm shadow">M-PESA</div>
                <div>
                  <h3 className="text-xl font-bold text-white font-display">M-Pesa payments</h3>
                  <p className="text-xs text-emerald-400">Payments received through Safaricom</p>
                </div>
              </div>
              <div className="text-right"><span className="text-xs text-white/60 block uppercase">Total received</span><span className="text-2xl sm:text-3xl font-black text-whatsapp">KES {totalRevenue.toLocaleString()}</span></div>
            </div>
            <div className="bg-panel rounded-3xl border border-white/10 p-6 space-y-4 shadow-xl">
              <h4 className="font-bold text-sm text-white uppercase tracking-wider">Recent payments</h4>
              <div className="space-y-2 text-xs">
                {transactions.length===0 && <p className="text-white/60 text-center py-8">No payments recorded yet. Completed M-Pesa payments will appear here.</p>}
                {transactions.map((t) => (
                  <div key={t.checkoutRequestId} className="p-3 rounded-xl bg-ink border border-white/5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-emerald-400">{t.receiptNumber || 'Receipt pending'}</span>
                        <span className="text-white font-bold">{t.bookingId || '—'}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${t.status==='SUCCESS'?'bg-emerald-500/20 text-emerald-400':t.status==='FAILED'?'bg-rose-500/20 text-rose-400':'bg-amber-500/20 text-amber-400'}`}>{t.status}</span>
                      </div>
                      <span className="text-[10px] text-white/60">{new Date(t.createdAt).toLocaleDateString()} · {t.phone}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-white block">KES {Number(t.amount).toLocaleString()}</span>
                      <span className="text-[10px] text-white/50">{readableStatus(t.status)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

          </main>
        </div>
      </div>

      {selectedBookingForAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-ink border-2 border-gold rounded-2xl max-w-lg w-full p-6 text-cream shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h4 className="font-bold text-base text-white">Booking #{selectedBookingForAdmin.id}</h4>
              <button onClick={()=>{setSelectedBookingForAdmin(null); setShowAudit(false);}} className="text-white/60 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-2 text-xs">
              <p><strong>Customer:</strong> {selectedBookingForAdmin.customerName} ({selectedBookingForAdmin.customerPhone})</p>
              <p><strong>Vehicle:</strong> {selectedBookingForAdmin.vehicleDetails?.make} {selectedBookingForAdmin.vehicleDetails?.model} ({selectedBookingForAdmin.vehicleDetails?.registrationNo})</p>
              <p><strong>Service:</strong> {selectedBookingForAdmin.serviceName}</p>
              <p><strong>Material:</strong> {selectedBookingForAdmin.customOptions?.material || selectedBookingForAdmin.selectedMaterial || 'Standard'} ({selectedBookingForAdmin.customOptions?.color || 'Selected'})</p>
              <p><strong>Customer Notes:</strong> {selectedBookingForAdmin.notes || selectedBookingForAdmin.requirementsDesc || 'None'}</p>
            </div>

            {selectedBookingForAdmin.referencePhotos && selectedBookingForAdmin.referencePhotos.length > 0 && (
              <div className="pt-2 border-t border-white/10 space-y-2">
                <span className="text-[11px] font-bold text-gold uppercase block">Client Reference Photos</span>
                <div className="grid grid-cols-3 gap-2">
                  {selectedBookingForAdmin.referencePhotos.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block aspect-video rounded-lg overflow-hidden border border-white/20">
                      <img src={url} alt="Client Reference" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {workOrders.find(wo => wo.bookingId === selectedBookingForAdmin.id) && (
              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-white/70">Workshop Job Bay</span>
                <button
                  onClick={() => {
                    const linked = workOrders.find(wo => wo.bookingId === selectedBookingForAdmin.id);
                    if (linked) {
                      setSelectedBookingForAdmin(null);
                      setSelectedWorkOrderForPhotos(linked);
                    }
                  }}
                  className="py-1.5 px-3 rounded-lg bg-gold text-ink font-black text-xs uppercase flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" /> Open Bay Photos
                </button>
              </div>
            )}

            <div className="pt-3 border-t border-white/10">
              <button onClick={()=>setShowAudit(v=>!v)} className="flex items-center gap-1.5 text-xs font-bold text-gold hover:underline"><History className="w-3.5 h-3.5" />{showAudit?'Hide':'Show'} Audit Trail ({auditLogs.length})</button>
              {showAudit && (
                <div className="mt-3 space-y-2 max-h-40 overflow-y-auto bg-panel p-3 rounded-xl border border-white/5">
                  {auditLogs.length===0 && <p className="text-[11px] text-white/50">No audit entries — actions are logged from now on.</p>}
                  {auditLogs.map((log:any)=>(
                    <div key={log.id} className="text-[11px] border-b border-white/5 pb-1.5 last:border-0">
                      <div className="flex justify-between"><span className="font-bold text-white">{log.action}</span><span className="text-white/40">{new Date(log.createdAt).toLocaleString()}</span></div>
                      <div className="text-white/60">{log.actorName} ({log.actorRole}) • {log.ip || '—'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
              <button onClick={()=>{setSelectedBookingForAdmin(null); setShowAudit(false);}} className="py-2 px-4 rounded-xl bg-white/10 text-white font-bold text-xs">Close</button>
            </div>
          </div>
        </div>
      )}

      {selectedWorkOrderForPhotos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-ink border-2 border-gold rounded-2xl max-w-2xl w-full p-6 text-cream shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] text-gold uppercase font-bold tracking-wider">Workshop Bay Inspection & Photos</span>
                <h4 className="font-mono font-bold text-base text-white flex items-center gap-2">
                  {selectedWorkOrderForPhotos.vehicleDisplayName} <span className="text-gold">({selectedWorkOrderForPhotos.id})</span>
                </h4>
              </div>
              <button
                onClick={() => setSelectedWorkOrderForPhotos(null)}
                className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs bg-panel p-3 rounded-xl border border-white/10">
              <div>
                <span className="text-white/60 block text-[10px] uppercase font-bold">Assigned Craftsman</span>
                <span className="font-bold text-white truncate block">{selectedWorkOrderForPhotos.assignedStaffName || 'Unassigned'}</span>
              </div>
              <div>
                <span className="text-white/60 block text-[10px] uppercase font-bold">Stage</span>
                <span className="font-bold text-gold">{selectedWorkOrderForPhotos.stage.replace(/_/g, ' ')}</span>
              </div>
              <div>
                <span className="text-white/60 block text-[10px] uppercase font-bold">Overall Progress</span>
                <span className="font-bold text-white">{selectedWorkOrderForPhotos.progressPercentage}%</span>
              </div>
            </div>

            {/* Section 1: Bay Intake / Before Photos */}
            <div className="p-4 rounded-xl bg-panel border border-white/10 space-y-2">
              <PhotoUploader
                category="work-order-before"
                entityId={selectedWorkOrderForPhotos.id}
                photos={selectedWorkOrderForPhotos.beforePhotos || []}
                onChange={(updated) => {
                  updateWorkOrderPhotos(selectedWorkOrderForPhotos.id, { beforePhotos: updated });
                  setSelectedWorkOrderForPhotos(prev => prev ? { ...prev, beforePhotos: updated } : null);
                }}
                maxPhotos={6}
                title="1. Bay Intake Condition Photos (Before)"
                subtitle="Record existing seat condition, tear points, and initial inspection upon vehicle arrival."
              />
            </div>

            {/* Section 2: Bench Crafting / Progress Photos */}
            <div className="p-4 rounded-xl bg-panel border border-white/10 space-y-2">
              <PhotoUploader
                category="work-order-progress"
                entityId={selectedWorkOrderForPhotos.id}
                photos={selectedWorkOrderForPhotos.progressPhotos || []}
                onChange={(updated) => {
                  updateWorkOrderPhotos(selectedWorkOrderForPhotos.id, { progressPhotos: updated });
                  setSelectedWorkOrderForPhotos(prev => prev ? { ...prev, progressPhotos: updated } : null);
                }}
                maxPhotos={6}
                title="2. Precision Bench Crafting (Work In Progress)"
                subtitle="Capture pattern cutting, leather stitching, foam bolster reinforcements, and assembly."
              />
            </div>

            {/* Section 3: Finished Bay Inspection / After Photos */}
            <div className="p-4 rounded-xl bg-panel border border-white/10 space-y-2">
              <PhotoUploader
                category="work-order-after"
                entityId={selectedWorkOrderForPhotos.id}
                photos={selectedWorkOrderForPhotos.afterPhotos || []}
                onChange={(updated) => {
                  updateWorkOrderPhotos(selectedWorkOrderForPhotos.id, { afterPhotos: updated });
                  setSelectedWorkOrderForPhotos(prev => prev ? { ...prev, afterPhotos: updated } : null);
                }}
                maxPhotos={6}
                title="3. Final Inspection & Delivery Photos (After)"
                subtitle="Completed vehicle interior, final QC sign-off, ready for customer collection."
              />
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
              <button
                onClick={() => setSelectedWorkOrderForPhotos(null)}
                className="py-2 px-5 rounded-xl bg-gold text-ink font-black text-xs uppercase"
              >
                Done Inspecting
              </button>
            </div>
          </div>
        </div>
      )}

      {newStaffTemp && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-ink border-2 border-gold rounded-2xl max-w-md w-full p-6 text-cream shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <div className="w-11 h-11 rounded-2xl bg-gold/10 border border-gold flex items-center justify-center text-gold">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-base text-white">Staff Member Added</h4>
                <p className="text-xs text-white/60">Share this one-time passcode securely (WhatsApp/phone)</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-panel border border-amber-500/40 text-center">
              <span className="block text-[10px] uppercase font-bold text-white/50 mb-1">Temporary sign-in passcode</span>
              <span id="new-staff-temp-password" className="font-mono text-2xl font-black text-gold tracking-widest">{newStaffTemp}</span>
              <p className="text-[11px] text-white/60 mt-2">They must change it on first sign-in. The account starts as <strong className="text-amber-400">Invited</strong>.</p>
            </div>
            <div className="pt-2 flex justify-end">
              <button onClick={() => setNewStaffTemp(null)} className="py-2 px-5 rounded-xl bg-gold text-ink font-black text-xs uppercase">Done</button>
            </div>
          </div>
        </div>
      )}

      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <form onSubmit={handleAddStaff} className="bg-ink border-2 border-gold rounded-2xl max-w-md w-full p-6 text-cream shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h4 className="font-bold text-base text-white">Add Staff Member</h4>
              <button type="button" onClick={() => setShowAddStaffModal(false)} className="text-white/60 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div><label className="block text-white/70 mb-1">Full Name</label><input type="text" required value={newStaffForm.name} onChange={e=>setNewStaffForm(f=>({...f,name:e.target.value}))} placeholder="e.g. James Mwangi" className="w-full py-2 px-3 rounded-lg bg-panel border border-white/20 text-white font-bold" /></div>
              <div><label className="block text-white/70 mb-1">Phone (used for sign-in)</label><input type="tel" required value={newStaffForm.phone} onChange={e=>setNewStaffForm(f=>({...f,phone:e.target.value}))} placeholder="+254 7XX XXX XXX" className="w-full py-2 px-3 rounded-lg bg-panel border border-white/20 text-white font-bold" /></div>
              <div><label className="block text-white/70 mb-1">Email (optional)</label><input type="email" value={newStaffForm.email} onChange={e=>setNewStaffForm(f=>({...f,email:e.target.value}))} placeholder="name@rollingrazors.co.ke" className="w-full py-2 px-3 rounded-lg bg-panel border border-white/20 text-white font-bold" /></div>
              <div>
                <label className="block text-white/70 mb-1">Role</label>
                <select value={newStaffForm.role} onChange={e=>setNewStaffForm(f=>({...f,role:e.target.value as UserRole}))} className="w-full py-2 px-3 rounded-lg bg-panel border border-white/20 text-white font-bold">
                  <option value="craftsman">Craftsman</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="manager">Manager</option>
                  {canSetOwnerRole && <option value="owner">Owner</option>}
                </select>
                <p className="text-[10px] text-white/40 mt-1">Owner role can only be granted by the current owner.</p>
              </div>
              <div><label className="block text-white/70 mb-1">Specialty (optional)</label><input type="text" value={newStaffForm.specialty} onChange={e=>setNewStaffForm(f=>({...f,specialty:e.target.value}))} placeholder="e.g. Leather Seats, Canopies" className="w-full py-2 px-3 rounded-lg bg-panel border border-white/20 text-white font-bold" /></div>
            </div>
            <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
              <button type="button" onClick={() => setShowAddStaffModal(false)} className="py-2 px-4 rounded-xl bg-white/10 text-white font-bold text-xs">Cancel</button>
              <button id="submit-add-staff-btn" type="submit" className="py-2 px-4 rounded-xl bg-gold text-ink font-black text-xs uppercase">Create Staff Account</button>
            </div>
          </form>
        </div>
      )}

      {showAddServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) closeServiceEditor(); }}>
          <form onSubmit={handleSaveService} className="max-h-[92vh] w-full max-w-2xl space-y-5 overflow-y-auto rounded-3xl border border-gold/40 bg-ink p-5 text-cream shadow-2xl sm:p-7">
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-gold">Service catalog</p><h2 className="mt-1 font-display text-2xl font-bold text-white">{editingServiceId ? 'Edit service' : 'Add a service'}</h2><p className="mt-1 text-xs text-cream-muted">These details and photos appear in the customer service catalog.</p></div>
              <button type="button" aria-label="Close service editor" onClick={closeServiceEditor} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-cream-muted transition-colors hover:border-gold hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_1.15fr]">
              <div className="rounded-2xl border border-white/10 bg-panel p-4">
                <PhotoUploader category="service" entityId={editingServiceId || 'new-service'} photos={newServiceImage ? [newServiceImage] : []} onChange={(photos) => setNewServiceImage(photos[0] || '')} maxPhotos={1} title="Service image" subtitle="Upload a clear photo of the finished work." />
                <p className="mt-3 text-[10px] leading-4 text-cream-muted">JPEG, PNG, or WebP · up to 10 MB</p>
              </div>
              <div className="space-y-4">
                <label className="block text-xs font-semibold text-cream-muted">Service name<input type="text" required maxLength={100} value={newServiceName} onChange={(event) => setNewServiceName(event.target.value)} placeholder="e.g. Custom leather seats" className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-panel px-3 text-sm text-white placeholder:text-white/35 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20" /></label>
                <label className="block text-xs font-semibold text-cream-muted">Short description<textarea rows={3} maxLength={500} value={newServiceDesc} onChange={(event) => setNewServiceDesc(event.target.value)} placeholder="Describe the work and what customers can expect." className="mt-2 w-full rounded-xl border border-white/10 bg-panel px-3 py-2.5 text-sm leading-5 text-white placeholder:text-white/35 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20" /></label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-semibold text-cream-muted">Starting price (KES)<input type="number" min="0" step="1" required value={newServicePrice} onChange={(event) => setNewServicePrice(Number(event.target.value))} className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-panel px-3 text-sm text-white focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20" /></label>
                  <label className="block text-xs font-semibold text-cream-muted">Estimated turnaround<input type="text" maxLength={100} value={newServiceDuration} onChange={(event) => setNewServiceDuration(event.target.value)} placeholder="1 - 2 Days" className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-panel px-3 text-sm text-white placeholder:text-white/35 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20" /></label>
                </div>
              </div>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">
              <button type="button" onClick={closeServiceEditor} className="min-h-11 rounded-xl border border-white/15 px-5 text-xs font-bold text-cream transition-colors hover:bg-white/5">Cancel</button>
              <button type="submit" disabled={serviceSaveBusy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gold px-5 text-xs font-black uppercase text-ink transition-colors hover:bg-gold-hover disabled:cursor-wait disabled:opacity-60">{serviceSaveBusy ? 'Saving…' : editingServiceId ? 'Save changes' : 'Publish service'}<ArrowRight className="h-4 w-4" /></button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
