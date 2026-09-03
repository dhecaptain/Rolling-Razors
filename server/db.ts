import fs from 'fs';
import path from 'path';
import { Booking, Customer, Invoice, Staff, User, Vehicle, WorkOrder } from '../src/types';
import {
  INITIAL_BOOKINGS,
  INITIAL_CUSTOMERS,
  INITIAL_INVOICES,
  INITIAL_STAFF,
  INITIAL_VEHICLES,
  INITIAL_WORK_ORDERS
} from '../src/data/mockData';

export interface MpesaTransactionRecord {
  merchantRequestId: string;
  checkoutRequestId: string;
  bookingId?: string;
  invoiceId?: string;
  amount: number;
  phone: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  receiptNumber?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OtpRecord {
  phone: string;
  otp: string;
  expiresAt: number;
}

export interface DatabaseSchema {
  users: User[];
  customers: Customer[];
  vehicles: Vehicle[];
  bookings: Booking[];
  workOrders: WorkOrder[];
  invoices: Invoice[];
  staff: Staff[];
  transactions: MpesaTransactionRecord[];
  otps: OtpRecord[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'rolling_razors_db.json');

// Initialize database with schema and default seeds
function getInitialData(): DatabaseSchema {
  const defaultAdminUser: User = {
    id: 'staff-1',
    name: 'James Kimani (Owner)',
    phone: '+254 712 345 678',
    email: 'james@rollingrazors.co.ke',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    location: 'Workshop HQ, Industrial Area, Nairobi'
  };

  const defaultCustomerUser: User = {
    id: 'cust-1',
    name: 'Brian Mwangi',
    phone: '+254 712 901 234',
    email: 'brian.mwangi@gmail.com',
    role: 'customer',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    location: 'Kilimani, Nairobi'
  };

  return {
    users: [defaultAdminUser, defaultCustomerUser],
    customers: INITIAL_CUSTOMERS,
    vehicles: INITIAL_VEHICLES,
    bookings: INITIAL_BOOKINGS,
    workOrders: INITIAL_WORK_ORDERS,
    invoices: INITIAL_INVOICES,
    staff: INITIAL_STAFF,
    transactions: [],
    otps: []
  };
}

class DatabaseManager {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure all top-level keys exist
        return {
          users: parsed.users || [],
          customers: parsed.customers || [],
          vehicles: parsed.vehicles || [],
          bookings: parsed.bookings || [],
          workOrders: parsed.workOrders || [],
          invoices: parsed.invoices || [],
          staff: parsed.staff || [],
          transactions: parsed.transactions || [],
          otps: parsed.otps || []
        };
      }
    } catch (err) {
      console.error('Error reading database file from disk, resetting to seed defaults:', err);
    }

