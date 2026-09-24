import fs from "fs";
import path from "path";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { INITIAL_SERVICES, INITIAL_STAFF, INITIAL_CUSTOMERS, INITIAL_VEHICLES, INITIAL_BOOKINGS, INITIAL_WORK_ORDERS, INITIAL_INVOICES } from "../src/data/mockData";

export interface InMemoryDb {
  users: any[];
  customers: any[];
  vehicles: any[];
  bookings: any[];
  workOrders: any[];
  invoices: any[];
  staff: any[];
  services: any[];
  mpesaTransactions: any[];
  otps: any[];
  auditLogs: any[];
  inventoryItems: any[];
  buildDrafts: any[];
}

const DB_FILE_PATH = path.join(process.cwd(), "data", "rolling_razors_db.json");

/**
 * Default dataset for a brand-new mock database, mirroring prisma/seed.ts so
 * the mock and Postgres start from the same owner-led world: the owner + second
 * owner as staff-fluent Users, the demo driver, the full seed data (customers,
 * vehicles, bookings, work orders, invoices), and the inventory list.
 */
function defaultDataSet(): InMemoryDb {
  const users = [
    { id: "staff-1", name: "James Kimani (Owner)", phone: "+254 712 345 678", email: "james@rollingrazors.co.ke", role: "owner", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80", location: "Workshop HQ, Industrial Area, Nairobi" },
    { id: "cust-1", name: "Brian Mwangi", phone: "+254 712 901 234", email: "brian.mwangi@gmail.com", role: "customer", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80", location: "Kilimani, Nairobi" },
    { id: "staff-admin", name: "davidpolycarp7", phone: "+254723459826", email: "davidpolycarp7@gmail.com", role: "owner", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80", location: "Workshop HQ, Industrial Area, Nairobi" },
  ];
  const inventoryItems = [
    { sku: "LEATHER-NAPPA-TAN-001", name: "Nappa Leather Tan #804", category: "leather", qtyOnHand: 18, reorderPoint: 12, costPerUnit: 2800 },
    { sku: "LEATHER-ITALIAN-SADDLE", name: "Italian Saddle Brown Leather", category: "leather", qtyOnHand: 3, reorderPoint: 10, costPerUnit: 4200 },
    { sku: "VINYL-HD-BLACK-001", name: "Heavy-Duty Vinyl Black", category: "vinyl", qtyOnHand: 45, reorderPoint: 15, costPerUnit: 850 },
    { sku: "FOAM-HD-50MM", name: "High-Density Foam 50mm", category: "foam", qtyOnHand: 8, reorderPoint: 10, costPerUnit: 1200 },
    { sku: "THREAD-GOLD-40", name: "Gold Bonded Nylon Thread #40", category: "thread", qtyOnHand: 22, reorderPoint: 8, costPerUnit: 150 },
    { sku: "CANVAS-RIPSTOP-550", name: "Ripstop Canvas 550gsm", category: "canvas", qtyOnHand: 30, reorderPoint: 10, costPerUnit: 950 },
  ];
  return {
    users,
    customers: INITIAL_CUSTOMERS,
    vehicles: INITIAL_VEHICLES,
    bookings: INITIAL_BOOKINGS,
    workOrders: INITIAL_WORK_ORDERS,
    invoices: INITIAL_INVOICES,
    staff: INITIAL_STAFF,
    services: INITIAL_SERVICES,
    mpesaTransactions: [],
    otps: [],
    auditLogs: [],
    inventoryItems,
    buildDrafts: [],
  };
}

function loadDb(): InMemoryDb {
  let rawDb: any = {};
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      rawDb = JSON.parse(fs.readFileSync(DB_FILE_PATH, "utf8"));
    }
  } catch (err) {
    console.warn("[Prisma Mock] Failed to read db file, starting fresh:", err);
  }

  // A totally fresh mock (no persisted file yet) starts from the same seeded
  // world the Postgres seed creates, so the owner-led data contract holds
  // across engines — including an owner row in the staff directory.
  if (!rawDb.staff || rawDb.staff.length === 0) {
    rawDb = defaultDataSet();
  }

  const normalizeDate = (val: any) => (val ? new Date(val) : new Date());

  // Mirrors the Postgres migrations' role backfills: legacy mock rows stored
  // "admin" for the owner and Capitalized staff roles. Normalize in-memory so
  // Casbin/isStaffRole checks see the canonical lowercase clinician roles.
  const STAFF_ROLES = new Set(["owner", "manager", "craftsman", "receptionist"]);
  const normalizeRole = (r: any) => {
    const rl = String(r || "customer").toLowerCase();
    return rl === "admin" ? "owner" : rl;
  };

  const users = (rawDb.users || []).map((u: any) => ({
    ...u,
    role: normalizeRole(u.role),
    createdAt: normalizeDate(u.createdAt),
    updatedAt: normalizeDate(u.updatedAt),
  }));

  const staffUserIds = new Set(users.filter((u: any) => STAFF_ROLES.has(u.role)).map((u: any) => u.id));

  const customers = (rawDb.customers || []).map((c: any) => ({
    ...c,
    createdAt: normalizeDate(c.createdAt),
    updatedAt: normalizeDate(c.updatedAt),
  }));

  const vehicles = (rawDb.vehicles || []).map((v: any) => ({
    ...v,
    createdAt: normalizeDate(v.createdAt),
    updatedAt: normalizeDate(v.updatedAt),
  }));

  const bookings = (rawDb.bookings || []).map((b: any) => ({
    ...b,
    slotStart: b.slotStart ? new Date(b.slotStart) : b.slotStart,
    createdAt: normalizeDate(b.createdAt),
    updatedAt: normalizeDate(b.updatedAt),
  }));

  const workOrders = (rawDb.workOrders || []).map((w: any) => ({
    ...w,
    version: typeof w.version === "number" ? w.version : 0,
    createdAt: normalizeDate(w.createdAt),
    updatedAt: normalizeDate(w.updatedAt),
  }));

  const invoices = (rawDb.invoices || []).map((i: any) => ({
    ...i,
    createdAt: normalizeDate(i.createdAt),
    updatedAt: normalizeDate(i.updatedAt),
  }));

  const staff = (rawDb.staff || []).map((s: any) => ({
    ...s,
    role: normalizeRole(s.role),
    status: s.status || "active",
    userId: s.userId ?? (staffUserIds.has(s.id) ? s.id : undefined),
    createdAt: normalizeDate(s.createdAt),
    updatedAt: normalizeDate(s.updatedAt),
  }));

  const services = (rawDb.services && rawDb.services.length > 0 ? rawDb.services : INITIAL_SERVICES).map((srv: any) => ({
    ...srv,
    createdAt: normalizeDate(srv.createdAt),
    updatedAt: normalizeDate(srv.updatedAt),
  }));

  const mpesaTransactions = (rawDb.transactions || rawDb.mpesaTransactions || []).map((t: any) => ({
    ...t,
    createdAt: normalizeDate(t.createdAt),
    updatedAt: normalizeDate(t.updatedAt),
  }));

  const otps = (rawDb.otps || []).map((o: any) => ({
    ...o,
    expiresAt: o.expiresAt ? new Date(o.expiresAt) : new Date(Date.now() + 5 * 60 * 1000),
    createdAt: normalizeDate(o.createdAt),
  }));

  const auditLogs = (rawDb.auditLogs || []).map((a: any) => ({
    ...a,
    createdAt: normalizeDate(a.createdAt),
  }));

  const defaultInventory = [
    { sku: "LEATHER-NAPPA-TAN-001", name: "Nappa Leather Tan #804", category: "leather", unit: "m", qtyOnHand: 18, reorderPoint: 12, costPerUnit: 2800 },
    { sku: "LEATHER-ITALIAN-SADDLE", name: "Italian Saddle Brown Leather", category: "leather", unit: "m", qtyOnHand: 3, reorderPoint: 10, costPerUnit: 4200 },
    { sku: "VINYL-HD-BLACK-001", name: "Heavy-Duty Vinyl Black", category: "vinyl", unit: "m", qtyOnHand: 45, reorderPoint: 15, costPerUnit: 850 },
    { sku: "FOAM-HD-50MM", name: "High-Density Foam 50mm", category: "foam", unit: "m", qtyOnHand: 8, reorderPoint: 10, costPerUnit: 1200 },
    { sku: "THREAD-GOLD-40", name: "Gold Bonded Nylon Thread #40", category: "thread", unit: "spool", qtyOnHand: 22, reorderPoint: 8, costPerUnit: 150 },
    { sku: "CANVAS-RIPSTOP-550", name: "Ripstop Canvas 550gsm", category: "canvas", unit: "m", qtyOnHand: 30, reorderPoint: 10, costPerUnit: 950 },
  ];

  const inventoryItems = (rawDb.inventoryItems || defaultInventory).map((item: any) => ({
    ...item,
    createdAt: normalizeDate(item.createdAt),
    updatedAt: normalizeDate(item.updatedAt),
  }));

  const buildDrafts = (rawDb.buildDrafts || []).map((d: any) => ({
    ...d,
    createdAt: normalizeDate(d.createdAt),
    updatedAt: normalizeDate(d.updatedAt),
  }));

  return {
    users,
    customers,
    vehicles,
    bookings,
    workOrders,
    invoices,
    staff,
    services,
    mpesaTransactions,
    otps,
    auditLogs,
    inventoryItems,
    buildDrafts,
  };
}

let saveTimeout: any = null;
function persistDb(data: InMemoryDb) {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      const payload = {
        users: data.users,
        customers: data.customers,
        vehicles: data.vehicles,
        bookings: data.bookings,
        workOrders: data.workOrders,
        invoices: data.invoices,
        staff: data.staff,
        services: data.services,
        transactions: data.mpesaTransactions,
        otps: data.otps,
        auditLogs: data.auditLogs,
        inventoryItems: data.inventoryItems,
        buildDrafts: data.buildDrafts,
      };
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(payload, null, 2), "utf8");
    } catch (e) {
      console.warn("[Prisma Mock] Failed to save DB to disk:", e);
    }
  }, 1000);
}

