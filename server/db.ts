import { prisma } from "./prisma";
import type { Booking, Customer, Invoice, Staff, User, Vehicle, WorkOrder } from "../src/types";

export interface MpesaTransactionRecord {
  merchantRequestId: string;
  checkoutRequestId: string;
  bookingId?: string;
  invoiceId?: string;
  amount: number;
  phone: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
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

function phoneKey(phone: string): string {
  return String(phone || "").replace(/\D/g, "").replace(/^254/, "0").slice(-9);
}

class PrismaDatabaseManager {
  async getUsers(): Promise<User[]> {
    const users = await prisma.user.findMany();
    return users.map(u => ({ id: u.id, name: u.name, phone: u.phone, email: u.email, role: u.role as any, avatar: u.avatar, location: u.location || undefined }));
  }

  async findUser(identifier: string): Promise<User | undefined> {
    const raw = String(identifier).trim();
    const cleanLower = raw.toLowerCase().replace(/\s+/g, "");
    const key = phoneKey(raw);
    const users = await prisma.user.findMany();
    const found = users.find(u => {
      const uEmail = (u.email || "").toLowerCase().replace(/\s+/g, "");
      if (uEmail && uEmail === cleanLower) return true;
      const uKey = phoneKey(u.phone);
      return Boolean(key && uKey && key === uKey);
    });
    if (!found) return undefined;
    return { id: found.id, name: found.name, phone: found.phone, email: found.email, role: found.role as any, avatar: found.avatar, location: found.location || undefined };
  }

  async upsertUser(user: User): Promise<User> {
    await prisma.user.upsert({
      where: { id: user.id },
      update: { name: user.name, phone: user.phone, email: user.email, role: user.role, avatar: user.avatar, location: user.location },
      create: { id: user.id, name: user.name, phone: user.phone, email: user.email, role: user.role, avatar: user.avatar, location: user.location },
    });
    return user;
  }

  async getCustomers(): Promise<Customer[]> {
    const rows = await prisma.customer.findMany();
    return rows.map(r => ({
      id: r.id, name: r.name, phone: r.phone, email: r.email, avatar: r.avatar || undefined,
      vehiclesCount: r.vehiclesCount || undefined, totalBookings: r.totalBookings || undefined,
      totalSpent: r.totalSpent, lastVisit: r.lastVisit || undefined, location: r.location || undefined,
      status: r.status as any, address: r.address || undefined, notes: r.notes || undefined,
      savedVehicles: (r.savedVehicles as any) || [],
    }));
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const r = await prisma.customer.findUnique({ where: { id } });
    if (!r) return undefined;
    return { id: r.id, name: r.name, phone: r.phone, email: r.email, avatar: r.avatar || undefined, vehiclesCount: r.vehiclesCount || undefined, totalBookings: r.totalBookings || undefined, totalSpent: r.totalSpent, lastVisit: r.lastVisit || undefined, location: r.location || undefined, status: r.status as any, address: r.address || undefined, notes: r.notes || undefined, savedVehicles: (r.savedVehicles as any) || [] };
  }

  async saveCustomer(customer: Customer): Promise<Customer> {
    await prisma.customer.upsert({
      where: { id: customer.id },
      update: { name: customer.name, phone: customer.phone, email: customer.email, avatar: customer.avatar, vehiclesCount: customer.vehiclesCount, totalBookings: customer.totalBookings, totalSpent: customer.totalSpent, lastVisit: customer.lastVisit, location: customer.location, status: customer.status as any, address: customer.address, notes: customer.notes, savedVehicles: (customer.savedVehicles as any) || [] },
      create: { id: customer.id, name: customer.name, phone: customer.phone, email: customer.email, avatar: customer.avatar, vehiclesCount: customer.vehiclesCount, totalBookings: customer.totalBookings, totalSpent: customer.totalSpent, lastVisit: customer.lastVisit, location: customer.location, status: customer.status as any, address: customer.address, notes: customer.notes, savedVehicles: (customer.savedVehicles as any) || [] },
    });
    return customer;
  }

