import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart3, Calendar as CalendarIcon, Car, CheckCircle2, Clock, DollarSign, FileText, Filter, Layers, MapPin, Plus, Scissors, ShieldAlert, Smartphone, Trash2, UserCheck, Users, X, TrendingUp, Search, Check, Phone, ArrowRight, AlertTriangle, History, Camera
} from 'lucide-react';
import { Booking, WorkOrder, WorkOrderStage } from '../../types';
import { PhotoUploader } from '../common/PhotoUploader';

export const AdminDashboard: React.FC = () => {
  const {
    currentUser, adminTab, setAdminTab, bookings, updateBookingStatus, workOrders, updateWorkOrderStage, updateWorkOrderPhotos, services, addService, staff, customers, addToast, setView, openAuth, authFetch
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
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);

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
    authFetch('/api/inventory/low')
      .then(r=>r.json()).then(d=>{ if(d.success) setLowStock(d.lowStock || []); }).catch(()=>{});
  }, [adminTab]);

  useEffect(() => {
    if (!selectedBookingForAdmin) return;
    authFetch(`/api/audit-logs?entityType=Booking&entityId=${selectedBookingForAdmin.id}&limit=20`)
      .then(r=>r.json()).then(d=>{ if(d.success) setAuditLogs(d.logs); else setAuditLogs([]); }).catch(()=>setAuditLogs([]));
  }, [selectedBookingForAdmin]);

  if (!currentUser || currentUser.role !== 'admin') {
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
    addToast('success','Work Order Updated', `Moved to ${newStage.replace(/_/g,' ')}.`);
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName) return;
    addService({
      name: newServiceName,
      shortDesc: newServiceDesc || 'Professional upholstery customization.',
      longDesc: newServiceDesc || 'High quality tailoring for Kenyan vehicles.',
      startingPrice: newServicePrice,
      estimatedDuration: newServiceDuration,
      image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80',
      iconName: 'Scissors',
      includedFeatures: ['Custom measurement', 'High density foam', '1 Year warranty'],
      materialsAvailable: ['Nappa Leather', 'Vinyl', 'Alcantara']
    });
    setShowAddServiceModal(false);
    addToast('success','Service Added', `${newServiceName} is now live on the catalog.`);
  };

  return (
    <div id="admin-dashboard-container" className="min-h-screen pt-28 pb-20 bg-ink text-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="rr-md-card border-gold p-6 sm:p-8 shadow-2xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-ink border-2 border-gold flex items-center justify-center text-gold shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black font-display text-white">Workshop Operations Hub</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-gold text-ink font-black text-[10px] uppercase">Admin Master</span>
              </div>
              <p className="text-xs text-gold mt-0.5">Rolling Razors Customs • Nairobi Workshop Operations & Kenyan M-Pesa Ledger</p>
              <p className="text-[10px] text-white/50 mt-1">Workshop floor access is scoped to authorized staff roles. Operations are audit-logged.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-ink p-3 rounded-2xl border border-white/10 text-xs">
            <div>
              <span className="text-[10px] text-white/50 block">M-PESA COLLECTED (ledger)</span>
              <span className="text-base font-black text-whatsapp">KES {totalRevenue.toLocaleString()}</span>
            </div>
            <div className="h-8 w-px bg-white/10 mx-1" />
            <div>
              <span className="text-[10px] text-white/50 block">JOBS IN WORKSHOP</span>
              <span className="text-base font-black text-gold">{inWorkshopCount} Vehicles</span>
            </div>
          </div>
        </div>

        {lowStock.length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-start gap-3 text-xs">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-300">Low Stock Alert — {lowStock.length} items below reorder point</div>
              <div className="text-white/70 mt-1">{lowStock.map((i:any)=>`${i.sku} (${i.qtyOnHand}${i.unit})`).join(', ')}</div>
              <div className="text-[11px] text-white/50 mt-1">Restock flagged items before moving to MATERIALS_PREPARED.</div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-8 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview & Metrics', icon: <BarChart3 className="w-4 h-4" /> },
            { id: 'kanban', label: 'Work Order Kanban', icon: <Scissors className="w-4 h-4" /> },
            { id: 'bookings', label: `Bookings (${bookingsTotal||bookings.length})`, icon: <FileText className="w-4 h-4" /> },
            { id: 'calendar', label: 'Workshop Schedule', icon: <CalendarIcon className="w-4 h-4" /> },
            { id: 'services', label: `Services (${services.length})`, icon: <Layers className="w-4 h-4" /> },
            { id: 'customers', label: `Customers (${customers.length})`, icon: <Users className="w-4 h-4" /> },
            { id: 'staff', label: `Craftsmen (${staff.length})`, icon: <UserCheck className="w-4 h-4" /> },
            { id: 'payments', label: 'M-Pesa Ledger', icon: <Smartphone className="w-4 h-4" /> }
          ].map(tab => (
            <button key={tab.id} onClick={() => setAdminTab(tab.id as any)} aria-pressed={adminTab===tab.id} className={`min-h-11 px-3.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${adminTab===tab.id ? 'bg-gold text-ink shadow-sm' : 'text-cream-muted hover:text-cream hover:bg-white/5'}`}>
              {tab.icon}<span>{tab.label}</span>
            </button>
          ))}
        </div>

        {adminTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-panel border border-gold space-y-1">
                <span className="text-[11px] text-white/60 block uppercase font-bold">Total Bookings</span>
                <span className="text-3xl font-black text-white">{bookingsTotal||bookings.length}</span>
                <p className="text-[11px] text-gold flex items-center gap-1"><TrendingUp className="w-3 h-3" /> DB paginated</p>
              </div>
              <div className="p-5 rounded-2xl bg-panel border border-gold space-y-1">
                <span className="text-[11px] text-white/60 block uppercase font-bold">Active Jobs in Bays</span>
                <span className="text-3xl font-black text-gold">{inWorkshopCount}</span>
                <p className="text-[11px] text-white/70">8 Workshop Bays Total</p>
              </div>
              <div className="p-5 rounded-2xl bg-panel border border-gold space-y-1">
                <span className="text-[11px] text-white/60 block uppercase font-bold">Deposit Revenue (ledger)</span>
                <span className="text-2xl sm:text-3xl font-black text-whatsapp">KES {totalRevenue.toLocaleString()}</span>
                <p className="text-[11px] text-whatsapp">Paybill ledger</p>
              </div>
              <div className="p-5 rounded-2xl bg-panel border border-gold space-y-1">
                <span className="text-[11px] text-white/60 block uppercase font-bold">Master Craftsmen</span>
                <span className="text-3xl font-black text-purple-400">{staff.length}</span>
                <p className="text-[11px] text-white/70">Upholstery & Canvas</p>
              </div>
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
                        <p className="text-white/70">{wo.serviceName} • Craftsman: {wo.assignedStaffName} • v{(wo as any).version ?? 0}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <span className="px-2.5 py-0.5 rounded-full bg-gold text-gold border border-gold font-bold block">{wo.stage.replace(/_/g,' ')}</span>
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
                <h3 className="text-xl font-bold text-white font-display">Workshop Job Status Board (Kanban)</h3>
                <p className="text-xs text-white/70">Move orders — optimistic lock v0..n, 409 on conflict. Low-stock blocks MATERIALS_PREPARED.</p>
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
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[11px] text-gold font-bold">{order.id}</span>
                            <span className="font-mono text-[10px] text-white/60">v{(order as any).version ?? 0}</span>
                          </div>
                          <h5 className="font-bold text-white text-xs leading-tight">{order.vehicleDisplayName}</h5>
                          <p className="text-[11px] text-white/70">{order.serviceName}</p>
                          <div className="text-[10px] text-gold font-medium bg-panel p-1.5 rounded-lg border border-white/5">Craftsman: {order.assignedStaffName}</div>
                          <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                            <span className="text-[10px] text-white/50">Next Stage:</span>
                            <select value={order.stage} onChange={(e)=>handleStageChange(order.id, e.target.value as WorkOrderStage, (order as any).version)} className="bg-panel border border-white/20 text-white text-[10px] rounded px-1.5 py-0.5 font-bold">
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
                            className="w-full mt-2 py-1 px-2 rounded-lg bg-panel hover:bg-white/10 text-white/80 hover:text-gold text-[10px] font-bold flex items-center justify-center gap-1.5 border border-white/10 transition-colors"
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
                <p className="text-xs text-white/70">Server-paginated, searchable, state-machine enforced.</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-white/40" />
                  <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search name, phone, plate, ID" className="pl-8 pr-3 py-2 rounded-lg bg-panel border border-white/10 text-xs text-white placeholder:text-white/40 w-48" />
                </div>
                {['all','pending','confirmed','in_progress','completed'].map(st => (
                  <button key={st} onClick={()=>setBookingFilterStatus(st)} aria-pressed={bookingFilterStatus===st} className={`py-1.5 px-3 rounded-lg text-xs font-bold capitalize transition-all ${bookingFilterStatus===st ? 'bg-gold text-ink' : 'bg-panel text-cream-muted hover:text-cream'}`}>{st}</button>
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
                        <td className="py-3.5 px-4"><span className="capitalize font-bold text-xs">{booking.status.replace('_',' ')}</span></td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {booking.status==='pending' && (
                              <button onClick={async()=>{
                                const res=await authFetch(`/api/bookings/${booking.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'confirmed'})});
                                const data=await res.json();
                                if(!res.ok) addToast('error','Confirm Failed', data.error||'State transition rejected');
                                else { updateBookingStatus(booking.id,'confirmed','Admin confirmed schedule.'); addToast('success','Booking Confirmed',`Booking ${booking.id} is confirmed.`); }
                              }} className="py-1 px-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px] font-bold hover:bg-emerald-500 hover:text-white">Confirm</button>
                            )}
                            <button onClick={()=>setSelectedBookingForAdmin(booking)} className="py-1 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold">Specs</button>
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
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div><h3 className="text-xl font-bold text-white font-display">Service Catalog & Base Pricing</h3><p className="text-xs text-white/70">Manage upholstery services.</p></div>
              <button id="add-new-service-btn" onClick={()=>setShowAddServiceModal(true)} className="py-2.5 px-4 rounded-xl bg-gold text-ink font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow"><Plus className="w-3.5 h-3.5" /> Add Service</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map(srv => (
                <div key={srv.id} className="p-5 rounded-2xl bg-panel border border-gold shadow-xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between"><h4 className="font-bold text-base text-white">{srv.name}</h4><span className="text-gold font-bold text-xs">KES {srv.startingPrice.toLocaleString()}</span></div>
                    <p className="text-xs text-white/70">{srv.shortDesc}</p>
                    <div className="text-[11px] text-white/50">Estimated Duration: {srv.estimatedDuration}</div>
                  </div>
                  <div className="pt-2 border-t border-white/10 flex justify-between items-center text-xs">
                    <span className="text-[10px] text-emerald-400 font-bold">✓ Active Online</span>
                    <button onClick={()=>addToast('info','Edit Service','Pricing update module opened.')} className="text-gold font-bold hover:underline">Edit Pricing</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div><h3 className="text-xl font-bold text-white font-display">Workshop Master Craftsmen Team</h3><p className="text-xs text-white/70">Expert leather workers, seat carpenters, and canvas fabricators.</p></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {staff.map(member => (
                <div key={member.id} className="p-5 rounded-2xl bg-ink border border-gold space-y-3 text-center shadow-lg">
                  <img src={member.avatar} alt={member.name} className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-gold" />
                  <div><h4 className="font-bold text-base text-white">{member.name}</h4><p className="text-xs text-gold">{member.role}</p></div>
                  <div className="text-xs text-white/70 space-y-1 bg-panel p-2.5 rounded-xl">
                    <div>Specialty: <strong>{member.specialty}</strong></div>
                    <div>Active Assigned Jobs: <strong className="text-gold">{member.activeJobs}</strong></div>
                    <div>Rating: ⭐ {member.rating} / 5.0</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {adminTab === 'payments' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="p-6 rounded-3xl bg-ink-deep border-2 border-mpesa flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-mpesa flex items-center justify-center text-white font-black text-sm shadow">M-PESA</div>
                <div>
                  <h3 className="text-xl font-bold text-white font-display">Lipa na M-Pesa Business Ledger (Source of Truth)</h3>
                  <p className="text-xs text-emerald-400">Paybill via Daraja transactions — not derived from bookings</p>
                </div>
              </div>
              <div className="text-right"><span className="text-xs text-white/60 block uppercase">Settled In Ledger</span><span className="text-2xl sm:text-3xl font-black text-whatsapp">KES {totalRevenue.toLocaleString()}</span></div>
            </div>
            <div className="bg-panel rounded-3xl border border-white/10 p-6 space-y-4 shadow-xl">
              <h4 className="font-bold text-sm text-white uppercase tracking-wider">Recent Safaricom STK Transactions (paginated)</h4>
              <div className="space-y-2 text-xs">
                {transactions.length===0 && <p className="text-white/50 text-center py-4">No transactions yet — ledger is live. Bookings without STK show Pending.</p>}
                {transactions.map((t) => (
                  <div key={t.checkoutRequestId} className="p-3 rounded-xl bg-ink border border-white/5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-emerald-400">{t.receiptNumber || t.checkoutRequestId.slice(0,10)}</span>
                        <span className="text-white font-bold">{t.bookingId || '—'}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${t.status==='SUCCESS'?'bg-emerald-500/20 text-emerald-400':t.status==='FAILED'?'bg-rose-500/20 text-rose-400':'bg-amber-500/20 text-amber-400'}`}>{t.status}</span>
                      </div>
                      <span className="text-[10px] text-white/60">{new Date(t.createdAt).toLocaleDateString()} • {t.phone} • {t.amount.toLocaleString()} KES</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-white block">KES {Number(t.amount).toLocaleString()}</span>
                      <span className="text-[10px] text-white/50">{t.merchantRequestId.slice(0,8)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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

      {showAddServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <form onSubmit={handleSaveService} className="bg-ink border-2 border-gold rounded-2xl max-w-md w-full p-6 text-cream shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h4 className="font-bold text-base text-white">Add New Workshop Service</h4>
              <button type="button" onClick={()=>setShowAddServiceModal(false)} className="text-white/60 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div><label className="block text-white/70 mb-1">Service Title</label><input type="text" required value={newServiceName} onChange={e=>setNewServiceName(e.target.value)} placeholder="e.g. Dashboard Leather Wrap" className="w-full py-2 px-3 rounded-lg bg-panel border border-white/20 text-white font-bold" /></div>
              <div><label className="block text-white/70 mb-1">Starting Price (KES)</label><input type="number" required value={newServicePrice} onChange={e=>setNewServicePrice(Number(e.target.value))} className="w-full py-2 px-3 rounded-lg bg-panel border border-white/20 text-white font-bold" /></div>
              <div><label className="block text-white/70 mb-1">Estimated Turnaround</label><input type="text" value={newServiceDuration} onChange={e=>setNewServiceDuration(e.target.value)} placeholder="1 - 2 Days" className="w-full py-2 px-3 rounded-lg bg-panel border border-white/20 text-white font-bold" /></div>
              <div><label className="block text-white/70 mb-1">Description</label><textarea rows={2} value={newServiceDesc} onChange={e=>setNewServiceDesc(e.target.value)} placeholder="Service scope..." className="w-full py-2 px-3 rounded-lg bg-panel border border-white/20 text-white" /></div>
            </div>
            <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
              <button type="button" onClick={()=>setShowAddServiceModal(false)} className="py-2 px-4 rounded-xl bg-white/10 text-white font-bold text-xs">Cancel</button>
              <button type="submit" className="py-2 px-4 rounded-xl bg-gold text-ink font-black text-xs uppercase">Publish Service</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