function matchesWhere(item: any, where?: any): boolean {
  if (!where) return true;
  for (const key of Object.keys(where)) {
    if (key === "OR" && Array.isArray(where.OR)) {
      const matchAny = where.OR.some((subWhere: any) => matchesWhere(item, subWhere));
      if (!matchAny) return false;
      continue;
    }
    if (key === "AND" && Array.isArray(where.AND)) {
      const matchAll = where.AND.every((subWhere: any) => matchesWhere(item, subWhere));
      if (!matchAll) return false;
      continue;
    }
    const expected = where[key];
    const actual = item[key];
    if (expected === undefined) continue;

    if (expected !== null && typeof expected === "object" && !(expected instanceof Date)) {
      if ("equals" in expected) {
        if (expected.mode === "insensitive") {
          if (String(actual || "").toLowerCase() !== String(expected.equals || "").toLowerCase()) return false;
        } else if (actual !== expected.equals) {
          return false;
        }
      }
      if ("contains" in expected) {
        const mode = expected.mode;
        const needle = mode === "insensitive" ? String(expected.contains).toLowerCase() : String(expected.contains);
        const haystack = mode === "insensitive" ? String(actual || "").toLowerCase() : String(actual || "");
        if (!haystack.includes(needle)) return false;
      }
      if ("in" in expected && Array.isArray(expected.in)) {
        if (!expected.in.includes(actual)) return false;
      }
      if ("notIn" in expected && Array.isArray(expected.notIn)) {
        if (expected.notIn.includes(actual)) return false;
      }
      if ("not" in expected && expected.not !== undefined) {
        if (actual === expected.not) return false;
      }
      if ("gte" in expected) {
        const gteVal = expected.gte instanceof Date ? expected.gte.getTime() : expected.gte;
        const actualVal = actual instanceof Date ? actual.getTime() : actual;
        if (actualVal < gteVal) return false;
      }
      if ("gt" in expected) {
        const gtVal = expected.gt instanceof Date ? expected.gt.getTime() : expected.gt;
        const actualVal = actual instanceof Date ? actual.getTime() : actual;
        if (actualVal <= gtVal) return false;
      }
      if ("lte" in expected) {
        const lteVal = expected.lte instanceof Date ? expected.lte.getTime() : expected.lte;
        const actualVal = actual instanceof Date ? actual.getTime() : actual;
        if (actualVal > lteVal) return false;
      }
      if ("lt" in expected) {
        const ltVal = expected.lt instanceof Date ? expected.lt.getTime() : expected.lt;
        const actualVal = actual instanceof Date ? actual.getTime() : actual;
        if (actualVal >= ltVal) return false;
      }
    } else {
      if (actual instanceof Date && expected instanceof Date) {
        if (actual.getTime() !== expected.getTime()) return false;
      } else if (actual !== expected) {
        return false;
      }
    }
  }
  return true;
}

