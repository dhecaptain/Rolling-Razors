import { prisma } from "./prisma";
import type { Booking, Customer, Invoice, Staff, User, Vehicle, WorkOrder } from "../src/types";

export interface BuildDraftRecord {
  material: string;
  color: string;
  pattern: string;
  updatedAt: string;
}

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

function phoneKey(phone: string): string {
  return String(phone || "").replace(/\D/g, "").replace(/^254/, "0").slice(-9);
}

class PrismaDatabaseManager {
  async getBuildDraft(userId: string): Promise<BuildDraftRecord | undefined> {
    const draft = await prisma.buildDraft.findUnique({ where: { userId } });
    if (!draft) return undefined;
    return { material: draft.material, color: draft.color, pattern: draft.pattern, updatedAt: draft.updatedAt.toISOString() };
  }

  async saveBuildDraft(userId: string, draft: Omit<BuildDraftRecord, "updatedAt">): Promise<BuildDraftRecord> {
    const saved = await prisma.buildDraft.upsert({
      where: { userId },
      update: draft,
      create: { userId, ...draft },
    });
    return { material: saved.material, color: saved.color, pattern: saved.pattern, updatedAt: saved.updatedAt.toISOString() };
  }

  async deleteBuildDraft(userId: string): Promise<void> {
    await prisma.buildDraft.deleteMany({ where: { userId } });
  }

  async getUsers(): Promise<User[]> {
    const users = await prisma.user.findMany();
    return users.map(mapUser);
  }

  async findUser(identifier: string): Promise<User | undefined> {
    const raw = await this.findRawUser(identifier);
    return raw ? mapUser(raw) : undefined;
  }

  async findUserWithHash(identifier: string): Promise<{ user: User; passwordHash?: string } | undefined> {
    const raw = await this.findRawUser(identifier);
    if (!raw) return undefined;
    return { user: mapUser(raw), passwordHash: (raw as any).passwordHash || undefined };
  }

  async setUserPassword(id: string, hash: string): Promise<void> {
    await prisma.user.update({ where: { id }, data: { passwordHash: hash } });
  }

  private async findRawUser(identifier: string): Promise<any | undefined> {
    const raw = String(identifier).trim();
    const cleanLower = raw.toLowerCase().replace(/\s+/g, "");
    const key = phoneKey(raw);
    if (cleanLower.includes("@")) {
      const found = await prisma.user.findFirst({ where: { email: { equals: cleanLower, mode: "insensitive" } } });
      if (found) return found;
    }
    if (key && key.length === 9) {
      const users = await prisma.user.findMany({ where: { phone: { contains: key.slice(-6) } } });
      const found = users.find(u => phoneKey(u.phone || "") === key);
      if (found) return found;
    }
    const users = await prisma.user.findMany();
    const found = users.find(u => {
      const uEmail = (u.email || "").toLowerCase().replace(/\s+/g, "");
      if (uEmail && uEmail === cleanLower) return true;
      const uKey = phoneKey(u.phone || "");
      return Boolean(key && uKey && key === uKey);
    });
    if (!found) return undefined;
    return found;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const u = await prisma.user.findUnique({ where: { id } });
    return u ? mapUser(u) : undefined;
  }

  async getUserByClerkId(clerkId: string): Promise<User | undefined> {
    const u = await prisma.user.findUnique({ where: { clerkId } });
    return u ? mapUser(u) : undefined;
  }