  async updateCustomer(id: string, patch: Partial<Customer>): Promise<Customer | undefined> {
    try {
      const r = await prisma.customer.update({ where: { id }, data: { ...patch, savedVehicles: patch.savedVehicles as any } });
      return { id: r.id, name: r.name, phone: r.phone, email: r.email, avatar: r.avatar || undefined, vehiclesCount: r.vehiclesCount || undefined, totalBookings: r.totalBookings || undefined, totalSpent: r.totalSpent, lastVisit: r.lastVisit || undefined, location: r.location || undefined, status: r.status as any, address: r.address || undefined, notes: r.notes || undefined, savedVehicles: (r.savedVehicles as any) || [] };
    } catch { return undefined; }
  }

  async getVehicles(customerId?: string): Promise<Vehicle[]> {
    const rows = await prisma.vehicle.findMany({ where: customerId ? { customerId } : undefined, orderBy: { createdAt: "desc" } });
    return rows.map(r => ({ id: r.id, customerId: r.customerId, type: r.type as any, make: r.make, model: r.model, year: r.year, registrationNo: r.registrationNo, color: r.color || undefined, image: r.image || undefined, previousServicesCount: r.previousServicesCount, upholsteryHistory: (r.upholsteryHistory as any) || undefined, notes: r.notes || undefined }));
  }

  async addVehicle(vehicle: Vehicle): Promise<Vehicle> {
    await prisma.vehicle.upsert({
      where: { registrationNo: vehicle.registrationNo.toUpperCase() },
      update: { customerId: vehicle.customerId, type: vehicle.type, make: vehicle.make, model: vehicle.model, year: vehicle.year, color: vehicle.color, image: vehicle.image, previousServicesCount: vehicle.previousServicesCount || 0, upholsteryHistory: (vehicle.upholsteryHistory as any) || [], notes: vehicle.notes },
      create: { id: vehicle.id, customerId: vehicle.customerId, type: vehicle.type, make: vehicle.make, model: vehicle.model, year: vehicle.year, registrationNo: vehicle.registrationNo.toUpperCase(), color: vehicle.color, image: vehicle.image, previousServicesCount: vehicle.previousServicesCount || 0, upholsteryHistory: (vehicle.upholsteryHistory as any) || [], notes: vehicle.notes },
    });
    return vehicle;
  }

  async deleteVehicle(id: string): Promise<boolean> {
    try { await prisma.vehicle.delete({ where: { id } }); return true; } catch { return false; }
  }

  async getBookings(customerId?: string): Promise<Booking[]> {
    const rows = await prisma.booking.findMany({ where: customerId ? { customerId } : undefined, orderBy: { createdAt: "desc" } });
    return rows.map(mapBooking);
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const r = await prisma.booking.findUnique({ where: { id } });
    return r ? mapBooking(r) : undefined;
  }

  async createBooking(booking: Booking): Promise<Booking> {
    await prisma.booking.upsert({
      where: { id: booking.id },
      update: toBookingData(booking),
      create: { id: booking.id, ...toBookingData(booking) as any },
    });
    return booking;
  }

  async updateBooking(id: string, patch: Partial<Booking>): Promise<Booking | undefined> {
    try {
      const r = await prisma.booking.update({ where: { id }, data: toBookingPatch(patch) });
      return mapBooking(r);
    } catch { return undefined; }
  }

  async getWorkOrders(): Promise<WorkOrder[]> {
    const rows = await prisma.workOrder.findMany({ orderBy: { createdAt: "desc" } });
    return rows.map(mapWorkOrder);
  }

  async getWorkOrder(id: string): Promise<WorkOrder | undefined> {
    const r = await prisma.workOrder.findUnique({ where: { id } });
    return r ? mapWorkOrder(r) : undefined;
  }

  async createWorkOrder(wo: WorkOrder): Promise<WorkOrder> {
    await prisma.workOrder.upsert({
      where: { id: wo.id },
      update: toWorkOrderData(wo),
      create: { id: wo.id, ...toWorkOrderData(wo) as any },
    });
    return wo;
  }

  async updateWorkOrder(id: string, patch: Partial<WorkOrder>): Promise<WorkOrder | undefined> {
    try {
      const r = await prisma.workOrder.update({ where: { id }, data: toWorkOrderPatch(patch) });
      return mapWorkOrder(r);
    } catch { return undefined; }
  }