function sortItems(items: any[], orderBy?: any): any[] {
  if (!orderBy) return items;
  const orderKeys = Array.isArray(orderBy) ? orderBy : [orderBy];
  return [...items].sort((a, b) => {
    for (const ord of orderKeys) {
      for (const [col, dir] of Object.entries(ord)) {
        let valA = a[col];
        let valB = b[col];
        if (valA instanceof Date) valA = valA.getTime();
        if (valB instanceof Date) valB = valB.getTime();
        if (valA < valB) return dir === "desc" ? 1 : -1;
        if (valA > valB) return dir === "desc" ? -1 : 1;
      }
    }
    return 0;
  });
}

function createModelHandler(list: any[], dbStore: InMemoryDb, primaryKey = "id") {
  return {
    async findMany(args?: { where?: any; skip?: number; take?: number; orderBy?: any; select?: any }) {
      let result = list.filter(item => matchesWhere(item, args?.where));
      result = sortItems(result, args?.orderBy);
      if (args?.skip) result = result.slice(args.skip);
      if (args?.take !== undefined) result = result.slice(0, args.take);
      if (args?.select) {
        const keys = Object.keys(args.select).filter(k => args.select[k]);
        return result.map(item => {
          const selected: any = {};
          for (const k of keys) selected[k] = item[k];
          return selected;
        });
      }
      return result.map(item => ({ ...item }));
    },

    async findFirst(args?: { where?: any; orderBy?: any }) {
      let result = list.filter(item => matchesWhere(item, args?.where));
      result = sortItems(result, args?.orderBy);
      return result.length > 0 ? { ...result[0] } : null;
    },

    async findUnique(args: { where: any }) {
      const found = list.find(item => matchesWhere(item, args.where));
      return found ? { ...found } : null;
    },

    async count(args?: { where?: any }) {
      if (!args?.where) return list.length;
      return list.filter(item => matchesWhere(item, args.where)).length;
    },

    async create(args: { data: any }) {
      const now = new Date();
      const id = args.data[primaryKey] || args.data.id || crypto.randomUUID();
      const newItem = {
        ...args.data,
        [primaryKey]: id,
        id,
        createdAt: args.data.createdAt ? new Date(args.data.createdAt) : now,
        updatedAt: now,
      };
      list.push(newItem);
      persistDb(dbStore);
      return { ...newItem };
    },

    async update(args: { where: any; data: any }) {
      const idx = list.findIndex(item => matchesWhere(item, args.where));
      if (idx === -1) {
        throw new Error("Record to update does not exist.");
      }
      const current = list[idx];
      const data = { ...args.data };
      if (data.version && typeof data.version === "object" && "increment" in data.version) {
        data.version = (current.version || 0) + data.version.increment;
      }
      const updated = {
        ...current,
        ...data,
        updatedAt: new Date(),
      };
      list[idx] = updated;
      persistDb(dbStore);
      return { ...updated };
    },

    async updateMany(args?: { where?: any; data?: any }) {
      const data = { ...(args?.data || {}) };
      let count = 0;
      for (let i = 0; i < list.length; i++) {
        if (!matchesWhere(list[i], args?.where)) continue;
        const current = list[i];
        if (data.version && typeof data.version === "object" && "increment" in data.version) {
          data.version = (current.version || 0) + data.version.increment;
        }
        list[i] = {
          ...current,
          ...data,
          updatedAt: new Date(),
        };
        count++;
      }
      if (count > 0) persistDb(dbStore);
      return { count };
    },

    async upsert(args: { where: any; update: any; create: any }) {
      const idx = list.findIndex(item => matchesWhere(item, args.where));
      const now = new Date();
      if (idx !== -1) {
        const current = list[idx];
        const data = { ...args.update };
        if (data.version && typeof data.version === "object" && "increment" in data.version) {
          data.version = (current.version || 0) + data.version.increment;
        }
        const updated = {
          ...current,
          ...data,
          updatedAt: now,
        };
        list[idx] = updated;
        persistDb(dbStore);
        return { ...updated };
      } else {
        const id = args.create[primaryKey] || args.create.id || crypto.randomUUID();
        const newItem = {
          ...args.create,
          [primaryKey]: id,
          id,
          createdAt: args.create.createdAt ? new Date(args.create.createdAt) : now,
          updatedAt: now,
        };
        list.push(newItem);
        persistDb(dbStore);
        return { ...newItem };
      }
    },

    async delete(args: { where: any }) {
      const idx = list.findIndex(item => matchesWhere(item, args.where));
      if (idx !== -1) {
        const deleted = list.splice(idx, 1)[0];
        persistDb(dbStore);
        return { ...deleted };
      }
      return null;
    },

    async deleteMany(args?: { where?: any }) {
      let deletedCount = 0;
      for (let i = list.length - 1; i >= 0; i--) {
        if (matchesWhere(list[i], args?.where)) {
          list.splice(i, 1);
          deletedCount++;
        }
      }
      persistDb(dbStore);
      return { count: deletedCount };
    },
  };
}