  async upsertUser(user: User): Promise<User> {
    const data = { clerkId: user.clerkId || null, name: user.name, phone: user.phone || null, email: user.email || null, role: user.role, avatar: user.avatar, location: user.location };
    await prisma.user.upsert({
      where: { id: user.id },
      update: data,
      create: { id: user.id, ...data },
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

  async getCustomersPaginated(page=1, limit=20): Promise<{ data: Customer[]; total: number }> {
    const [rows, total] = await Promise.all([
      prisma.customer.findMany({ skip: (page-1)*limit, take: limit, orderBy: { createdAt: "desc" } }),
      prisma.customer.count(),
    ]);
    return { data: rows.map(r => ({ id: r.id, name: r.name, phone: r.phone, email: r.email, avatar: r.avatar || undefined, vehiclesCount: r.vehiclesCount || undefined, totalBookings: r.totalBookings || undefined, totalSpent: r.totalSpent, lastVisit: r.lastVisit || undefined, location: r.location || undefined, status: r.status as any, address: r.address || undefined, notes: r.notes || undefined, savedVehicles: (r.savedVehicles as any) || [] })), total };
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
    return rows.map(mapVehicle);
  }

  async getVehiclesPaginated(customerId: string | undefined, page: number, limit: number): Promise<{ data: Vehicle[]; total: number }> {
    const where = customerId ? { customerId } : {};
    const [rows, total] = await Promise.all([
      prisma.vehicle.findMany({ where, skip: (page-1)*limit, take: limit, orderBy: { createdAt: "desc" } }),
      prisma.vehicle.count({ where }),
    ]);
    return { data: rows.map(mapVehicle), total };
  }

  // Ownership-aware upsert keyed by registration number.
  //   - different customer already owns the plate  -> { conflict: true } (no reassignment)
  //   - same customer re-submits their own plate   -> idempotent refresh, existing id kept
  //   - otherwise                                  -> { created: true }
  async addVehicle(vehicle: Vehicle): Promise<{ vehicle: Vehicle; created: boolean; conflict?: boolean }> {
    const registrationNo = vehicle.registrationNo.toUpperCase();
    const existing = await prisma.vehicle.findUnique({ where: { registrationNo } });
    if (existing) {
      if (String(existing.customerId) !== String(vehicle.customerId)) {
        return { vehicle: mapVehicle(existing), created: false, conflict: true };
      }
      await prisma.vehicle.upsert({
        where: { registrationNo },
        update: { type: vehicle.type, make: vehicle.make, model: vehicle.model, year: vehicle.year, color: vehicle.color, image: vehicle.image, previousServicesCount: vehicle.previousServicesCount || 0, upholsteryHistory: (vehicle.upholsteryHistory as any) || [], notes: vehicle.notes },
        create: { id: `${Date.now()}_${crypto.randomUUID().slice(0, 6)}`, customerId: vehicle.customerId, type: vehicle.type, make: vehicle.make, model: vehicle.model, year: vehicle.year, registrationNo, color: vehicle.color, image: vehicle.image, previousServicesCount: vehicle.previousServicesCount || 0, upholsteryHistory: (vehicle.upholsteryHistory as any) || [], notes: vehicle.notes },
      });
      return { vehicle: { ...vehicle, id: existing.id, customerId: existing.customerId, registrationNo, previousServicesCount: vehicle.previousServicesCount || 0 }, created: false };
    }
    try {
      const created = await prisma.vehicle.create({ data: { id: vehicle.id, customerId: vehicle.customerId, type: vehicle.type, make: vehicle.make, model: vehicle.model, year: vehicle.year, registrationNo, color: vehicle.color, image: vehicle.image, previousServicesCount: vehicle.previousServicesCount || 0, upholsteryHistory: (vehicle.upholsteryHistory as any) || [], notes: vehicle.notes } });
      return { vehicle: mapVehicle(created), created: true };
    } catch {
      return { vehicle: mapVehicle(vehicle), created: false, conflict: true };
    }
  }

  async deleteVehicle(id: string): Promise<boolean> {
    try { await prisma.vehicle.delete({ where: { id } }); return true; } catch { return false; }
  }

  async getBookings(customerId?: string): Promise<Booking[]> {
    const rows = await prisma.booking.findMany({ where: customerId ? { customerId } : undefined, orderBy: { createdAt: "desc" } });
    return rows.map(mapBooking);
  }

  async getBookingsPaginated(customerId: string | undefined, status: string | undefined, page: number, limit: number, search?: string): Promise<{ data: Booking[]; total: number }> {
    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (status && status !== "all") where.status = status;
    if (search) {
      const q = search.trim();
      where.OR = [
        { customerName: { contains: q, mode: "insensitive" } },
        { customerPhone: { contains: q } },
        { serviceName: { contains: q, mode: "insensitive" } },
        { id: { contains: q, mode: "insensitive" } },
      ];
    }
    const [rows, total] = await Promise.all([
      prisma.booking.findMany({ where, skip: (page-1)*limit, take: limit, orderBy: { createdAt: "desc" } }),
      prisma.booking.count({ where }),
    ]);
    return { data: rows.map(mapBooking), total };
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

  async createBookingWithWorkOrder(booking: Booking, workOrder: WorkOrder): Promise<{ booking: Booking; workOrder: WorkOrder }> {
    await prisma.$transaction(async (tx) => {
      await tx.booking.upsert({ where: { id: booking.id }, update: toBookingData(booking), create: { id: booking.id, ...toBookingData(booking) as any } });
      await tx.workOrder.upsert({ where: { id: workOrder.id }, update: toWorkOrderData(workOrder), create: { id: workOrder.id, ...toWorkOrderData(workOrder) as any } });
    });
    return { booking, workOrder };
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

  async getWorkOrdersPaginated(customerId: string | undefined, page: number, limit: number): Promise<{ data: WorkOrder[]; total: number }> {
    const where: any = {};
    if (customerId) {
      const customerBookingIds = (await prisma.booking.findMany({ where: { customerId }, select: { id: true } })).map(b => b.id);
      where.bookingId = { in: customerBookingIds };
    }
    const [rows, total] = await Promise.all([
      prisma.workOrder.findMany({ where, skip: (page-1)*limit, take: limit, orderBy: { createdAt: "desc" } }),
      prisma.workOrder.count({ where }),
    ]);
    return { data: rows.map(mapWorkOrder), total };
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

  async getInvoicesPaginated(customerId: string | undefined, page: number, limit: number): Promise<{ data: Invoice[]; total: number }> {
    if (customerId) {
      const bookings = await prisma.booking.findMany({ where: { customerId }, select: { id: true } });
      const ids = bookings.map(b => b.id);
      const where = { bookingId: { in: ids } };
      const [rows, total] = await Promise.all([
        prisma.invoice.findMany({ where, skip: (page-1)*limit, take: limit, orderBy: { createdAt: "desc" } }),
        prisma.invoice.count({ where }),
      ]);
      return { data: rows.map(mapInvoice), total };
    }
    const [rows, total] = await Promise.all([
      prisma.invoice.findMany({ skip: (page-1)*limit, take: limit, orderBy: { createdAt: "desc" } }),
      prisma.invoice.count(),
    ]);
    return { data: rows.map(mapInvoice), total };
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

  async getTransactionsPaginated(page: number, limit: number): Promise<{ data: MpesaTransactionRecord[]; total: number }> {
    const [rows, total] = await Promise.all([
      prisma.mpesaTransaction.findMany({ skip: (page-1)*limit, take: limit, orderBy: { createdAt: "desc" } }),
      prisma.mpesaTransaction.count(),
    ]);
    return { data: rows.map(r => ({ merchantRequestId: r.merchantRequestId, checkoutRequestId: r.checkoutRequestId, bookingId: r.bookingId || undefined, invoiceId: r.invoiceId || undefined, amount: r.amount, phone: r.phone, status: r.status as any, receiptNumber: r.receiptNumber || undefined, failureReason: r.failureReason || undefined, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() })), total };
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

  async createAuditLog(data: { actorId: string; actorName: string; actorRole: string; action: string; entityType: string; entityId: string; before?: any; after?: any; ip?: string; requestId?: string }): Promise<void> {
    await prisma.auditLog.create({ data: { actorId: data.actorId, actorName: data.actorName, actorRole: data.actorRole, action: data.action, entityType: data.entityType, entityId: data.entityId, before: data.before ?? undefined, after: data.after ?? undefined, ip: data.ip, requestId: data.requestId } });
  }

  async getAuditLogs(entityType?: string, entityId?: string, limit = 50): Promise<any[]> {
    const where: any = {};
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    return prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, take: limit });
  }

  async updateWorkOrderWithVersion(id: string, patch: Partial<WorkOrder> & { version?: number }, actor?: { id: string; name: string; role: string; ip?: string; requestId?: string }): Promise<{ workOrder?: WorkOrder; error?: string; conflict?: boolean }> {
    const existing = await prisma.workOrder.findUnique({ where: { id } });
    if (!existing) return { error: "Work order not found." };
    if (patch.version !== undefined && patch.version !== existing.version) {
      return { error: `Version conflict: expected ${existing.version}, got ${patch.version}. Reload and try again.`, conflict: true };
    }
    const { version, ...rest } = patch as any;
    const before = existing;
    try {
      const updated = await prisma.workOrder.update({
        where: { id, ...(patch.version !== undefined ? { version: patch.version } : {}) },
        data: { ...toWorkOrderPatch(rest), version: { increment: 1 } } as any,
      });
      if (actor) {
        await this.createAuditLog({ actorId: actor.id, actorName: actor.name, actorRole: actor.role, action: `workOrder:${patch.stage || "update"}`, entityType: "WorkOrder", entityId: id, before, after: updated, ip: actor.ip, requestId: actor.requestId });
      }
      return { workOrder: mapWorkOrder(updated) };
    } catch (e: any) {
      if (String(e.message).includes("Record to update does not exist")) return { error: "Version conflict: record was modified by another user.", conflict: true };
      return { error: e.message };
    }
  }

  async getInventory(): Promise<any[]> {
    return prisma.inventoryItem.findMany({ orderBy: { qtyOnHand: "asc" } });
  }

  async getLowStock(): Promise<any[]> {
    const items = await prisma.inventoryItem.findMany();
    return items.filter(i => i.qtyOnHand <= i.reorderPoint);
  }

  async upsertInventoryItem(item: { sku: string; name: string; category: string; qtyOnHand?: number; reorderPoint?: number; costPerUnit?: number }): Promise<any> {
    return prisma.inventoryItem.upsert({
      where: { sku: item.sku },
      update: { name: item.name, category: item.category, qtyOnHand: item.qtyOnHand, reorderPoint: item.reorderPoint, costPerUnit: item.costPerUnit },
      create: { sku: item.sku, name: item.name, category: item.category, qtyOnHand: item.qtyOnHand ?? 0, reorderPoint: item.reorderPoint ?? 5, costPerUnit: item.costPerUnit ?? 0 },
    });
  }

  validateBookingTransition(from: string, to: string): { valid: boolean; error?: string } {
    const allowed: Record<string, string[]> = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["checked_in", "cancelled"],
      checked_in: ["in_progress", "cancelled"],
      in_progress: ["quality_check", "cancelled"],
      quality_check: ["ready", "in_progress"],
      ready: ["completed", "quality_check"],
      completed: [],
      cancelled: [],
    };
    if (from === to) return { valid: true };
    const next = allowed[from] || [];
    if (!next.includes(to)) return { valid: false, error: `Invalid transition ${from} → ${to}. Allowed: ${next.join(", ") || "none"}` };
    return { valid: true };
  }
}

function mapUser(u: any): User {
  return { id: u.id, clerkId: u.clerkId || undefined, name: u.name, phone: u.phone || "", email: u.email || "", role: u.role as any, avatar: u.avatar, location: u.location || undefined };
}
function mapVehicle(r: any): Vehicle {
  return { id: r.id, customerId: r.customerId, type: r.type as any, make: r.make, model: r.model, year: r.year, registrationNo: r.registrationNo, color: r.color || undefined, image: r.image || undefined, previousServicesCount: r.previousServicesCount ?? 0, upholsteryHistory: (r.upholsteryHistory as any) || undefined, notes: r.notes || undefined };
}
function mapBooking(r: any): Booking {
  return {
    id: r.id, customerId: r.customerId || undefined, customerName: r.customerName, customerPhone: r.customerPhone, customerEmail: r.customerEmail || undefined,
    serviceId: r.serviceId, serviceName: r.serviceName, vehicleDetails: r.vehicleDetails as any,
    requirementsDesc: r.requirementsDesc || undefined, notes: r.notes || undefined, customOptions: r.customOptions as any, referencePhotos: r.referencePhotos as any, selectedMaterial: r.selectedMaterial || undefined, stitchingStyle: r.stitchingStyle || undefined,
    appointmentDate: r.appointmentDate, appointmentTime: r.appointmentTime, locationType: r.locationType as any, customerLocation: r.customerLocation || undefined, customerLocationAddress: r.customerLocationAddress || undefined,
    slotStart: r.slotStart ? (r.slotStart instanceof Date ? r.slotStart.toISOString() : String(r.slotStart)) : undefined,
    estimatedPrice: r.estimatedPrice, depositAmount: r.depositAmount, balanceAmount: r.balanceAmount ?? undefined, depositPaid: r.depositPaid, paymentStatus: r.paymentStatus as any, paymentMethod: r.paymentMethod || undefined, mpesaReceiptNo: r.mpesaReceiptNo || undefined,
    status: r.status as any, assignedStaffId: r.assignedStaffId || undefined, assignedStaffName: r.assignedStaffName || undefined, workOrderId: r.workOrderId || undefined, timeline: r.timeline as any, internalNotes: r.internalNotes || undefined, createdAt: r.createdAt.toISOString(),
    privacyAcceptedAt: r.privacyAcceptedAt?.toISOString(), termsAcceptedAt: r.termsAcceptedAt?.toISOString(),
  };
}
function toBookingData(b: Booking): any {
  return {
    customerId: b.customerId, customerName: b.customerName, customerPhone: b.customerPhone, customerEmail: b.customerEmail,
    serviceId: b.serviceId, serviceName: b.serviceName, vehicleDetails: b.vehicleDetails as any,
    requirementsDesc: b.requirementsDesc, notes: b.notes, customOptions: b.customOptions as any, referencePhotos: b.referencePhotos as any, selectedMaterial: b.selectedMaterial, stitchingStyle: b.stitchingStyle,
    appointmentDate: b.appointmentDate, appointmentTime: b.appointmentTime, locationType: b.locationType, customerLocation: b.customerLocation, customerLocationAddress: b.customerLocationAddress,
    slotStart: b.slotStart ? new Date(b.slotStart) : undefined,
    estimatedPrice: b.estimatedPrice, depositAmount: b.depositAmount, balanceAmount: b.balanceAmount, depositPaid: b.depositPaid || false, paymentStatus: b.paymentStatus, paymentMethod: b.paymentMethod, mpesaReceiptNo: b.mpesaReceiptNo,
    status: b.status, assignedStaffId: b.assignedStaffId, assignedStaffName: b.assignedStaffName, workOrderId: b.workOrderId, timeline: b.timeline as any, internalNotes: b.internalNotes,
    privacyAcceptedAt: b.privacyAcceptedAt ? new Date(b.privacyAcceptedAt) : undefined,
    termsAcceptedAt: b.termsAcceptedAt ? new Date(b.termsAcceptedAt) : undefined,
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
function mapWorkOrder(r: any): WorkOrder & { version?: number } {
  return { id: r.id, bookingId: r.bookingId, customerId: r.customerId || undefined, customerName: r.customerName, customerPhone: r.customerPhone, vehicleId: r.vehicleId || undefined, vehicleDisplayName: r.vehicleDisplayName, vehicleRegistration: r.vehicleRegistration, serviceName: r.serviceName, assignedStaffId: r.assignedStaffId || undefined, assignedStaffName: r.assignedStaffName, priority: r.priority as any, stage: r.stage as any, customerRequirements: r.customerRequirements || undefined, materialsRequired: r.materialsRequired as any, estimatedCost: r.estimatedCost ?? undefined, actualCost: r.actualCost ?? undefined, beforePhotos: r.beforePhotos as any, progressPhotos: r.progressPhotos as any, afterPhotos: r.afterPhotos as any, internalNotes: r.internalNotes || undefined, progressPercentage: r.progressPercentage, version: r.version ?? 0, createdAt: r.createdAt.toISOString().split("T")[0], targetCompletionDate: r.targetCompletionDate || undefined } as any;
}
function toWorkOrderData(w: WorkOrder): any {
  return { bookingId: w.bookingId, customerId: w.customerId, customerName: w.customerName, customerPhone: w.customerPhone, vehicleId: w.vehicleId, vehicleDisplayName: w.vehicleDisplayName, vehicleRegistration: w.vehicleRegistration, serviceName: w.serviceName, assignedStaffId: w.assignedStaffId, assignedStaffName: w.assignedStaffName, priority: w.priority, stage: w.stage, customerRequirements: w.customerRequirements, materialsRequired: w.materialsRequired as any, estimatedCost: w.estimatedCost, actualCost: w.actualCost, beforePhotos: w.beforePhotos as any, progressPhotos: w.progressPhotos as any, afterPhotos: w.afterPhotos as any, internalNotes: w.internalNotes, progressPercentage: w.progressPercentage, version: w.version ?? 0, targetCompletionDate: w.targetCompletionDate };
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
