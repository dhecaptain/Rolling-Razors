import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Service, 
  Booking, 
  VehicleDetails,
  WorkOrder, 
  Customer, 
  Staff, 
  Invoice, 
  PortfolioItem, 
  Review, 
  AppNotification, 
  Vehicle,
  User,
  UserRole,
  BookingStatus,
  WorkOrderStage,
  PaymentStatus,
  RecordPaymentParams
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
import { phoneKey, phonesMatch, normalizePhoneKe } from '../utils/phone';
import { useUser, useAuth, useClerk } from '@clerk/react';
import { clerkEnabled } from '../auth/clerkConfig';
import { setAuthToken, getAuthToken } from '../lib/authToken';

export type AppView = 'website' | 'booking' | 'customer_dashboard' | 'admin_dashboard' | 'auth' | 'admin_auth';

/** Centralized role-check helpers. Use these instead of inline `role === 'admin'`. */
export const isStaff = (role: UserRole): boolean => role === 'admin';
export const isCustomer = (role: UserRole): boolean => role === 'customer';
export const canAccessAdmin = (role: UserRole): boolean => isStaff(role);
export const STAFF_VIEWS: AppView[] = ['admin_dashboard', 'admin_auth'];
export const CUSTOMER_VIEWS: AppView[] = ['customer_dashboard'];

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
  
  // Auth state & Token session
  role: UserRole;
  isLoggedIn: boolean;
  currentUser: User | null;
  authInitialMode: 'customer' | 'admin' | 'register';
  setAuthInitialMode: (mode: 'customer' | 'admin' | 'register') => void;
  openAuth: (mode?: 'customer' | 'admin' | 'register') => void;
  loginCustomer: (phone: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  loginAdmin: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  registerCustomer: (data: { name: string; phone: string; email?: string; password?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;

  // Auth provider metadata + authenticated fetch helper
  authProvider: 'clerk' | 'legacy';
  /** True while the auth provider's session is still being resolved server-side. */
  authVerifying: boolean;
  clerkLoaded: boolean;
  authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  
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
  
  // Payment actions
  recordPayment: (params: RecordPaymentParams) => void;

  // Work order actions
  updateWorkOrderStage: (workOrderId: string, stage: WorkOrderStage) => void;
  addWorkOrderNote: (workOrderId: string, note: string) => void;
  
  // Vehicle actions
  addVehicle: (vehicle: Omit<Vehicle, 'id' | 'previousServicesCount'>) => void;
  deleteVehicle: (id: string) => void;
  updateProfile: (patch: Partial<User>) => void;
  
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

  // Legal Modal
  legalModal: { isOpen: boolean; type: 'privacy' | 'terms' | 'refund' };
  openLegalModal: (type?: 'privacy' | 'terms' | 'refund') => void;
  closeLegalModal: () => void;
  setLegalModalType: (type: 'privacy' | 'terms' | 'refund') => void;

  // Selected item modaling
  selectedBookingId: string | null;
  setSelectedBookingId: (id: string | null) => void;
  selectedServiceId: string | null;
  setSelectedServiceId: (id: string | null) => void;
  selectedWorkOrderId: string | null;
  setSelectedWorkOrderId: (id: string | null) => void;
  bookingWizardInitialServiceId: string | null;
  setBookingWizardInitialServiceId: (id: string | null) => void;
  bookingWizardDraft: { vehicleType?: string; preferredDate?: string; preferredTime?: string; locationType?: 'workshop' | 'customer_location'; material?: string; color?: string; pattern?: string } | null;
  setBookingWizardDraft: (d: { vehicleType?: string; preferredDate?: string; preferredTime?: string; locationType?: 'workshop' | 'customer_location'; material?: string; color?: string; pattern?: string } | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface ClerkApi {
  isLoaded: boolean;
  isSignedIn: boolean;
  user: any | null;
  getToken: () => Promise<string | null>;
  signOut: () => Promise<void>;
  openSignIn: (options?: any) => void;
  openSignUp: (options?: any) => void;
}

const AppProviderInner: React.FC<{ children: React.ReactNode; clerk?: ClerkApi }> = ({ children, clerk }) => {
  const clerkMode = Boolean(clerk);
  const [view, setView] = useState<AppView>('website');
  const [customerTab, setCustomerTab] = useState<string>('dashboard');
  const [adminTab, setAdminTab] = useState<string>('overview');
  const [websiteSection, setWebsiteSection] = useState<string>('hero');
  const [authInitialMode, setAuthInitialMode] = useState<'customer' | 'admin' | 'register'>('customer');

  // Verify and load cryptographic JWT session token on boot (legacy provider only;
  // Clerk sessions are resolved from the Clerk SDK + /api/auth/sync).
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (clerkMode) return null;
    const saved = localStorage.getItem('rr_auth_session');
    if (saved) {
      try {
        const session = JSON.parse(saved);
        // UX-optimistic only: the stored identity is re-verified against
        // /api/auth/verify immediately after boot, and the server-returned
        // role is authoritative. Never trust a locally-tampered role.
        if (session && session.user && (!session.expiresAt || session.expiresAt > Date.now())) {
          return session.user;
        }
      } catch {
        localStorage.removeItem('rr_auth_session');
      }
    }
    return null;
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    if (clerkMode) return false;
    const saved = localStorage.getItem('rr_auth_session');
    if (saved) {
      try {
        const session = JSON.parse(saved);
        return Boolean(session?.user && (!session.expiresAt || session.expiresAt > Date.now()));
      } catch {
        return false;
      }
    }
    return false;
  });

  // Legacy boot re-verification. While true, the stored identity (whose role may
  // have been tampered with in localStorage) is being checked against the server.
  // Staff-only views must not render until this completes.
  const [legacyVerifying, setLegacyVerifying] = useState<boolean>(() => {
    if (clerkMode) return false;
    const saved = localStorage.getItem('rr_auth_session');
    if (saved) {
      try {
        const session = JSON.parse(saved);
        return Boolean(session?.token);
      } catch {
        return false;
      }
    }
    return false;
  });

  useEffect(() => {
    if (clerkMode || !legacyVerifying) return;
    let active = true;
    let token: string | null = null;
    try {
      const raw = localStorage.getItem('rr_auth_session');
      if (raw) {
        const s = JSON.parse(raw);
        token = s?.token || null;
      }
    } catch {
      token = null;
    }
    if (!token) {
      localStorage.removeItem('rr_auth_session');
      setCurrentUser(null);
      setIsLoggedIn(false);
      setLegacyVerifying(false);
      return;
    }
    fetch('/api/auth/verify', { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!active) return;
        if (res.ok && data?.valid && data.user) {
          // Authoritative identity + role come from the signature-verified JWT,
          // never from the localStorage copy.
          setAuthToken(token);
          setCurrentUser(data.user);
          setIsLoggedIn(true);
          try {
            const raw = localStorage.getItem('rr_auth_session');
            if (raw) {
              const s = JSON.parse(raw);
              s.user = data.user;
              localStorage.setItem('rr_auth_session', JSON.stringify(s));
            }
          } catch {}
        } else {
          setAuthToken(null);
          localStorage.removeItem('rr_auth_session');
          setCurrentUser(null);
          setIsLoggedIn(false);
        }
      })
      .catch(() => {
        if (!active) return;
        // Network failure: refuse to trust a stored role that could not be
        // re-verified. Treat the user as signed out rather than risk elevation.
        setAuthToken(null);
        localStorage.removeItem('rr_auth_session');
        setCurrentUser(null);
        setIsLoggedIn(false);
      })
      .finally(() => {
        if (active) setLegacyVerifying(false);
      });
    return () => { active = false; };
  }, [clerkMode, legacyVerifying]);

  const role: UserRole = currentUser?.role || 'customer';

  // --- Clerk session synchronization (server-verified via /api/auth/sync) ---
  const clerkUserId = clerk?.user?.id;
  const clerkLoaded = Boolean(clerk?.isLoaded);

  useEffect(() => {
    if (!clerkMode || !clerk || !clerk.isLoaded) return;
    if (!clerk.isSignedIn || !clerk.user) {
      setAuthToken(null);
      setCurrentUser(null);
      setIsLoggedIn(false);
      return;
    }
    let active = true;
    (async () => {
      try {
        const token = await clerk.getToken();
        if (!active) return;
        setAuthToken(token ?? null);
        const res = await fetch('/api/auth/sync', {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: 'include',
        });
        const data = await res.json().catch(() => ({}));
        if (!active) return;
        if (data?.success && data.user) {
          setCurrentUser(data.user);
          setIsLoggedIn(true);
        } else {
          setCurrentUser(null);
          setIsLoggedIn(false);
        }
      } catch {
        if (active) {
          setCurrentUser(null);
          setIsLoggedIn(false);
        }
      }
    })();
    return () => { active = false; };
  }, [clerkMode, clerkLoaded, clerk?.isSignedIn, clerkUserId]);

  // Keep a fresh short-lived Clerk session token available for synchronous header injection.
  useEffect(() => {
    if (!clerkMode || !clerk || !clerk.isLoaded) return;
    if (!clerk.isSignedIn) { setAuthToken(null); return; }
    let active = true;
    const refresh = async () => {
      try { const t = await clerk.getToken(); if (active) setAuthToken(t ?? null); }
      catch { if (active) setAuthToken(null); }
    };
    refresh();
    const id = window.setInterval(refresh, 30_000);
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      active = false;
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [clerkMode, clerkLoaded, clerk?.isSignedIn, clerkUserId]);

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
  const [bookingWizardDraft, setBookingWizardDraft] = useState<{ vehicleType?: string; preferredDate?: string; preferredTime?: string; locationType?: 'workshop' | 'customer_location'; material?: string; color?: string; pattern?: string } | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Legal Modal state
  const [legalModal, setLegalModal] = useState<{ isOpen: boolean; type: 'privacy' | 'terms' | 'refund' }>({
    isOpen: false,
    type: 'privacy'
  });

  const openLegalModal = (type: 'privacy' | 'terms' | 'refund' = 'privacy') => {
    setLegalModal({ isOpen: true, type });
  };

  const closeLegalModal = () => {
    setLegalModal(prev => ({ ...prev, isOpen: false }));
  };

  const setLegalModalType = (type: 'privacy' | 'terms' | 'refund') => {
    setLegalModal(prev => ({ ...prev, type }));
  };

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

  function getAuthHeader(): Record<string,string> {
    if (clerkMode) {
      const token = getAuthToken();
      return token ? { Authorization: `Bearer ${token}` } : {};
    }
    try {
      const raw = localStorage.getItem('rr_auth_session');
      if (!raw) return {};
      const s = JSON.parse(raw);
      if (s?.token) return { Authorization: `Bearer ${s.token}` };
    } catch {}
    return {};
  }

  // Authenticated fetch helper: injects the active provider's bearer token.
  const authFetch = React.useCallback(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const headers: Record<string,string> = { ...((init?.headers as Record<string,string>) || {}), ...getAuthHeader() };
    return fetch(input, { ...init, headers, credentials: 'include' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clerkMode, isLoggedIn]);

  // Fetch durable database state from backend API on boot
  useEffect(() => {
    const fetchDatabaseRecords = async () => {
      try {
        const headers = getAuthHeader();
        const [bRes, vRes, woRes, invRes, cRes] = await Promise.all([
          fetch('/api/bookings', { headers }),
          fetch('/api/vehicles', { headers }),
          fetch('/api/work-orders', { headers }),
          fetch('/api/invoices', { headers }),
          fetch('/api/customers', { headers })
        ]);

        if (bRes.ok) {
          const bData = await bRes.json();
          if (bData.success && Array.isArray(bData.bookings)) {
            setBookings(bData.bookings);
          }
        }
        if (vRes.ok) {
          const vData = await vRes.json();
          if (vData.success && Array.isArray(vData.vehicles)) {
            setVehicles(vData.vehicles);
          }
        }
        if (woRes.ok) {
          const woData = await woRes.json();
          if (woData.success && Array.isArray(woData.workOrders)) {
            setWorkOrders(woData.workOrders);
          }
        }
        if (invRes.ok) {
          const invData = await invRes.json();
          if (invData.success && Array.isArray(invData.invoices)) {
            setInvoices(invData.invoices);
          }
        }
        if (cRes.ok) {
          const cData = await cRes.json();
          if (cData.success && Array.isArray(cData.customers)) {
            setCustomers(cData.customers);
          }
        }
      } catch (err) {
        console.warn('Backend database initial sync notice:', err);
      }
    };

    if (!currentUser) return;
    fetchDatabaseRecords();
  }, [currentUser?.id]);

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

  const openAuth = (mode: 'customer' | 'admin' | 'register' = 'customer') => {
    setAuthInitialMode(mode);
    if (mode === 'admin') setView('admin_auth');
    else setView('auth');
  };

  const loginCustomer = async (phone: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    if (clerkMode && clerk) { clerk.openSignIn(); return { success: true }; }
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      addToast('error', 'Invalid Phone Number', 'Please enter a valid Kenyan phone number (e.g. 0712 901 234).');
      return { success: false, error: 'Invalid phone number format' };
    }

    try {
      // Connect to server authentication endpoint
      const response = await fetch('/api/auth/customer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, password })
      });

      const data = await response.json();
      if (data.success && data.user) {
        const sessionData = {
          user: data.user,
          token: data.token,
          expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7-day token
        };

        localStorage.setItem('rr_auth_session', JSON.stringify(sessionData));
        setCurrentUser(data.user);
        setIsLoggedIn(true);
        setView('customer_dashboard');
        addToast('success', `Karibu, ${data.user.name}!`, 'Authenticated and signed into Driver Portal.');
        return { success: true };
      } else {
        const errMsg = data.error || 'Authentication failed. Please check your credentials.';
        addToast('error', 'Login Failed', errMsg);
        return { success: false, error: errMsg };
      }
    } catch {
      addToast('error', 'Authentication Failed', 'Backend authentication server is unreachable. Please check your connection.');
      return { success: false, error: 'Authentication server unreachable' };
    }
  };

  const loginAdmin = async (identifier: string, password: string): Promise<{ success: boolean; error?: string; requiresOtp?: boolean }> => {
    if (clerkMode && clerk) { clerk.openSignIn(); return { success: true }; }
    const cleanIdent = identifier.trim();
    const cleanPass = password.trim();
    if (!cleanIdent || !cleanPass) {
      addToast('error', 'Missing Information', 'Please provide administrator email/phone and security passcode.');
      return { success: false, error: 'Identifier and passcode required' };
    }
    try {
      const response = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ identifier: cleanIdent, password: cleanPass })
      });
      const data = await response.json();
      if (data.requiresOtp) {
        return { success: false, requiresOtp: true, error: data.message };
      }
      if (data.success && data.user) {
        const sessionData = { user: data.user, token: data.token, expiresAt: Date.now() + 8 * 60 * 60 * 1000 };
        localStorage.setItem('rr_auth_session', JSON.stringify(sessionData));
        setCurrentUser(data.user);
        setIsLoggedIn(true);
        setView('admin_dashboard');
        addToast('info', 'Admin Access Granted', 'Authenticated into Rolling Razors Workshop Operations Hub.');
        return { success: true };
      } else {
        const errMsg = data.error || 'Invalid workshop staff credentials or security passcode.';
        addToast('error', 'Access Denied', errMsg);
        return { success: false, error: errMsg };
      }
    } catch {
      addToast('error', 'Authentication Error', 'Unable to reach authentication server.');
      return { success: false, error: 'Server authentication unreachable' };
    }
  };

  const registerCustomer = async (data: { name: string; phone: string; email?: string; password?: string }): Promise<{ success: boolean; error?: string }> => {
    if (clerkMode && clerk) { clerk.openSignUp(); return { success: true }; }
    if (!data.name || !data.phone) {
      addToast('error', 'Missing Information', 'Please provide full name and phone number.');
      return { success: false, error: 'Full name and phone number required' };
    }

    try {
      const response = await fetch('/api/auth/customer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const resData = await response.json();
      if (resData.success && resData.user) {
        const newCustomer: Customer = {
          id: resData.user.id,
          name: resData.user.name,
          phone: resData.user.phone,
          email: resData.user.email || `${data.name.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
          avatar: resData.user.avatar || '',
          totalSpent: 0,
          status: 'New',
          address: 'Nairobi, Kenya',
          savedVehicles: []
        };

        setCustomers(prev => [...prev, newCustomer]);

        const sessionData = {
          user: resData.user,
          token: resData.token,
          expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
        };

        localStorage.setItem('rr_auth_session', JSON.stringify(sessionData));
        setCurrentUser(resData.user);
        setIsLoggedIn(true);
        setView('customer_dashboard');
        addToast('success', 'Account Created', `Karibu ${data.name}! Your Rolling Razors garage is ready.`);
        return { success: true };
      } else {
        const errMsg = resData.error || 'Registration failed.';
        addToast('error', 'Registration Failed', errMsg);
        return { success: false, error: errMsg };
      }
    } catch {
      addToast('error', 'Registration Error', 'Unable to reach backend server for registration.');
      return { success: false, error: 'Backend server unreachable' };
    }
  };

  const logout = () => {
    if (clerkMode && clerk) {
      setAuthToken(null);
      Promise.resolve(clerk.signOut()).catch(() => {});
    }
    localStorage.removeItem('rr_auth_session');
    setIsLoggedIn(false);
    setCurrentUser(null);
    setBookings([]);
    setWorkOrders([]);
    setInvoices([]);
    setVehicles([]);
    setCustomers([]);
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
  const optimisticId = 'srv-' + crypto.randomUUID();
  const optimisticService: Service = { ...serviceData, id: optimisticId };
  setServices(prev => [...prev, optimisticService]);
  fetch('/api/services', { method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeader() }, credentials: 'include', body: JSON.stringify(serviceData) })
    .then(async response => { const data = await response.json().catch(() => ({})); if (!response.ok || !data.success) throw new Error(data.error || 'Could not create service.'); setServices(prev => prev.map(service => service.id === optimisticId ? data.service : service)); })
    .catch(error => { setServices(prev => prev.filter(service => service.id !== optimisticId)); addToast('error', 'Service Creation Failed', error.message); });
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

    const estimatedPrice = Number(bookingData.estimatedPrice) || 0;
    const depositAmount = Number(bookingData.depositAmount) || 0;
    const depositPaid = Boolean(bookingData.depositPaid);
    const balanceAmount = Math.max(0, estimatedPrice - (depositPaid ? depositAmount : 0));
    const paymentStatus: PaymentStatus = depositPaid
      ? (balanceAmount === 0 ? 'paid' : 'deposit_paid')
      : 'pending';

    const newBooking: Booking = {
      ...bookingData,
      id: bookingId,
      customerId: bookingData.customerId || currentUser?.id,
      workOrderId,
      estimatedPrice,
      depositAmount,
      depositPaid,
      balanceAmount,
      paymentStatus: bookingData.paymentStatus || paymentStatus,
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

    // Also automatically create corresponding Work Order with standardized properties
    const dynamicMaterials: string[] = [
      bookingData.customOptions?.material || bookingData.selectedMaterial || 'Automotive Leather / Vinyl',
      bookingData.customOptions?.color ? `Color: ${bookingData.customOptions.color}` : null,
      bookingData.customOptions?.pattern ? `Pattern: ${bookingData.customOptions.pattern}` : null,
      'High Density Ergonomic Foam Cushioning',
      'Bonded Heavy-Duty Seam Thread'
    ].filter(Boolean) as string[];

    const newWorkOrder: WorkOrder = {
      id: workOrderId,
      bookingId: bookingId,
      customerId: newBooking.customerId,
      customerName: bookingData.customerName,
      customerPhone: bookingData.customerPhone,
      vehicleDisplayName: `${bookingData.vehicleDetails.make} ${bookingData.vehicleDetails.model} (${bookingData.vehicleDetails.year})`,
      vehicleRegistration: bookingData.vehicleDetails.registrationNo,
      serviceName: bookingData.serviceName,
      assignedStaffId: undefined,
      assignedStaffName: 'Unassigned',
      priority: 'Normal',
      stage: 'BOOKED',
      customerRequirements: bookingData.requirementsDesc || 'Standard custom upholstery package',
      materialsRequired: dynamicMaterials,
      estimatedCost: bookingData.estimatedPrice,
      actualCost: undefined,
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
    const customerNotificationTitle = depositPaid ? 'Booking Confirmed!' : 'Booking Request Received';
    const customerNotificationMessage = depositPaid
      ? `Your deposit of KES ${depositAmount.toLocaleString()} has been received and your booking #${bookingId} is confirmed.`
      : `Your booking request #${bookingId} for ${bookingData.serviceName} has been received. Complete the deposit to confirm your slot.`;

    const newNotifCustomer: AppNotification = {
      id: 'notif_' + Math.random().toString(36).substring(2, 9),
      recipientType: 'customer',
      title: customerNotificationTitle,
      message: customerNotificationMessage,
      timestamp: 'Just now',
      isRead: false,
      type: 'booking',
      relatedBookingId: bookingId
    };

    const newNotifAdmin: AppNotification = {
      id: 'notif_' + Math.random().toString(36).substring(2, 9),
      recipientType: 'admin',
      title: 'New Booking Request',
      message: `${bookingData.customerName} requested ${bookingData.serviceName} (${bookingData.vehicleDetails.registrationNo}).`,
      timestamp: 'Just now',
      isRead: false,
      type: 'booking',
      relatedBookingId: bookingId
    };

    setNotifications(prev => [newNotifCustomer, newNotifAdmin, ...prev]);

    fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(newBooking)
    }).catch(err => console.warn('Could not sync booking to server database:', err));

    if (depositPaid) {
      addToast('success', 'Booking Confirmed!', `Your booking #${bookingId} has been successfully scheduled and deposit received.`);
    } else {
      addToast('info', 'Booking Request Received', `Your appointment request #${bookingId} has been submitted. Complete the deposit to confirm your slot.`);
    }

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
      pending: 'BOOKED',
      confirmed: 'BOOKED',
      checked_in: 'VEHICLE_RECEIVED',
      in_progress: 'IN_PROGRESS',
      quality_check: 'QUALITY_CHECK',
      ready: 'READY_FOR_COLLECTION',
      completed: 'COLLECTED',
      cancelled: null
    };

    const mappedStage = stageMap[newStatus];
    if (mappedStage) {
      setWorkOrders(prev => prev.map(wo => {
        if (wo.bookingId === bookingId) {
          const progressMap: Record<WorkOrderStage, number> = {
            BOOKED: 15,
            VEHICLE_RECEIVED: 30,
            MATERIALS_PREPARED: 50,
            IN_PROGRESS: 70,
            QUALITY_CHECK: 85,
            READY_FOR_COLLECTION: 95,
            COLLECTED: 100
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
            updatedBy: currentUser?.name || 'Customer'
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
            updatedBy: currentUser?.name || 'Customer'
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
          assignedStaffId: staffId,
          assignedStaffName: assignedStaff.name
        };
      }
      return wo;
    }));

    addToast('success', 'Staff Assigned', `Assigned ${assignedStaff.name} to booking #${bookingId}.`);
  };

  const recordPayment = ({
    bookingId,
    amount,
    method = 'M-Pesa',
    status = 'deposit_paid',
    transactionReference,
    invoiceId
  }: RecordPaymentParams) => {
    const now = new Date();
    const nowStr = now.toISOString().split('T')[0];
    const formattedNow = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    let targetBooking: Booking | undefined;

    // 1. Atomically update Booking
    setBookings(prev => prev.map(b => {
      if (b.id !== bookingId) return b;

      const remainingBalance = Math.max(0, b.estimatedPrice - amount);
      const isPaidInFull = remainingBalance === 0;
      const finalPaymentStatus: PaymentStatus = isPaidInFull ? 'paid' : (status || 'deposit_paid');
      const newStatus: BookingStatus = b.status === 'pending' ? 'confirmed' : b.status;

      const updatedTimeline = [
        ...b.timeline,
        {
          status: newStatus,
          timestamp: formattedNow,
          title: `Payment Received (${method})`,
          note: `${method} payment of KES ${amount.toLocaleString()} received (Ref: ${transactionReference}). Remaining balance: KES ${remainingBalance.toLocaleString()}.`,
          updatedBy: 'Safaricom M-Pesa Gateway'
        }
      ];

      const updated: Booking = {
        ...b,
        depositPaid: true,
        depositAmount: Math.max(b.depositAmount || 0, amount),
        paymentStatus: finalPaymentStatus,
        paymentMethod: method,
        mpesaReceiptNo: transactionReference,
        balanceAmount: remainingBalance,
        status: newStatus,
        timeline: updatedTimeline
      };

      targetBooking = updated;

      fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({
          paymentStatus: finalPaymentStatus,
          paymentMethod: method,
          mpesaReceiptNo: transactionReference,
          depositPaid: true,
          depositAmount: Math.max(b.depositAmount || 0, amount),
          balanceAmount: remainingBalance,
          status: newStatus
        })
      }).catch(err => console.warn('Could not sync payment to server database:', err));

      return updated;
    }));

    // 2. Update linked work order
    setWorkOrders(prev => prev.map(wo => {
      if (wo.bookingId === bookingId) {
        return {
          ...wo,
          internalNotes: `${wo.internalNotes ? wo.internalNotes + ' • ' : ''}Payment of KES ${amount.toLocaleString()} confirmed (Ref: ${transactionReference})`
        };
      }
      return wo;
    }));

    // 3. Atomically update or generate Invoice
    setInvoices(prev => {
      const existingInvIndex = prev.findIndex(inv => inv.bookingId === bookingId || (invoiceId && inv.id === invoiceId));
      if (existingInvIndex >= 0) {
        const existing = prev[existingInvIndex];
        const newBalance = Math.max(0, existing.total - amount);
        const updatedInv: Invoice = {
          ...existing,
          depositPaid: amount,
          balanceDue: newBalance,
          paymentStatus: newBalance === 0 ? 'Paid' : 'Deposit Paid',
          paymentMethod: (method as 'M-Pesa' | 'Cash' | 'Bank' | 'Other') || 'M-Pesa',
          mpesaRef: transactionReference
        };
        const next = [...prev];
        next[existingInvIndex] = updatedInv;
        return next;
      } else {
        const b = targetBooking || bookings.find(item => item.id === bookingId);
        if (b) {
          const newInvId = `RR-INV-${Math.floor(2000 + Math.random() * 8000)}`;
          const newBalance = Math.max(0, b.estimatedPrice - amount);
          const newInv: Invoice = {
            id: newInvId,
            bookingId: b.id,
            workOrderId: b.workOrderId,
            customerName: b.customerName,
            customerPhone: b.customerPhone,
            customerEmail: b.customerEmail || '',
            vehicleInfo: `${b.vehicleDetails?.make || 'Vehicle'} ${b.vehicleDetails?.model || ''} (${b.vehicleDetails?.registrationNo || ''})`,
            serviceName: b.serviceName,
            items: [
              {
                description: `${b.serviceName} - Handcrafted Upholstery & Installation`,
                quantity: 1,
                unitPrice: b.estimatedPrice,
                amount: b.estimatedPrice
              }
            ],
            subtotal: b.estimatedPrice,
            depositPaid: amount,
            balanceDue: newBalance,
            total: b.estimatedPrice,
            paymentMethod: (method as 'M-Pesa' | 'Cash' | 'Bank' | 'Other') || 'M-Pesa',
            paymentStatus: newBalance === 0 ? 'Paid' : 'Deposit Paid',
            mpesaRef: transactionReference,
            issueDate: nowStr,
            dueDate: b.appointmentDate || nowStr
          };
          return [newInv, ...prev];
        }
      }
      return prev;
    });

    // 4. Create Notifications
    const customerNotif: AppNotification = {
      id: 'notif-' + Math.random().toString(36).substring(2, 9),
      recipientType: 'customer',
      title: 'M-Pesa Payment Received',
      message: `Deposit of KES ${amount.toLocaleString()} (Ref: ${transactionReference}) for booking #${bookingId} was verified.`,
      timestamp: 'Just now',
      isRead: false,
      type: 'payment',
      relatedBookingId: bookingId
    };

    const adminNotif: AppNotification = {
      id: 'notif-' + Math.random().toString(36).substring(2, 9),
      recipientType: 'admin',
      title: 'Lipa na M-Pesa Payment Alert',
      message: `Received KES ${amount.toLocaleString()} deposit for booking #${bookingId} (Receipt: ${transactionReference}).`,
      timestamp: 'Just now',
      isRead: false,
      type: 'payment',
      relatedBookingId: bookingId
    };

    setNotifications(prev => [customerNotif, adminNotif, ...prev]);

    addToast(
      'success',
      'M-Pesa Payment Verified!',
      `KES ${amount.toLocaleString()} received (Ref: ${transactionReference}). Booking #${bookingId} is confirmed.`
    );
  };

  const updateWorkOrderStage = (workOrderId: string, stage: WorkOrderStage) => {
    const progressMap: Record<WorkOrderStage, number> = {
      BOOKED: 15,
      VEHICLE_RECEIVED: 30,
      MATERIALS_PREPARED: 50,
      IN_PROGRESS: 70,
      QUALITY_CHECK: 85,
      READY_FOR_COLLECTION: 95,
      COLLECTED: 100
    };

    setWorkOrders(prev => prev.map(wo => {
      if (wo.id !== workOrderId) return wo;
      return {
        ...wo,
        stage,
        progressPercentage: progressMap[stage] || wo.progressPercentage
      };
    }));

    fetch(`/api/work-orders/${workOrderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ stage, progressPercentage: progressMap[stage] })
    }).catch(err => console.warn('Could not sync work order to server database:', err));

    // Find linked booking
    const linkedWo = workOrders.find(w => w.id === workOrderId);
    if (linkedWo && linkedWo.bookingId) {
      const statusMap: Record<WorkOrderStage, BookingStatus> = {
        BOOKED: 'pending',
        VEHICLE_RECEIVED: 'checked_in',
        MATERIALS_PREPARED: 'in_progress',
        IN_PROGRESS: 'in_progress',
        QUALITY_CHECK: 'quality_check',
        READY_FOR_COLLECTION: 'ready',
        COLLECTED: 'completed'
      };
      
      const newBookingStatus = statusMap[stage];
      if (newBookingStatus) {
        updateBookingStatus(linkedWo.bookingId, newBookingStatus, `Progress updated in workshop to ${stage.replace(/_/g, ' ')}`);
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
    const reg = (vehicleData.registrationNo || 'KAA 000A').toUpperCase().trim();
    const normReg = reg.replace(/\s+/g, "");
    if (vehicles.some(v => v.registrationNo.replace(/\s+/g, "").toLowerCase() === normReg.toLowerCase())) {
      addToast('error', 'Duplicate Registration', `Vehicle ${reg} already exists in your garage.`);
      return;
    }
    const newVehicle: Vehicle = {
      ...vehicleData,
      type: vehicleData.type || 'Car',
      customerId: vehicleData.customerId || currentUser?.id || 'cust-1',
      registrationNo: reg,
      id: 'veh_' + Math.random().toString(36).substring(2, 9),
      previousServicesCount: 0
    };
    setVehicles(prev => [newVehicle, ...prev]);
    const headers: Record<string,string> = { 'Content-Type': 'application/json', ...getAuthHeader() };
    fetch('/api/vehicles', { method: 'POST', headers, body: JSON.stringify(newVehicle) })
      .then(async r => {
        if (!r.ok) {
          const d = await r.json().catch(()=>({error:'Failed'}));
          if (r.status === 409) {
            addToast('error', 'Duplicate Registration', d.error || `Vehicle ${reg} already exists.`);
            setVehicles(prev => prev.filter(v => v.id !== newVehicle.id));
          }
        }
      })
      .catch(err => console.warn('Could not sync vehicle to server database:', err));
    addToast('success', 'Vehicle Added', `${vehicleData.make} ${vehicleData.model} (${reg}) added to your garage.`);
  };

  const updateProfile = (patch: Partial<User>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...patch, phone: patch.phone ? normalizePhoneKe(patch.phone) : currentUser.phone };
    setCurrentUser(updated);
    try {
      const raw = localStorage.getItem('rr_auth_session');
      if (raw) {
        const s = JSON.parse(raw);
        s.user = updated;
        localStorage.setItem('rr_auth_session', JSON.stringify(s));
      }
    } catch {}
    addToast('success', 'Profile Updated', 'Your contact details have been saved.');
  };

  const deleteVehicle = (id: string) => {
    let allowed = true;
    setVehicles(prev => {
      const target = prev.find(v => v.id === id);
      if (!target) return prev;
      if (currentUser && currentUser.role !== 'admin' && target.customerId && target.customerId !== currentUser.id) {
        allowed = false;
        return prev;
      }
      return prev.filter(v => v.id !== id);
    });
    if (allowed) {
      fetch(`/api/vehicles/${id}`, { method: 'DELETE', headers: getAuthHeader() as any }).catch(err => console.warn('Could not sync vehicle deletion to server database:', err));
      addToast('info', 'Vehicle Removed', 'Vehicle has been removed from your saved garage.');
    } else {
      addToast('error', 'Access Denied', 'You can only remove vehicles belonging to your own account.');
    }
  };

  const updateServicePrice = (serviceId: string, price: number) => {
    if (!Number.isInteger(price) || price < 0) { addToast('error', 'Invalid Price', 'Enter a non-negative whole-number price.'); return; }
    const previous = services.find(s => s.id === serviceId);
    setServices(prev => prev.map(s => s.id === serviceId ? { ...s, startingPrice: price } : s));
    fetch(`/api/services/${serviceId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...getAuthHeader() }, credentials: 'include', body: JSON.stringify({ startingPrice: price }) })
      .then(async response => { if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Could not save price.'); })
      .catch(error => { if (previous) setServices(prev => prev.map(s => s.id === serviceId ? previous : s)); addToast('error', 'Price Update Failed', error.message); });
    addToast('success', 'Price Updated', `Service base pricing updated to KES ${price.toLocaleString()}.`);
  };

  const toggleServiceAvailability = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId); if (!service) return;
    const nextFeatured = !service.isFeatured;
    setServices(prev => prev.map(s => s.id === serviceId ? { ...s, isFeatured: nextFeatured } : s));
    fetch(`/api/services/${serviceId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...getAuthHeader() }, credentials: 'include', body: JSON.stringify({ isFeatured: nextFeatured }) })
      .then(async response => { if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Could not save availability.'); })
      .catch(error => { setServices(prev => prev.map(s => s.id === serviceId ? service : s)); addToast('error', 'Availability Update Failed', error.message); });
  };

  const generateInvoiceForBooking = (bookingId: string): Invoice => {
    const booking = bookings.find(b => b.id === bookingId);
    const invoiceId = `RR-INV-${Math.floor(2000 + Math.random() * 8000)}`;
    const now = new Date().toISOString().split('T')[0];

    const estimatedPrice = booking?.estimatedPrice || 15000;
    const depositPaid = booking?.depositPaid ? (booking?.depositAmount || 0) : 0;
    const balanceDue = typeof booking?.balanceAmount === 'number'
      ? booking.balanceAmount
      : Math.max(0, estimatedPrice - depositPaid);

    let paymentStatus: 'Paid' | 'Deposit Paid' | 'Pending' | 'Overdue';
    if (balanceDue === 0 && depositPaid > 0) {
      paymentStatus = 'Paid';
    } else if (depositPaid > 0) {
      paymentStatus = 'Deposit Paid';
    } else {
      paymentStatus = 'Pending';
    }
    
    const newInvoice: Invoice = {
      id: invoiceId,
      bookingId: bookingId,
      workOrderId: booking?.workOrderId,
      customerName: booking?.customerName || 'Customer',
      customerPhone: booking?.customerPhone || '',
      customerEmail: booking?.customerEmail || '',
      vehicleInfo: booking ? `${booking.vehicleDetails?.make || ''} ${booking.vehicleDetails?.model || ''} (${booking.vehicleDetails?.registrationNo || ''})` : 'Vehicle',
      serviceName: booking?.serviceName || 'Custom Upholstery Service',
      items: [
        {
          description: `${booking?.serviceName || 'Service'} - Premium Materials & Handcrafting`,
          quantity: 1,
          unitPrice: estimatedPrice,
          amount: estimatedPrice
        }
      ],
      subtotal: estimatedPrice,
      depositPaid: depositPaid,
      balanceDue: balanceDue,
      total: estimatedPrice,
      paymentMethod: (booking?.paymentMethod as 'M-Pesa' | 'Cash' | 'Bank' | 'Other') || 'M-Pesa',
      paymentStatus: paymentStatus,
      mpesaRef: booking?.mpesaReceiptNo || (depositPaid > 0 ? 'MP' + Math.random().toString(36).substring(2, 8).toUpperCase() : undefined),
      issueDate: now,
      dueDate: booking?.appointmentDate || now
    };

    setInvoices(prev => [newInvoice, ...prev.filter(inv => inv.bookingId !== bookingId)]);
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
        isLoggedIn,
        currentUser,
        authInitialMode,
        setAuthInitialMode,
        openAuth,
        loginCustomer,
        loginAdmin,
        registerCustomer,
        logout,
        authProvider: clerkEnabled ? 'clerk' : 'legacy',
        authVerifying: clerkMode
          ? clerk
            ? !(clerk.isLoaded && (!clerk.isSignedIn || Boolean(currentUser)))
            : true
          : legacyVerifying,
        clerkLoaded: clerkMode ? Boolean(clerk?.isLoaded) : true,
        authFetch,
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
        recordPayment,
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
        legalModal,
        openLegalModal,
        closeLegalModal,
        setLegalModalType,
        selectedBookingId,
        setSelectedBookingId,
        selectedServiceId,
        setSelectedServiceId,
        selectedWorkOrderId,
        setSelectedWorkOrderId,
        bookingWizardInitialServiceId,
        setBookingWizardInitialServiceId,
        bookingWizardDraft,
        setBookingWizardDraft,
        updateProfile
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// Clerk-backed provider: reads the Clerk session (inside <ClerkProvider>) and
// passes the primitives into the shared provider body. Legacy mode renders the
// body directly without touching Clerk.
const ClerkAppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const { signOut, openSignIn, openSignUp } = useClerk();
  const clerk: ClerkApi = {
    isLoaded: Boolean(isLoaded),
    isSignedIn: Boolean(isSignedIn),
    user: user ?? null,
    getToken: () => getToken() as Promise<string | null>,
    signOut: () => signOut(),
    openSignIn: (options?: any) => openSignIn(options),
    openSignUp: (options?: any) => openSignUp(options),
  };
  return <AppProviderInner clerk={clerk}>{children}</AppProviderInner>;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) =>
  clerkEnabled ? <ClerkAppProvider>{children}</ClerkAppProvider> : <AppProviderInner>{children}</AppProviderInner>;

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