    const initial = getInitialData();
    this.persist(initial);
    return initial;
  }

  private persist(dataToSave: DatabaseSchema = this.data): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpFile, JSON.stringify(dataToSave, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Failed to write database file to disk:', err);
    }
  }

  // --- Users & Customers ---
  getUsers(): User[] {
    return [...this.data.users];
  }

  findUser(identifier: string): User | undefined {
    const clean = identifier.trim().toLowerCase().replace(/\s+/g, '');
    return this.data.users.find(u => {
      const uEmail = (u.email || '').toLowerCase().replace(/\s+/g, '');
      const uPhone = (u.phone || '').replace(/\s+/g, '');
      return uEmail === clean || uPhone.includes(clean) || clean.includes(uPhone);
    });
  }

  upsertUser(user: User): User {
    const idx = this.data.users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      this.data.users[idx] = { ...this.data.users[idx], ...user };
    } else {
      this.data.users.push(user);
    }
    this.persist();
    return user;
  }

  getCustomers(): Customer[] {
    return [...this.data.customers];
  }

  getCustomer(id: string): Customer | undefined {
    return this.data.customers.find(c => c.id === id);
  }

  saveCustomer(customer: Customer): Customer {
    const idx = this.data.customers.findIndex(c => c.id === customer.id);
    if (idx >= 0) {
      this.data.customers[idx] = { ...this.data.customers[idx], ...customer };
    } else {
      this.data.customers.push(customer);
    }
    this.persist();
    return customer;
  }

  updateCustomer(id: string, patch: Partial<Customer>): Customer | undefined {
    const customer = this.data.customers.find(c => c.id === id);
    if (!customer) return undefined;
    Object.assign(customer, patch);
    this.persist();
    return customer;
  }

  // --- Vehicles ---
  getVehicles(customerId?: string): Vehicle[] {
    if (customerId) {
      return this.data.vehicles.filter(v => v.customerId === customerId);
    }
    return [...this.data.vehicles];
  }

  addVehicle(vehicle: Vehicle): Vehicle {
    const idx = this.data.vehicles.findIndex(v => v.id === vehicle.id);
    if (idx >= 0) {
      this.data.vehicles[idx] = vehicle;
    } else {
      this.data.vehicles.unshift(vehicle);
    }
    this.persist();
    return vehicle;
  }

  deleteVehicle(id: string): boolean {
    const initialLen = this.data.vehicles.length;
    this.data.vehicles = this.data.vehicles.filter(v => v.id !== id);
    if (this.data.vehicles.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  // --- Bookings ---
  getBookings(customerId?: string): Booking[] {
    if (customerId) {
      return this.data.bookings.filter(b => b.customerId === customerId);
    }
    return [...this.data.bookings];
  }

  getBooking(id: string): Booking | undefined {
    return this.data.bookings.find(b => b.id === id);
  }

  createBooking(booking: Booking): Booking {
    const idx = this.data.bookings.findIndex(b => b.id === booking.id);
    if (idx >= 0) {
      this.data.bookings[idx] = booking;
    } else {
      this.data.bookings.unshift(booking);
    }
    this.persist();
    return booking;
  }

  updateBooking(id: string, patch: Partial<Booking>): Booking | undefined {
    const booking = this.data.bookings.find(b => b.id === id);
    if (!booking) return undefined;
    Object.assign(booking, patch);
    this.persist();
    return booking;
  }

  // --- Work Orders ---
  getWorkOrders(): WorkOrder[] {
    return [...this.data.workOrders];
  }

  getWorkOrder(id: string): WorkOrder | undefined {
    return this.data.workOrders.find(wo => wo.id === id);
  }

  createWorkOrder(workOrder: WorkOrder): WorkOrder {
    const idx = this.data.workOrders.findIndex(wo => wo.id === workOrder.id);
    if (idx >= 0) {
      this.data.workOrders[idx] = workOrder;
    } else {
      this.data.workOrders.unshift(workOrder);
    }
    this.persist();
    return workOrder;
  }

  updateWorkOrder(id: string, patch: Partial<WorkOrder>): WorkOrder | undefined {
    const workOrder = this.data.workOrders.find(wo => wo.id === id);
    if (!workOrder) return undefined;
    Object.assign(workOrder, patch);
    this.persist();
    return workOrder;
  }

  // --- Invoices ---
  getInvoices(customerId?: string): Invoice[] {
    if (customerId) {
      return this.data.invoices.filter(inv => {
        const booking = this.data.bookings.find(b => b.id === inv.bookingId);
        return booking?.customerId === customerId;
      });
    }
    return [...this.data.invoices];
  }

  getInvoice(id: string): Invoice | undefined {
    return this.data.invoices.find(inv => inv.id === id);
  }

  createInvoice(invoice: Invoice): Invoice {
    const idx = this.data.invoices.findIndex(inv => inv.id === invoice.id);
    if (idx >= 0) {
      this.data.invoices[idx] = invoice;
    } else {
      this.data.invoices.unshift(invoice);
    }
    this.persist();
    return invoice;
  }

  updateInvoice(id: string, patch: Partial<Invoice>): Invoice | undefined {
    const invoice = this.data.invoices.find(inv => inv.id === id);
    if (!invoice) return undefined;
    Object.assign(invoice, patch);
    this.persist();
    return invoice;
  }

  // --- Staff ---
  getStaff(): Staff[] {
    return [...this.data.staff];
  }

  // --- Transactions ---
  getTransactions(): MpesaTransactionRecord[] {
    return [...this.data.transactions];
  }

  getTransaction(checkoutRequestId: string): MpesaTransactionRecord | undefined {
    return this.data.transactions.find(t => t.checkoutRequestId === checkoutRequestId);
  }

  saveTransaction(tx: MpesaTransactionRecord): MpesaTransactionRecord {
    const idx = this.data.transactions.findIndex(t => t.checkoutRequestId === tx.checkoutRequestId);
    if (idx >= 0) {
      this.data.transactions[idx] = { ...this.data.transactions[idx], ...tx };
    } else {
      this.data.transactions.unshift(tx);
    }
    this.persist();
    return tx;
  }

  updateTransaction(checkoutRequestId: string, patch: Partial<MpesaTransactionRecord>): MpesaTransactionRecord | undefined {
    const tx = this.data.transactions.find(t => t.checkoutRequestId === checkoutRequestId);
    if (!tx) return undefined;
    Object.assign(tx, { ...patch, updatedAt: new Date().toISOString() });
    this.persist();
    return tx;
  }

  // --- OTPs ---
  getOtp(phone: string): OtpRecord | undefined {
    const clean = phone.replace(/\s+/g, '');
    return this.data.otps.find(o => o.phone === clean);
  }

  saveOtp(phone: string, otp: string, expiresAt: number): void {
    const clean = phone.replace(/\s+/g, '');
    this.data.otps = this.data.otps.filter(o => o.phone !== clean && o.expiresAt > Date.now());
    this.data.otps.push({ phone: clean, otp, expiresAt });
    this.persist();
  }

  deleteOtp(phone: string): void {
    const clean = phone.replace(/\s+/g, '');
    this.data.otps = this.data.otps.filter(o => o.phone !== clean);
    this.persist();
  }
}

export const serverDb = new DatabaseManager();