  async getInvoices(customerId?: string): Promise<Invoice[]> {
    if (customerId) {
      const bookings = await prisma.booking.findMany({ where: { customerId }, select: { id: true } });
      const ids = bookings.map(b => b.id);
      const rows = await prisma.invoice.findMany({ where: { bookingId: { in: ids } }, orderBy: { createdAt: "desc" } });
      return rows.map(mapInvoice);
    }
    const rows = await prisma.invoice.findMany({ orderBy: { createdAt: "desc" } });
    return rows.map(mapInvoice);
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const r = await prisma.invoice.findUnique({ where: { id } });
    return r ? mapInvoice(r) : undefined;
  }

  async createInvoice(inv: Invoice): Promise<Invoice> {
    await prisma.invoice.upsert({
      where: { id: inv.id },
      update: toInvoiceData(inv),
      create: { id: inv.id, ...toInvoiceData(inv) as any },
    });
    return inv;
  }

  async updateInvoice(id: string, patch: Partial<Invoice>): Promise<Invoice | undefined> {
    try {
      const r = await prisma.invoice.update({ where: { id }, data: toInvoicePatch(patch) });
      return mapInvoice(r);
    } catch { return undefined; }
  }

  async getStaff(): Promise<Staff[]> {
    const rows = await prisma.staff.findMany();
    return rows.map(r => ({ id: r.id, name: r.name, role: r.role, phone: r.phone, specialization: r.specialization || undefined, specialty: r.specialty || undefined, activeJobs: r.activeJobs, completedJobs: r.completedJobs, avatar: r.avatar, rating: r.rating }));
  }

  async getTransactions(): Promise<MpesaTransactionRecord[]> {
    const rows = await prisma.mpesaTransaction.findMany({ orderBy: { createdAt: "desc" } });
    return rows.map(r => ({ merchantRequestId: r.merchantRequestId, checkoutRequestId: r.checkoutRequestId, bookingId: r.bookingId || undefined, invoiceId: r.invoiceId || undefined, amount: r.amount, phone: r.phone, status: r.status as any, receiptNumber: r.receiptNumber || undefined, failureReason: r.failureReason || undefined, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() }));
  }

  async getTransaction(checkoutRequestId: string): Promise<MpesaTransactionRecord | undefined> {
    const r = await prisma.mpesaTransaction.findUnique({ where: { checkoutRequestId } });
    if (!r) return undefined;
    return { merchantRequestId: r.merchantRequestId, checkoutRequestId: r.checkoutRequestId, bookingId: r.bookingId || undefined, invoiceId: r.invoiceId || undefined, amount: r.amount, phone: r.phone, status: r.status as any, receiptNumber: r.receiptNumber || undefined, failureReason: r.failureReason || undefined, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() };
  }

  async saveTransaction(tx: MpesaTransactionRecord): Promise<MpesaTransactionRecord> {
    await prisma.mpesaTransaction.upsert({
      where: { checkoutRequestId: tx.checkoutRequestId },
      update: { merchantRequestId: tx.merchantRequestId, bookingId: tx.bookingId, invoiceId: tx.invoiceId, amount: tx.amount, phone: tx.phone, status: tx.status as any, receiptNumber: tx.receiptNumber, failureReason: tx.failureReason },
      create: { merchantRequestId: tx.merchantRequestId, checkoutRequestId: tx.checkoutRequestId, bookingId: tx.bookingId, invoiceId: tx.invoiceId, amount: tx.amount, phone: tx.phone, status: tx.status as any, receiptNumber: tx.receiptNumber, failureReason: tx.failureReason },
    });
    return tx;
  }

  async updateTransaction(checkoutRequestId: string, patch: Partial<MpesaTransactionRecord>): Promise<MpesaTransactionRecord | undefined> {
    try {
      const r = await prisma.mpesaTransaction.update({ where: { checkoutRequestId }, data: { status: patch.status as any, receiptNumber: patch.receiptNumber, failureReason: patch.failureReason } });
      return { merchantRequestId: r.merchantRequestId, checkoutRequestId: r.checkoutRequestId, bookingId: r.bookingId || undefined, invoiceId: r.invoiceId || undefined, amount: r.amount, phone: r.phone, status: r.status as any, receiptNumber: r.receiptNumber || undefined, failureReason: r.failureReason || undefined, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() };
    } catch { return undefined; }
  }

