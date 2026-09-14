import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart3, Calendar as CalendarIcon, Car, CheckCircle2, Clock, DollarSign, FileText, Filter, Layers, MapPin, Plus, Scissors, ShieldAlert, Smartphone, Trash2, UserCheck, Users, X, TrendingUp, Search, Check, Phone, ArrowRight, AlertTriangle, History
} from 'lucide-react';
import { Booking, WorkOrder, WorkOrderStage } from '../../types';

export const AdminDashboard: React.FC = () => {
  const {
    currentUser, adminTab, setAdminTab, bookings, updateBookingStatus, workOrders, updateWorkOrderStage, services, addService, staff, customers, addToast, setView, openAuth, authFetch
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedBookingForAdmin, setSelectedBookingForAdmin] = useState<Booking | null>(null);
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
      <div className="min-h-screen pt-32 pb-20 flex items-center justify-center bg-[#073B32] text-[#F5F1E8] px-4">
        <div className="max-w-md w-full bg-[#0B4035] border-2 border-rose-500/40 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500 text-rose-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-white">Workshop Admin Access Restricted</h2>
          <p className="text-xs text-white/70 leading-relaxed">
            This operations hub is strictly restricted to authorized Rolling Razors workshop managers and master craftsmen. RBAC (Casbin) pending — currently single `admin` role.
          </p>
          <div className="pt-2 space-y-2">
            <button onClick={() => openAuth('admin')} className="w-full py-3 rounded-xl bg-[#D6A62E] text-[#073B32] font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer">
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
    <div id="admin-dashboard-container" className="min-h-screen pt-28 pb-20 bg-[#073B32] text-[#F5F1E8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="rr-md-card border-[#D6A62E]/30 p-6 sm:p-8 shadow-2xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#073B32] border-2 border-[#D6A62E] flex items-center justify-center text-[#D6A62E] shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black font-display text-white">Workshop Operations Hub</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-[#D6A62E] text-[#073B32] font-black text-[10px] uppercase">Admin Master</span>
              </div>
              <p className="text-xs text-[#D6A62E] mt-0.5">Rolling Razors Customs • Nairobi Workshop Operations & Kenyan M-Pesa Ledger</p>
              <p className="text-[10px] text-white/50 mt-1">RBAC pending: single admin role — Casbin evaluation planned (reception/manager/craftsman).</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-[#073B32] p-3 rounded-2xl border border-white/10 text-xs">
            <div>
              <span className="text-[10px] text-white/50 block">M-PESA COLLECTED (ledger)</span>
              <span className="text-base font-black text-[#25D366]">KES {totalRevenue.toLocaleString()}</span>
            </div>
            <div className="h-8 w-px bg-white/10 mx-1" />
            <div>
              <span className="text-[10px] text-white/50 block">JOBS IN WORKSHOP</span>
              <span className="text-base font-black text-[#D6A62E]">{inWorkshopCount} Vehicles</span>
            </div>
          </div>
        </div>

        {lowStock.length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-start gap-3 text-xs">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-300">Low Stock Alert — {lowStock.length} items below reorder point</div>
              <div className="text-white/70 mt-1">{lowStock.map((i:any)=>`${i.sku} (${i.qtyOnHand}${i.unit})`).join(', ')}</div>
              <div className="text-[11px] text-white/50 mt-1">Inventory stub: restock before moving to MATERIALS_PREPARED.</div>
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
            <button key={tab.id} onClick={() => setAdminTab(tab.id as any)} className={`min-h-11 px-3.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${adminTab===tab.id ? 'bg-[#D6A62E] text-[#073B32] shadow-sm' : 'text-white/70 hover:text-white hover:bg-white/5'}`}>
              {tab.icon}<span>{tab.label}</span>
            </button>
          ))}
        </div>

        {adminTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-[#0B4035] border border-[#D6A62E]/20 space-y-1">
                <span className="text-[11px] text-white/60 block uppercase font-bold">Total Bookings</span>
                <span className="text-3xl font-black text-white">{bookingsTotal||bookings.length}</span>
                <p className="text-[11px] text-[#D6A62E] flex items-center gap-1"><TrendingUp className="w-3 h-3" /> DB paginated</p>
              </div>
              <div className="p-5 rounded-2xl bg-[#0B4035] border border-[#D6A62E]/20 space-y-1">
                <span className="text-[11px] text-white/60 block uppercase font-bold">Active Jobs in Bays</span>
                <span className="text-3xl font-black text-[#D6A62E]">{inWorkshopCount}</span>
                <p className="text-[11px] text-white/70">8 Workshop Bays Total</p>
              </div>
              <div className="p-5 rounded-2xl bg-[#0B4035] border border-[#D6A62E]/20 space-y-1">
                <span className="text-[11px] text-white/60 block uppercase font-bold">Deposit Revenue (ledger)</span>
                <span className="text-2xl sm:text-3xl font-black text-[#25D366]">KES {totalRevenue.toLocaleString()}</span>
                <p className="text-[11px] text-[#25D366]">Paybill ledger</p>
              </div>
              <div className="p-5 rounded-2xl bg-[#0B4035] border border-[#D6A62E]/20 space-y-1">
                <span className="text-[11px] text-white/60 block uppercase font-bold">Master Craftsmen</span>
                <span className="text-3xl font-black text-purple-400">{staff.length}</span>
                <p className="text-[11px] text-white/70">Upholstery & Canvas</p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 bg-[#0B4035] border border-[#D6A62E]/30 rounded-3xl p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="font-bold text-base text-white font-display flex items-center gap-2"><Scissors className="w-4 h-4 text-[#D6A62E]" /> Live Workshop Floor Activity</h3>
                  <button onClick={() => setAdminTab('kanban')} className="text-xs text-[#D6A62E] font-bold hover:underline">Open Full Board</button>
                </div>
                <div className="space-y-3">
                  {workOrders.slice(0,5).map((wo) => (
                    <div key={wo.id} className="p-4 rounded-xl bg-[#073B32] border border-white/10 flex items-center justify-between gap-4 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#D6A62E]">{wo.id}</span>
                          <span className="text-white font-bold">{wo.vehicleDisplayName}</span>
                        </div>
                        <p className="text-white/70">{wo.serviceName} • Craftsman: {wo.assignedStaffName} • v{(wo as any).version ?? 0}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#D6A62E]/20 text-[#D6A62E] border border-[#D6A62E]/40 font-bold block">{wo.stage.replace(/_/g,' ')}</span>
                        <span className="text-[10px] text-white/50">Progress: {wo.progressPercentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-5 bg-[#0B4035] border border-[#D6A62E]/30 rounded-3xl p-6 space-y-5">
                <h3 className="font-bold text-base text-white font-display border-b border-white/10 pb-3">Pending Driver Requests</h3>
                <div className="space-y-3">
                  {bookings.slice(0,3).map((b) => (
                    <div key={b.id} className="p-3.5 rounded-xl bg-[#073B32] border border-white/5 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{b.customerName}</span>
                        <span className="text-[#D6A62E] font-mono">{b.vehicleDetails?.registrationNo}</span>
                      </div>
                      <p className="text-white/70">{b.serviceName} on {b.appointmentDate}</p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-white/50">{b.paymentMethod==='mpesa' ? 'Lipa na M-Pesa' : 'Pay at Shop'}</span>
                        <button onClick={() => { setSelectedBookingForAdmin(b); setAdminTab('bookings'); }} className="text-xs text-[#D6A62E] font-bold hover:underline">Review & Assign</button>
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
                  <div key={stage.id} className="bg-[#0B4035] rounded-2xl border border-white/10 p-3 space-y-3 flex flex-col min-w-[210px]">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <span className="text-xs font-bold text-white leading-tight">{stage.label}</span>
                      <span className="px-2 py-0.5 rounded-full bg-black/40 text-[11px] font-bold text-[#D6A62E]">{stageOrders.length}</span>
                    </div>
                    <div className="space-y-2.5 flex-1">
                      {stageOrders.map(order => (
                        <div key={order.id} className="p-3.5 rounded-xl bg-[#073B32] border border-[#D6A62E]/30 shadow-md space-y-2 text-xs hover:border-[#D6A62E] transition-all">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[11px] text-[#D6A62E] font-bold">{order.id}</span>
                            <span className="font-mono text-[10px] text-white/60">v{(order as any).version ?? 0}</span>
                          </div>
                          <h5 className="font-bold text-white text-xs leading-tight">{order.vehicleDisplayName}</h5>
                          <p className="text-[11px] text-white/70">{order.serviceName}</p>
                          <div className="text-[10px] text-[#D6A62E] font-medium bg-[#0B4035] p-1.5 rounded-lg border border-white/5">Craftsman: {order.assignedStaffName}</div>
                          <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                            <span className="text-[10px] text-white/50">Next Stage:</span>
                            <select value={order.stage} onChange={(e)=>handleStageChange(order.id, e.target.value as WorkOrderStage, (order as any).version)} className="bg-[#0B4035] border border-white/20 text-white text-[10px] rounded px-1.5 py-0.5 font-bold">
                              <option value="BOOKED">1. Booked</option>
                              <option value="VEHICLE_RECEIVED">2. Received</option>
                              <option value="MATERIALS_PREPARED">3. Prepped</option>
                              <option value="IN_PROGRESS">4. Stitching</option>
                              <option value="QUALITY_CHECK">5. QC Check</option>
                              <option value="READY_FOR_COLLECTION">6. Ready</option>
                              <option value="COLLECTED">7. Collected</option>
                            </select>
                          </div>
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
                  <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search name, phone, plate, ID" className="pl-8 pr-3 py-2 rounded-lg bg-[#0B4035] border border-white/10 text-xs text-white placeholder:text-white/40 w-48" />
                </div>
                {['all','pending','confirmed','in_progress','completed'].map(st => (
                  <button key={st} onClick={()=>setBookingFilterStatus(st)} className={`py-1.5 px-3 rounded-lg text-xs font-bold capitalize transition-all ${bookingFilterStatus===st ? 'bg-[#D6A62E] text-[#073B32]' : 'bg-[#0B4035] text-white/70 hover:text-white'}`}>{st}</button>
                ))}
              </div>
            </div>
            <div className="bg-[#0B4035] rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#F5F1E8]">
                  <thead className="bg-[#073B32] text-[#D6A62E] uppercase font-bold tracking-wider border-b border-white/10">
                    <tr><th className="py-3 px-4">Booking ID</th><th className="py-3 px-4">Customer</th><th className="py-3 px-4">Vehicle</th><th className="py-3 px-4">Service</th><th className="py-3 px-4">Date & Slot</th><th className="py-3 px-4">Deposit</th><th className="py-3 px-4">Status</th><th className="py-3 px-4 text-right">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {displayBookings.map(booking => (
                      <tr key={booking.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#D6A62E]">{booking.id}</td>
                        <td className="py-3.5 px-4"><div className="font-bold text-white">{booking.customerName}</div><div className="text-[11px] text-white/60">{booking.customerPhone}</div></td>
                        <td className="py-3.5 px-4"><div className="font-bold">{booking.vehicleDetails?.make} {booking.vehicleDetails?.model}</div><div className="font-mono text-[11px] text-[#D6A62E]">{booking.vehicleDetails?.registrationNo}</div></td>
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
          <div className="bg-[#0B4035] border border-[#D6A62E]/30 rounded-3xl p-6 sm:p-8 space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div><h3 className="text-xl font-bold text-white font-display">Workshop Weekly Appointment Grid</h3><p className="text-xs text-white/70">Grouped by real appointmentDate.</p></div>
              <span className="px-3 py-1 rounded-full bg-[#073B32] border border-[#D6A62E] text-xs font-bold text-[#D6A62E]">Live Schedule</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from(new Set(bookings.map(b=>b.appointmentDate))).slice(0,6).map((date) => {
                const dayBookings = bookings.filter(b=>b.appointmentDate===date);
                return (
                  <div key={date} className="p-4 rounded-2xl bg-[#073B32] border border-white/10 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <h4 className="font-bold text-sm text-[#D6A62E]">{date}</h4>
                      <span className="text-[10px] text-white/60">{dayBookings.length} bookings</span>
                    </div>
                    <div className="space-y-2">
                      {dayBookings.map(b => (
                        <div key={b.id} className="p-2.5 rounded-xl bg-[#0B4035] border border-[#D6A62E]/20 text-xs space-y-1">
                          <div className="flex items-center justify-between"><span className="font-bold text-white truncate">{b.vehicleDetails?.make} {b.vehicleDetails?.model}</span><span className="font-mono text-[10px] text-[#D6A62E]">{b.appointmentTime}</span></div>
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
              <button id="add-new-service-btn" onClick={()=>setShowAddServiceModal(true)} className="py-2.5 px-4 rounded-xl bg-[#D6A62E] text-[#073B32] font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow"><Plus className="w-3.5 h-3.5" /> Add Service</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map(srv => (
                <div key={srv.id} className="p-5 rounded-2xl bg-[#0B4035] border border-[#D6A62E]/30 shadow-xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between"><h4 className="font-bold text-base text-white">{srv.name}</h4><span className="text-[#D6A62E] font-bold text-xs">KES {srv.startingPrice.toLocaleString()}</span></div>
                    <p className="text-xs text-white/70">{srv.shortDesc}</p>
                    <div className="text-[11px] text-white/50">Estimated Duration: {srv.estimatedDuration}</div>
                  </div>
                  <div className="pt-2 border-t border-white/10 flex justify-between items-center text-xs">
                    <span className="text-[10px] text-emerald-400 font-bold">✓ Active Online</span>
                    <button onClick={()=>addToast('info','Edit Service','Pricing update module opened.')} className="text-[#D6A62E] font-bold hover:underline">Edit Pricing</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {adminTab === 'customers' && (
          <div className="bg-[#0B4035] rounded-3xl border border-white/10 p-6 sm:p-8 space-y-6 animate-in fade-in">
            <h3 className="text-xl font-bold text-white font-display border-b border-white/10 pb-3">Driver & Fleet Directory</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customers.map(c => (
                <div key={c.id} className="p-4 rounded-2xl bg-[#073B32] border border-white/10 space-y-2 text-xs">
                  <div className="flex items-center justify-between"><h4 className="font-bold text-sm text-white">{c.name}</h4><span className="font-mono text-[10px] text-[#D6A62E]">{c.id}</span></div>
                  <p className="text-white/70 flex items-center gap-1"><Phone className="w-3 h-3 text-[#D6A62E]" /> {c.phone}</p>
                  <p className="text-white/70 flex items-center gap-1"><MapPin className="w-3 h-3 text-[#D6A62E]" /> {c.location}</p>
                  <div className="pt-2 border-t border-white/10 flex justify-between text-[11px]"><span className="text-white/50">Total Spent:</span><span className="font-bold text-[#25D366]">KES {c.totalSpent.toLocaleString()}</span></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {adminTab === 'staff' && (
          <div className="bg-[#0B4035] rounded-3xl border border-white/10 p-6 sm:p-8 space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div><h3 className="text-xl font-bold text-white font-display">Workshop Master Craftsmen Team</h3><p className="text-xs text-white/70">Expert leather workers, seat carpenters, and canvas fabricators.</p></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {staff.map(member => (
                <div key={member.id} className="p-5 rounded-2xl bg-[#073B32] border border-[#D6A62E]/30 space-y-3 text-center shadow-lg">
                  <img src={member.avatar} alt={member.name} className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-[#D6A62E]" />
                  <div><h4 className="font-bold text-base text-white">{member.name}</h4><p className="text-xs text-[#D6A62E]">{member.role}</p></div>
                  <div className="text-xs text-white/70 space-y-1 bg-[#0B4035] p-2.5 rounded-xl">
                    <div>Specialty: <strong>{member.specialty}</strong></div>
                    <div>Active Assigned Jobs: <strong className="text-[#D6A62E]">{member.activeJobs}</strong></div>
                    <div>Rating: ⭐ {member.rating} / 5.0</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {adminTab === 'payments' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="p-6 rounded-3xl bg-[#052822] border-2 border-[#00A859]/50 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#00A859] flex items-center justify-center text-white font-black text-sm shadow">M-PESA</div>
                <div>
                  <h3 className="text-xl font-bold text-white font-display">Lipa na M-Pesa Business Ledger (Source of Truth)</h3>
                  <p className="text-xs text-emerald-400">Paybill via Daraja transactions — not derived from bookings</p>
                </div>
              </div>
              <div className="text-right"><span className="text-xs text-white/60 block uppercase">Settled In Ledger</span><span className="text-2xl sm:text-3xl font-black text-[#25D366]">KES {totalRevenue.toLocaleString()}</span></div>
            </div>
            <div className="bg-[#0B4035] rounded-3xl border border-white/10 p-6 space-y-4 shadow-xl">
              <h4 className="font-bold text-sm text-white uppercase tracking-wider">Recent Safaricom STK Transactions (paginated)</h4>
              <div className="space-y-2 text-xs">
                {transactions.length===0 && <p className="text-white/50 text-center py-4">No transactions yet — ledger is live. Bookings without STK show Pending.</p>}
                {transactions.map((t) => (
                  <div key={t.checkoutRequestId} className="p-3 rounded-xl bg-[#073B32] border border-white/5 flex items-center justify-between">
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
          <div className="bg-[#073B32] border-2 border-[#D6A62E]/50 rounded-2xl max-w-lg w-full p-6 text-[#F5F1E8] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
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
            <div className="pt-3 border-t border-white/10">
              <button onClick={()=>setShowAudit(v=>!v)} className="flex items-center gap-1.5 text-xs font-bold text-[#D6A62E] hover:underline"><History className="w-3.5 h-3.5" />{showAudit?'Hide':'Show'} Audit Trail ({auditLogs.length})</button>
              {showAudit && (
                <div className="mt-3 space-y-2 max-h-40 overflow-y-auto bg-[#0B4035] p-3 rounded-xl border border-white/5">
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

      {showAddServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <form onSubmit={handleSaveService} className="bg-[#073B32] border-2 border-[#D6A62E]/50 rounded-2xl max-w-md w-full p-6 text-[#F5F1E8] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h4 className="font-bold text-base text-white">Add New Workshop Service</h4>
              <button type="button" onClick={()=>setShowAddServiceModal(false)} className="text-white/60 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div><label className="block text-white/70 mb-1">Service Title</label><input type="text" required value={newServiceName} onChange={e=>setNewServiceName(e.target.value)} placeholder="e.g. Dashboard Leather Wrap" className="w-full py-2 px-3 rounded-lg bg-[#0B4035] border border-white/20 text-white font-bold" /></div>
              <div><label className="block text-white/70 mb-1">Starting Price (KES)</label><input type="number" required value={newServicePrice} onChange={e=>setNewServicePrice(Number(e.target.value))} className="w-full py-2 px-3 rounded-lg bg-[#0B4035] border border-white/20 text-white font-bold" /></div>
              <div><label className="block text-white/70 mb-1">Estimated Turnaround</label><input type="text" value={newServiceDuration} onChange={e=>setNewServiceDuration(e.target.value)} placeholder="1 - 2 Days" className="w-full py-2 px-3 rounded-lg bg-[#0B4035] border border-white/20 text-white font-bold" /></div>
              <div><label className="block text-white/70 mb-1">Description</label><textarea rows={2} value={newServiceDesc} onChange={e=>setNewServiceDesc(e.target.value)} placeholder="Service scope..." className="w-full py-2 px-3 rounded-lg bg-[#0B4035] border border-white/20 text-white" /></div>
            </div>
            <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
              <button type="button" onClick={()=>setShowAddServiceModal(false)} className="py-2 px-4 rounded-xl bg-white/10 text-white font-bold text-xs">Cancel</button>
              <button type="submit" className="py-2 px-4 rounded-xl bg-[#D6A62E] text-[#073B32] font-black text-xs uppercase">Publish Service</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