function createInMemoryPrisma() {
  const store = loadDb();

  const mockPrisma: any = {
    user: createModelHandler(store.users, store),
    customer: createModelHandler(store.customers, store),
    vehicle: createModelHandler(store.vehicles, store, "registrationNo"),
    booking: createModelHandler(store.bookings, store),
    workOrder: createModelHandler(store.workOrders, store),
    invoice: createModelHandler(store.invoices, store),
    staff: createModelHandler(store.staff, store),
    service: createModelHandler(store.services, store),
    mpesaTransaction: createModelHandler(store.mpesaTransactions, store, "checkoutRequestId"),
    otp: createModelHandler(store.otps, store, "phone"),
    auditLog: createModelHandler(store.auditLogs, store),
    inventoryItem: createModelHandler(store.inventoryItems, store, "sku"),
    buildDraft: createModelHandler(store.buildDrafts, store, "userId"),

    $queryRaw: async () => [{ "1": 1 }],
    $transaction: async (fnOrArr: any) => {
      if (typeof fnOrArr === "function") {
        return fnOrArr(mockPrisma);
      }
      if (Array.isArray(fnOrArr)) {
        return Promise.all(fnOrArr);
      }
      return fnOrArr;
    },
    $disconnect: async () => {},
  };

  return mockPrisma;
}

const globalForPrisma = globalThis as unknown as { prisma?: any };

function postgresSsl(): pg.PoolConfig["ssl"] {
  const url = process.env.DATABASE_URL || "";
  const config = (process.env.DATABASE_SSL || "").trim().toLowerCase();
  if (config === "disable") return false;
  if (config === "require") return { rejectUnauthorized: false };
  // Neon requires TLS; default to it when the pooled/host URL points at Neon.
  return url.includes("neon.tech") ? { rejectUnauthorized: false } : false;
}

function createPostgresPrisma(): any {
  const url = process.env.DATABASE_URL || "";
  const pool = new pg.Pool({ connectionString: url, ssl: postgresSsl() });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma: any =
  globalForPrisma.prisma ??
  (process.env.DATABASE_ENGINE === "postgres" ? createPostgresPrisma() : createInMemoryPrisma());

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