  async getOtp(phone: string): Promise<OtpRecord | undefined> {
    const clean = phone.replace(/\s+/g, "");
    const r = await prisma.otp.findUnique({ where: { phone: clean } });
    if (!r) return undefined;
    return { phone: r.phone, otp: r.otp, expiresAt: r.expiresAt.getTime() };
  }

  async saveOtp(phone: string, otp: string, expiresAt: number): Promise<void> {
    const clean = phone.replace(/\s+/g, "");
    await prisma.otp.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    await prisma.otp.upsert({ where: { phone: clean }, update: { otp, expiresAt: new Date(expiresAt) }, create: { phone: clean, otp, expiresAt: new Date(expiresAt) } });
  }

  async deleteOtp(phone: string): Promise<void> {
    const clean = phone.replace(/\s+/g, "");
    await prisma.otp.delete({ where: { phone: clean } }).catch(() => {});
  }
}

function mapBooking(r: any): Booking {
  return {
    id: r.id, customerId: r.customerId || undefined, customerName: r.customerName, customerPhone: r.customerPhone, customerEmail: r.customerEmail || undefined,
    serviceId: r.serviceId, serviceName: r.serviceName, vehicleDetails: r.vehicleDetails as any,
    requirementsDesc: r.requirementsDesc || undefined, notes: r.notes || undefined, customOptions: r.customOptions as any, referencePhotos: r.referencePhotos as any, selectedMaterial: r.selectedMaterial || undefined, stitchingStyle: r.stitchingStyle || undefined,
    appointmentDate: r.appointmentDate, appointmentTime: r.appointmentTime, locationType: r.locationType as any, customerLocation: r.customerLocation || undefined, customerLocationAddress: r.customerLocationAddress || undefined,
    estimatedPrice: r.estimatedPrice, depositAmount: r.depositAmount, balanceAmount: r.balanceAmount ?? undefined, depositPaid: r.depositPaid, paymentStatus: r.paymentStatus as any, paymentMethod: r.paymentMethod || undefined, mpesaReceiptNo: r.mpesaReceiptNo || undefined,
    status: r.status as any, assignedStaffId: r.assignedStaffId || undefined, assignedStaffName: r.assignedStaffName || undefined, workOrderId: r.workOrderId || undefined, timeline: r.timeline as any, internalNotes: r.internalNotes || undefined, createdAt: r.createdAt.toISOString(),
  };
}
function toBookingData(b: Booking): any {
  return {
    customerId: b.customerId, customerName: b.customerName, customerPhone: b.customerPhone, customerEmail: b.customerEmail,
    serviceId: b.serviceId, serviceName: b.serviceName, vehicleDetails: b.vehicleDetails as any,
    requirementsDesc: b.requirementsDesc, notes: b.notes, customOptions: b.customOptions as any, referencePhotos: b.referencePhotos as any, selectedMaterial: b.selectedMaterial, stitchingStyle: b.stitchingStyle,
    appointmentDate: b.appointmentDate, appointmentTime: b.appointmentTime, locationType: b.locationType, customerLocation: b.customerLocation, customerLocationAddress: b.customerLocationAddress,
    estimatedPrice: b.estimatedPrice, depositAmount: b.depositAmount, balanceAmount: b.balanceAmount, depositPaid: b.depositPaid || false, paymentStatus: b.paymentStatus, paymentMethod: b.paymentMethod, mpesaReceiptNo: b.mpesaReceiptNo,
    status: b.status, assignedStaffId: b.assignedStaffId, assignedStaffName: b.assignedStaffName, workOrderId: b.workOrderId, timeline: b.timeline as any, internalNotes: b.internalNotes,
  };
}
function toBookingPatch(p: Partial<Booking>): any {
  const d: any = { ...p };
  if (p.vehicleDetails) d.vehicleDetails = p.vehicleDetails as any;
  if (p.customOptions) d.customOptions = p.customOptions as any;
  if (p.timeline) d.timeline = p.timeline as any;
  if (p.referencePhotos) d.referencePhotos = p.referencePhotos as any;
  return d;
}
function mapWorkOrder(r: any): WorkOrder {
  return { id: r.id, bookingId: r.bookingId, customerId: r.customerId || undefined, customerName: r.customerName, customerPhone: r.customerPhone, vehicleId: r.vehicleId || undefined, vehicleDisplayName: r.vehicleDisplayName, vehicleRegistration: r.vehicleRegistration, serviceName: r.serviceName, assignedStaffId: r.assignedStaffId || undefined, assignedStaffName: r.assignedStaffName, priority: r.priority as any, stage: r.stage as any, customerRequirements: r.customerRequirements || undefined, materialsRequired: r.materialsRequired as any, estimatedCost: r.estimatedCost ?? undefined, actualCost: r.actualCost ?? undefined, beforePhotos: r.beforePhotos as any, progressPhotos: r.progressPhotos as any, afterPhotos: r.afterPhotos as any, internalNotes: r.internalNotes || undefined, progressPercentage: r.progressPercentage, createdAt: r.createdAt.toISOString().split("T")[0], targetCompletionDate: r.targetCompletionDate || undefined };
}
function toWorkOrderData(w: WorkOrder): any {
  return { bookingId: w.bookingId, customerId: w.customerId, customerName: w.customerName, customerPhone: w.customerPhone, vehicleId: w.vehicleId, vehicleDisplayName: w.vehicleDisplayName, vehicleRegistration: w.vehicleRegistration, serviceName: w.serviceName, assignedStaffId: w.assignedStaffId, assignedStaffName: w.assignedStaffName, priority: w.priority, stage: w.stage, customerRequirements: w.customerRequirements, materialsRequired: w.materialsRequired as any, estimatedCost: w.estimatedCost, actualCost: w.actualCost, beforePhotos: w.beforePhotos as any, progressPhotos: w.progressPhotos as any, afterPhotos: w.afterPhotos as any, internalNotes: w.internalNotes, progressPercentage: w.progressPercentage, targetCompletionDate: w.targetCompletionDate };
}
function toWorkOrderPatch(p: Partial<WorkOrder>): any {
  const d: any = { ...p };
  if (p.materialsRequired) d.materialsRequired = p.materialsRequired as any;
  if (p.beforePhotos) d.beforePhotos = p.beforePhotos as any;
  if (p.progressPhotos) d.progressPhotos = p.progressPhotos as any;
  if (p.afterPhotos) d.afterPhotos = p.afterPhotos as any;
  return d;
}
function mapInvoice(r: any): Invoice {
  return { id: r.id, bookingId: r.bookingId, workOrderId: r.workOrderId || undefined, customerName: r.customerName, customerPhone: r.customerPhone, customerEmail: r.customerEmail, vehicleInfo: r.vehicleInfo, serviceName: r.serviceName, items: r.items as any, subtotal: r.subtotal, depositPaid: r.depositPaid, balanceDue: r.balanceDue, total: r.total, paymentMethod: r.paymentMethod as any, paymentStatus: r.paymentStatus as any, mpesaRef: r.mpesaRef || undefined, issueDate: r.issueDate, dueDate: r.dueDate };
}
function toInvoiceData(i: Invoice): any {
  return { bookingId: i.bookingId, workOrderId: i.workOrderId, customerName: i.customerName, customerPhone: i.customerPhone, customerEmail: i.customerEmail, vehicleInfo: i.vehicleInfo, serviceName: i.serviceName, items: i.items as any, subtotal: i.subtotal, depositPaid: i.depositPaid, balanceDue: i.balanceDue, total: i.total, paymentMethod: i.paymentMethod, paymentStatus: i.paymentStatus, mpesaRef: i.mpesaRef, issueDate: i.issueDate, dueDate: i.dueDate };
}
function toInvoicePatch(p: Partial<Invoice>): any {
  const d: any = { ...p };
  if (p.items) d.items = p.items as any;
  return d;
}

export const serverDb = new PrismaDatabaseManager();
