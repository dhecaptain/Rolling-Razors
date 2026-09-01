import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Service, 
  Booking, 
  WorkOrder, 
  Customer, 
  Staff, 
  Invoice, 
  PortfolioItem, 
  Review, 
  AppNotification, 
  Vehicle,
  UserRole,
  BookingStatus,
  WorkOrderStage,
  PaymentStatus
} from '../types';
import { 
  INITIAL_SERVICES, 
  INITIAL_BOOKINGS, 
  INITIAL_WORK_ORDERS, 
  INITIAL_CUSTOMERS, 
  INITIAL_STAFF, 
  INITIAL_INVOICES, 
  INITIAL_PORTFOLIO, 
  INITIAL_REVIEWS, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_VEHICLES 
} from '../data/mockData';

export type AppView = 'website' | 'booking' | 'customer_dashboard' | 'admin_dashboard' | 'auth';

export interface ToastItem {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
}

export interface MpesaPromptState {
  isOpen: boolean;
  phone: string;
  amount: number;
  bookingId?: string;
  invoiceId?: string;
  onSuccess?: (receiptCode: string) => void;
}

interface AppContextType {
  // Navigation & View
  view: AppView;
  setView: (view: AppView) => void;
  customerTab: string;
  setCustomerTab: (tab: string) => void;
  adminTab: string;
  setAdminTab: (tab: string) => void;
  websiteSection: string;
  setWebsiteSection: (section: string) => void;
  
  // Auth state
  role: UserRole;
  setRole: (role: UserRole) => void;
  isLoggedIn: boolean;
  currentUser: {
    id: string;
    name: string;
    phone: string;
    email: string;
    role: UserRole;
    avatar: string;
  };
  loginAsCustomer: () => void;
  loginAsAdmin: () => void;
  logout: () => void;
  
  // Data Collections
  services: Service[];
  bookings: Booking[];
  workOrders: WorkOrder[];
  customers: Customer[];
  staff: Staff[];
  invoices: Invoice[];
  portfolio: PortfolioItem[];
  reviews: Review[];
  notifications: AppNotification[];
  vehicles: Vehicle[];
  
  // Actions
  addBooking: (bookingData: Omit<Booking, 'id' | 'createdAt' | 'timeline' | 'workOrderId'>) => Booking;
  updateBookingStatus: (bookingId: string, status: BookingStatus, note?: string) => void;
  rescheduleBooking: (bookingId: string, date: string, time: string) => void;
  cancelBooking: (bookingId: string, reason?: string) => void;
  assignStaffToBooking: (bookingId: string, staffId: string) => void;
  
  // Work order actions
  updateWorkOrderStage: (workOrderId: string, stage: WorkOrderStage) => void;
  addWorkOrderNote: (workOrderId: string, note: string) => void;
  
  // Vehicle actions
  addVehicle: (vehicle: Omit<Vehicle, 'id' | 'previousServicesCount'>) => void;
  deleteVehicle: (id: string) => void;
  
  // Service actions
  updateServicePrice: (serviceId: string, price: number) => void;
  toggleServiceAvailability: (serviceId: string) => void;
  
  // Invoice actions
  generateInvoiceForBooking: (bookingId: string) => Invoice;
  
  // Notifications
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: (recipientType?: 'customer' | 'admin') => void;
  unreadCount: { customer: number; admin: number };
  
  // M-Pesa Integration
  mpesaPrompt: MpesaPromptState;
  openMpesaPayment: (
    phoneOrParams: string | { phone?: string; amount: number; bookingId?: string; invoiceId?: string; onSuccess?: (code: string) => void },
    amount?: number,
    bookingId?: string,
    invoiceId?: string,
    onSuccess?: (code: string) => void
  ) => void;
  closeMpesaPayment: () => void;
  addService: (serviceData: Omit<Service, 'id'>) => void;
  
  // Toast notifications
  toasts: ToastItem[];
  addToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
  removeToast: (id: string) => void;

  // Selected item modaling
  selectedBookingId: string | null;
  setSelectedBookingId: (id: string | null) => void;
  selectedServiceId: string | null;
  setSelectedServiceId: (id: string | null) => void;
  selectedWorkOrderId: string | null;
  setSelectedWorkOrderId: (id: string | null) => void;
  bookingWizardInitialServiceId: string | null;
  setBookingWizardInitialServiceId: (id: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [view, setView] = useState<AppView>('website');
  const [customerTab, setCustomerTab] = useState<string>('dashboard');
  const [adminTab, setAdminTab] = useState<string>('overview');
  const [websiteSection, setWebsiteSection] = useState<string>('hero');
  const [role, setRole] = useState<UserRole>('customer');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  
  const [currentUser, setCurrentUser] = useState({
    id: 'cust-1',
    name: 'Brian Mwangi',
    phone: '+254 712 901 234',
    email: 'brian.mwangi@gmail.com',
    role: 'customer' as UserRole,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
  });

  // Main collections with initial state
  const [services, setServices] = useState<Service[]>(() => {
    const saved = localStorage.getItem('rr_services');
    return saved ? JSON.parse(saved) : INITIAL_SERVICES;
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem('rr_bookings');
    return saved ? JSON.parse(saved) : INITIAL_BOOKINGS;
  });

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(() => {
    const saved = localStorage.getItem('rr_work_orders');
    return saved ? JSON.parse(saved) : INITIAL_WORK_ORDERS;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('rr_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [staff, setStaff] = useState<Staff[]>(() => {
    const saved = localStorage.getItem('rr_staff');
    return saved ? JSON.parse(saved) : INITIAL_STAFF;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('rr_invoices');
    return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });

  const [portfolio] = useState<PortfolioItem[]>(INITIAL_PORTFOLIO);
  const [reviews] = useState<Review[]>(INITIAL_REVIEWS);

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('rr_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem('rr_vehicles');
    return saved ? JSON.parse(saved) : INITIAL_VEHICLES;
  });

  // Modals & Selection states
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string | null>(null);
  const [bookingWizardInitialServiceId, setBookingWizardInitialServiceId] = useState<string | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // M-Pesa STK Prompt state
  const [mpesaPrompt, setMpesaPrompt] = useState<MpesaPromptState>({
    isOpen: false,
    phone: '+254712901234',
    amount: 5000
  });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('rr_services', JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem('rr_bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('rr_work_orders', JSON.stringify(workOrders));
  }, [workOrders]);

  useEffect(() => {
    localStorage.setItem('rr_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('rr_vehicles', JSON.stringify(vehicles));
  }, [vehicles]);

  useEffect(() => {
    localStorage.setItem('rr_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('rr_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const addToast = (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => {
    const id = 'toast_' + Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const loginAsCustomer = () => {
    setRole('customer');
    setIsLoggedIn(true);
    setCurrentUser({
      id: 'cust-1',
      name: 'Brian Mwangi',
      phone: '+254 712 901 234',
      email: 'brian.mwangi@gmail.com',
      role: 'customer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
    });
    setView('customer_dashboard');
    addToast('success', 'Welcome back, Brian!', 'Logged into Rolling Razors Driver Portal.');
  };

  const loginAsAdmin = () => {
    setRole('admin');
    setIsLoggedIn(true);
    setCurrentUser({
      id: 'staff-1',
      name: 'James Kimani (Owner)',
      phone: '+254 712 345 678',
      email: 'james@rollingrazors.co.ke',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
    });
    setView('admin_dashboard');
    addToast('info', 'Admin Access Active', 'Logged into Rolling Razors Workshop Operations Hub.');
  };

  const logout = () => {
    setIsLoggedIn(false);
    setView('website');
    addToast('info', 'Logged Out', 'You have been safely signed out.');
  };

  const openMpesaPayment = (
    phoneOrParams: string | { phone?: string; amount: number; bookingId?: string; invoiceId?: string; onSuccess?: (code: string) => void },
    amount?: number,
    bookingId?: string,
    invoiceId?: string,
    onSuccess?: (code: string) => void
  ) => {
    let resolvedPhone = '+254 712 345 678';
    let resolvedAmount = 5000;
    let resolvedBookingId = bookingId;
    let resolvedInvoiceId = invoiceId;
    let resolvedOnSuccess = onSuccess;

    if (typeof phoneOrParams === 'object') {
      resolvedPhone = phoneOrParams.phone || resolvedPhone;
      resolvedAmount = phoneOrParams.amount;
      resolvedBookingId = phoneOrParams.bookingId;
      resolvedInvoiceId = phoneOrParams.invoiceId;
      resolvedOnSuccess = phoneOrParams.onSuccess;
    } else {
      resolvedPhone = phoneOrParams;
      resolvedAmount = amount || 5000;
    }

    const formattedPhone = resolvedPhone.startsWith('+254') ? resolvedPhone : `+254${resolvedPhone.replace(/^0/, '')}`;

    setMpesaPrompt({
      isOpen: true,
      phone: formattedPhone,
      amount: resolvedAmount,
      bookingId: resolvedBookingId,
      invoiceId: resolvedInvoiceId,
      onSuccess: resolvedOnSuccess
    });
  };

  const addService = (serviceData: Omit<Service, 'id'>) => {
    const id = 'srv-' + (services.length + 1);
    const newService: Service = {
      ...serviceData,
      id
    };
    setServices(prev => [...prev, newService]);
  };

  const closeMpesaPayment = () => {
    setMpesaPrompt(prev => ({ ...prev, isOpen: false }));
  };

  const addBooking = (bookingData: Omit<Booking, 'id' | 'createdAt' | 'timeline' | 'workOrderId'>): Booking => {
    const nextNum = Math.floor(1000 + Math.random() * 9000);
    const bookingId = `RR-${nextNum}`;
    const workOrderId = `RR-WO-${nextNum + 1000}`;
    const now = new Date();
    const nowStr = now.toISOString();
    const formattedNow = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newBooking: Booking = {
      ...bookingData,
      id: bookingId,
      workOrderId,
      createdAt: nowStr,
      timeline: [
        {
          status: bookingData.status,
          timestamp: formattedNow,
          title: 'Booking Created',
          note: `Appointment requested for ${bookingData.vehicleDetails.make} ${bookingData.vehicleDetails.model} (${bookingData.vehicleDetails.registrationNo}).`,
          updatedBy: bookingData.customerName
        }
      ]
    };

    // Also automatically create corresponding Work Order
    const newWorkOrder: WorkOrder = {
      id: workOrderId,
      bookingId: bookingId,
      customerName: bookingData.customerName,
      customerPhone: bookingData.customerPhone,
      vehicleTitle: `${bookingData.vehicleDetails.make} ${bookingData.vehicleDetails.model} (${bookingData.vehicleDetails.year})`,
      registrationNo: bookingData.vehicleDetails.registrationNo,
      serviceName: bookingData.serviceName,
      assignedCraftsman: 'John Mwangi',
      priority: 'Normal',
      stage: 'NEW',
      customerRequirements: bookingData.requirementsDesc || 'Standard custom upholstery package',
      materialsRequired: ['Automotive Leather / Vinyl', 'High Density Foam', 'Bonded Thread'],
      estimatedCost: bookingData.estimatedPrice,
      actualCost: bookingData.estimatedPrice,
      beforePhotos: bookingData.referencePhotos || [],
      progressPhotos: [],
      afterPhotos: [],
      internalNotes: `Auto-generated from booking ${bookingId}. Preferred date: ${bookingData.appointmentDate} at ${bookingData.appointmentTime}`,
      progressPercentage: 10,
      createdAt: now.toISOString().split('T')[0],
      targetCompletionDate: bookingData.appointmentDate
    };

    setBookings(prev => [newBooking, ...prev]);
    setWorkOrders(prev => [newWorkOrder, ...prev]);

    // Create notifications for both customer and admin
    const newNotifCustomer: AppNotification = {
      id: 'notif_' + Math.random().toString(36).substring(2, 9),
      recipientType: 'customer',
      title: 'Booking Confirmed!',
      message: `Your booking #${bookingId} for ${bookingData.serviceName} has been received.`,
      timestamp: 'Just now',
      isRead: false,
      type: 'booking',
      relatedBookingId: bookingId
    };

    const newNotifAdmin: AppNotification = {
      id: 'notif_' + Math.random().toString(36).substring(2, 9),
      recipientType: 'admin',
      title: 'New Booking Received',
      message: `${bookingData.customerName} booked ${bookingData.serviceName} (${bookingData.vehicleDetails.registrationNo}).`,
      timestamp: 'Just now',
      isRead: false,
      type: 'booking',
      relatedBookingId: bookingId
    };

    setNotifications(prev => [newNotifCustomer, newNotifAdmin, ...prev]);
    addToast('success', 'Booking Confirmed!', `Your booking #${bookingId} has been successfully scheduled.`);

    return newBooking;
  };

  const updateBookingStatus = (bookingId: string, newStatus: BookingStatus, note?: string) => {
    const now = new Date();
    const formattedNow = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    
    setBookings(prev => prev.map(b => {
      if (b.id !== bookingId) return b;
      
      const updatedTimeline = [
        ...b.timeline,
        {
          status: newStatus,
          timestamp: formattedNow,
          title: `Status changed to ${newStatus.replace('_', ' ').toUpperCase()}`,
          note: note || `Updated by workshop admin`,
          updatedBy: 'Workshop Admin'
        }
      ];

      return {
        ...b,
        status: newStatus,
        timeline: updatedTimeline
      };
    }));

    // Update corresponding work order stage if applicable
    const stageMap: Record<BookingStatus, WorkOrderStage | null> = {
      pending: 'NEW',
      confirmed: 'CONFIRMED',
      checked_in: 'VEHICLE_RECEIVED',
      in_progress: 'IN_PROGRESS',
      quality_check: 'QUALITY_CHECK',
      ready: 'READY',
      completed: 'COMPLETED',
      cancelled: null
    };

    const mappedStage = stageMap[newStatus];
    if (mappedStage) {
      setWorkOrders(prev => prev.map(wo => {
        if (wo.bookingId === bookingId) {
          const progressMap: Partial<Record<WorkOrderStage, number>> = {
            NEW: 10,
            booked: 10,
            CONFIRMED: 25,
            VEHICLE_RECEIVED: 40,
            vehicle_received: 40,
            MATERIALS_PREPARED: 50,
            materials_prepared: 50,
            IN_PROGRESS: 65,
            in_progress: 65,
            QUALITY_CHECK: 85,
            quality_check: 85,
            READY: 95,
            ready_for_pickup: 95,
            COMPLETED: 100,
            collected: 100
          };
          return {
            ...wo,
            stage: mappedStage,
            progressPercentage: progressMap[mappedStage] || wo.progressPercentage
          };
        }
        return wo;
      }));
    }

    addToast('info', 'Booking Updated', `Booking #${bookingId} updated to ${newStatus.replace('_', ' ')}.`);
  };

  const rescheduleBooking = (bookingId: string, newDate: string, newTime: string) => {
    const now = new Date();
    const formattedNow = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    setBookings(prev => prev.map(b => {
      if (b.id !== bookingId) return b;
      return {
        ...b,
        appointmentDate: newDate,
        appointmentTime: newTime,
        timeline: [
          ...b.timeline,
          {
            status: b.status,
            timestamp: formattedNow,
            title: 'Appointment Rescheduled',
            note: `Rescheduled to ${newDate} at ${newTime}`,
            updatedBy: currentUser.name
          }
        ]
      };
    }));
    addToast('success', 'Appointment Rescheduled', `New appointment set for ${newDate} at ${newTime}.`);
  };

  const cancelBooking = (bookingId: string, reason?: string) => {
    const now = new Date();
    const formattedNow = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    setBookings(prev => prev.map(b => {
      if (b.id !== bookingId) return b;
      return {
        ...b,
        status: 'cancelled',
        timeline: [
          ...b.timeline,
          {
            status: 'cancelled',
            timestamp: formattedNow,
            title: 'Booking Cancelled',
            note: reason || 'Cancelled by user request',
            updatedBy: currentUser.name
          }
        ]
      };
    }));
    addToast('warning', 'Booking Cancelled', `Booking #${bookingId} has been marked as cancelled.`);
  };

  const assignStaffToBooking = (bookingId: string, staffId: string) => {
    const assignedStaff = staff.find(s => s.id === staffId);
    if (!assignedStaff) return;

    setBookings(prev => prev.map(b => {
      if (b.id !== bookingId) return b;
      return {
        ...b,
        assignedStaffId: staffId,
        assignedStaffName: assignedStaff.name
      };
    }));

    setWorkOrders(prev => prev.map(wo => {
      if (wo.bookingId === bookingId) {
        return {
          ...wo,
          assignedCraftsman: assignedStaff.name
        };
      }
      return wo;
    }));

    addToast('success', 'Staff Assigned', `Assigned ${assignedStaff.name} to booking #${bookingId}.`);
  };

  const updateWorkOrderStage = (workOrderId: string, stage: WorkOrderStage) => {
    const progressMap: Partial<Record<WorkOrderStage, number>> = {
      NEW: 10,
      booked: 10,
      CONFIRMED: 25,
      VEHICLE_RECEIVED: 40,
      vehicle_received: 40,
      MATERIALS_PREPARED: 50,
      materials_prepared: 50,
      IN_PROGRESS: 65,
      in_progress: 65,
      QUALITY_CHECK: 85,
      quality_check: 85,
      READY: 95,
      ready_for_pickup: 95,
      COMPLETED: 100,
      collected: 100
    };

    setWorkOrders(prev => prev.map(wo => {
      if (wo.id !== workOrderId) return wo;
      return {
        ...wo,
        stage,
        progressPercentage: progressMap[stage] || wo.progressPercentage
      };
    }));

    // Find linked booking
    const linkedWo = workOrders.find(w => w.id === workOrderId);
    if (linkedWo && linkedWo.bookingId) {
      const statusMap: Partial<Record<WorkOrderStage, BookingStatus>> = {
        NEW: 'pending',
        booked: 'pending',
        CONFIRMED: 'confirmed',
        VEHICLE_RECEIVED: 'checked_in',
        vehicle_received: 'checked_in',
        MATERIALS_PREPARED: 'in_progress',
        materials_prepared: 'in_progress',
        IN_PROGRESS: 'in_progress',
        in_progress: 'in_progress',
        QUALITY_CHECK: 'quality_check',
        quality_check: 'quality_check',
        READY: 'ready',
        ready_for_pickup: 'ready',
        COMPLETED: 'completed',
        collected: 'completed'
      };
      
      const newBookingStatus = statusMap[stage];
      if (newBookingStatus) {
        updateBookingStatus(linkedWo.bookingId, newBookingStatus, `Progress updated in workshop to ${stage.replace('_', ' ')}`);
      }
    }
  };

  const addWorkOrderNote = (workOrderId: string, note: string) => {
    setWorkOrders(prev => prev.map(wo => {
      if (wo.id !== workOrderId) return wo;
      return {
        ...wo,
        internalNotes: `${wo.internalNotes}\n[${new Date().toLocaleDateString()}] ${note}`
      };
    }));
    addToast('info', 'Work Order Note Added', 'Internal note saved.');
  };

  const addVehicle = (vehicleData: Omit<Vehicle, 'id' | 'previousServicesCount'>) => {
    const newVehicle: Vehicle = {
      ...vehicleData,
      id: 'veh_' + Math.random().toString(36).substring(2, 9),
      previousServicesCount: 0
    };
    setVehicles(prev => [newVehicle, ...prev]);
    addToast('success', 'Vehicle Added', `${vehicleData.make} ${vehicleData.model} (${vehicleData.registrationNo}) added to your garage.`);
  };

  const deleteVehicle = (id: string) => {
    setVehicles(prev => prev.filter(v => v.id !== id));
    addToast('info', 'Vehicle Removed', 'Vehicle has been removed from saved vehicles.');
  };

  const updateServicePrice = (serviceId: string, price: number) => {
    setServices(prev => prev.map(s => s.id === serviceId ? { ...s, startingPrice: price } : s));
    addToast('success', 'Price Updated', `Service base pricing updated to KES ${price.toLocaleString()}.`);
  };

  const toggleServiceAvailability = (serviceId: string) => {
    setServices(prev => prev.map(s => s.id === serviceId ? { ...s, isFeatured: !s.isFeatured } : s));
  };

  const generateInvoiceForBooking = (bookingId: string): Invoice => {
    const booking = bookings.find(b => b.id === bookingId);
    const invoiceId = `RR-INV-${Math.floor(2000 + Math.random() * 8000)}`;
    const now = new Date().toISOString().split('T')[0];
    
    const newInvoice: Invoice = {
      id: invoiceId,
      bookingId: bookingId,
      workOrderId: booking?.workOrderId,
      customerName: booking?.customerName || 'Customer',
      customerPhone: booking?.customerPhone || '',
      customerEmail: booking?.customerEmail || '',
      vehicleInfo: booking ? `${booking.vehicleDetails.make} ${booking.vehicleDetails.model} (${booking.vehicleDetails.registrationNo})` : 'Vehicle',
      serviceName: booking?.serviceName || 'Custom Upholstery Service',
      items: [
        {
          description: `${booking?.serviceName || 'Service'} - Premium Materials & Handcrafting`,
          quantity: 1,
          unitPrice: booking?.estimatedPrice || 15000,
          amount: booking?.estimatedPrice || 15000
        }
      ],
      subtotal: booking?.estimatedPrice || 15000,
      depositPaid: booking?.depositAmount || 0,
      balanceDue: booking?.balanceAmount || 0,
      total: booking?.estimatedPrice || 15000,
      paymentMethod: booking?.paymentMethod || 'M-Pesa',
      paymentStatus: (booking?.balanceAmount || 0) === 0 ? 'Paid' : 'Deposit Paid',
      mpesaRef: booking?.mpesaReceiptNo || 'MP' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      issueDate: now,
      dueDate: booking?.appointmentDate || now
    };

    setInvoices(prev => [newInvoice, ...prev]);
    addToast('success', 'Invoice Generated', `Invoice #${invoiceId} has been created.`);
    return newInvoice;
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllNotificationsAsRead = (recipientType?: 'customer' | 'admin') => {
    setNotifications(prev => prev.map(n => {
      if (!recipientType || n.recipientType === recipientType || n.recipientType === 'all') {
        return { ...n, isRead: true };
      }
      return n;
    }));
  };

  const unreadCount = {
    customer: notifications.filter(n => !n.isRead && (n.recipientType === 'customer' || n.recipientType === 'all')).length,
    admin: notifications.filter(n => !n.isRead && (n.recipientType === 'admin' || n.recipientType === 'all')).length
  };

  return (
    <AppContext.Provider
      value={{
        view,
        setView,
        customerTab,
        setCustomerTab,
        adminTab,
        setAdminTab,
        websiteSection,
        setWebsiteSection,
        role,
        setRole,
        isLoggedIn,
        currentUser,
        loginAsCustomer,
        loginAsAdmin,
        logout,
        services,
        bookings,
        workOrders,
        customers,
        staff,
        invoices,
        portfolio,
        reviews,
        notifications,
        vehicles,
        addBooking,
        updateBookingStatus,
        rescheduleBooking,
        cancelBooking,
        assignStaffToBooking,
        updateWorkOrderStage,
        addWorkOrderNote,
        addVehicle,
        deleteVehicle,
        addService,
        updateServicePrice,
        toggleServiceAvailability,
        generateInvoiceForBooking,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        unreadCount,
        mpesaPrompt,
        openMpesaPayment,
        closeMpesaPayment,
        toasts,
        addToast,
        removeToast,
        selectedBookingId,
        setSelectedBookingId,
        selectedServiceId,
        setSelectedServiceId,
        selectedWorkOrderId,
        setSelectedWorkOrderId,
        bookingWizardInitialServiceId,
        setBookingWizardInitialServiceId
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
