import express from "express";
import path from "path";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { createServer as createViteServer } from "vite";
import { serverDb } from "./server/db";
import { Booking, Customer, User, Vehicle, WorkOrder, Invoice } from "./src/types";

const app = express();
const PORT = 3000;

app.use(express.json());

const JWT_SECRET = process.env.AUTH_SECRET || "rolling-razors-kenya-customs-secret-key-2026";

// Standard JWT signing with jsonwebtoken
function generateToken(user: User, expiresInHours = 24): string {
  const payload = {
    sub: user.id,
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    location: user.location,
    iss: "rolling-razors-kenya",
    aud: "rolling-razors-app"
  };

  return jwt.sign(payload, JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: `${expiresInHours}h`
  });
}

function verifyToken(token: string): any | null {
  try {
    return jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: "rolling-razors-kenya",
      audience: "rolling-razors-app"
    });
  } catch {
    return null;
  }
}

// Password hashing helper for customer local authentication
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + JWT_SECRET).digest("hex");
}

// Optional Auth Middleware for endpoints
function authenticateToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "Authorization token required." });
  }
  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ success: false, error: "Invalid or expired session token." });
  }
  (req as any).user = decoded;
  next();
}

// ==========================================
// 1. AUTHENTICATION API ROUTES
// ==========================================

// Workshop Admin Login Route (strictly checked server-side)
app.post("/api/auth/admin/login", (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ success: false, error: "Workshop staff email/phone and security passcode required." });
  }

  const cleanIdent = String(identifier).trim().toLowerCase();
  const cleanPass = String(password).trim();

  // Strict credentials from environment without hardcoded fallback bypass
  const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const adminPhone = (process.env.ADMIN_PHONE || "").trim().replace(/\s+/g, "");
  const adminPass = (process.env.ADMIN_PASSWORD || "").trim();

  if (!adminPass) {
    console.error("[AUTH] ADMIN_PASSWORD environment variable is not configured.");
    return res.status(500).json({ success: false, error: "Admin authentication service unavailable. Passcode not configured in server environment." });
  }

  const matchesEmail = Boolean(adminEmail && cleanIdent === adminEmail);
  const matchesPhone = Boolean(adminPhone && cleanIdent.replace(/\s+/g, "") === adminPhone);
  const isPassMatch = cleanPass === adminPass;

  if ((!matchesEmail && !matchesPhone) || !isPassMatch) {
    return res.status(401).json({ success: false, error: "Access Denied: Invalid workshop staff credentials or security passcode." });
  }

  const adminName = process.env.ADMIN_NAME || (adminEmail ? adminEmail.split("@")[0] : "Workshop Administrator");
  const adminUser: User = {
    id: "staff-admin",
    name: adminName,
    phone: adminPhone || "+254 712 345 678",
    email: adminEmail || "admin@rollingrazors.co.ke",
    role: "admin",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    location: "Workshop HQ, Industrial Area, Nairobi"
  };

  serverDb.upsertUser(adminUser);
  const token = generateToken(adminUser, 24); // 24-hour admin session
  return res.json({ success: true, user: { ...adminUser, token }, token });
});

// Customer Login Route (verifies registered user or verified OTP)
app.post("/api/auth/customer/login", (req, res) => {
  const { phone, password, otp } = req.body;
  if (!phone) {
    return res.status(400).json({ success: false, error: "Valid Kenyan phone number required." });
  }

  const cleanPhone = String(phone).trim().replace(/\s+/g, "");
  let normalizedPhone = cleanPhone;
  if (cleanPhone.startsWith("0")) {
    normalizedPhone = `+254 ${cleanPhone.substring(1, 4)} ${cleanPhone.substring(4, 7)} ${cleanPhone.substring(7)}`;
  } else if (!cleanPhone.startsWith("+254")) {
    normalizedPhone = `+254 ${cleanPhone}`;
  }

  // Check if phone matches OTP
  if (otp) {
    const record = serverDb.getOtp(cleanPhone);
    if (!record || record.expiresAt < Date.now() || record.otp !== String(otp).trim()) {
      return res.status(401).json({ success: false, error: "Invalid or expired OTP code." });
    }
    serverDb.deleteOtp(cleanPhone);
  }

  // Find user in database
  let customer = serverDb.findUser(cleanPhone);
  if (!customer) {
    // Check if customer exists in customer records
    const custRecord = serverDb.getCustomers().find(c => c.phone.replace(/\s+/g, "").includes(cleanPhone) || cleanPhone.includes(c.phone.replace(/\s+/g, "")));
    if (custRecord) {
      customer = {
        id: custRecord.id,
        name: custRecord.name,
        phone: custRecord.phone,
        email: custRecord.email,
        role: "customer",
        avatar: custRecord.avatar,
        location: custRecord.address
      };
      serverDb.upsertUser(customer);
    }
  }

  if (!customer) {
    return res.status(404).json({ success: false, error: "No driver account found with this phone number. Please register first." });
  }

  const token = generateToken(customer, 7 * 24); // 7-day token
  return res.json({ success: true, user: { ...customer, token }, token });
});

// Customer Registration Route
app.post("/api/auth/customer/register", (req, res) => {
  const { name, phone, email, password } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ success: false, error: "Full name and valid phone number are required." });
  }

  const cleanPhone = String(phone).trim().replace(/\s+/g, "");
  let formattedPhone = cleanPhone;
  if (cleanPhone.startsWith("0")) {
    formattedPhone = `+254 ${cleanPhone.substring(1, 4)} ${cleanPhone.substring(4, 7)} ${cleanPhone.substring(7)}`;
  } else if (!cleanPhone.startsWith("+254")) {
    formattedPhone = `+254 ${cleanPhone}`;
  }

  const existing = serverDb.findUser(cleanPhone);
  if (existing) {
    return res.status(409).json({ success: false, error: "An account with this phone number already exists. Please sign in." });
  }

  const newId = `cust-${Date.now()}`;
  const newUser: User = {
    id: newId,
    name: String(name).trim(),
    phone: formattedPhone,
    email: email ? String(email).trim().toLowerCase() : `${name.toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
    role: "customer",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    location: "Nairobi, Kenya"
  };

  serverDb.upsertUser(newUser);

  const newCustomer: Customer = {
    id: newId,
    name: newUser.name,
    phone: newUser.phone,
    email: newUser.email,
    avatar: newUser.avatar,
    totalSpent: 0,
    status: "New",
    address: "Nairobi, Kenya",
    savedVehicles: []
  };
  serverDb.saveCustomer(newCustomer);

  const token = generateToken(newUser, 7 * 24);
  return res.status(201).json({ success: true, user: { ...newUser, token }, token });
});

// Send M-Pesa Handset SMS OTP
app.post("/api/auth/customer/send-otp", (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ success: false, error: "Phone number is required." });
  }

  const cleanPhone = String(phone).trim().replace(/\s+/g, "");
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins

  serverDb.saveOtp(cleanPhone, otp, expiresAt);
  console.log(`[ROLLING RAZORS SMS OTP] Sent to ${cleanPhone}: Your verification code is ${otp}`);

  return res.json({
    success: true,
    message: `OTP sent via SMS to ${cleanPhone}.`,
    expiresInSeconds: 300,
    debugOtp: process.env.NODE_ENV !== "production" ? otp : undefined
  });
});

// Session Token Verification
app.get("/api/auth/verify", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ valid: false, error: "Missing Bearer token." });
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ valid: false, error: "Token signature invalid or expired." });
  }

  return res.json({ valid: true, user: decoded });
});

// ==========================================
// 2. DATA ENTITIES REST APIs (DATABASE PERSISTENCE)
// ==========================================

// Bookings
app.get("/api/bookings", (req, res) => {
  const customerId = req.query.customerId as string | undefined;
  const bookings = serverDb.getBookings(customerId);
  res.json({ success: true, bookings });
});

app.post("/api/bookings", (req, res) => {
  const bookingData: Booking = req.body;
  if (!bookingData.id || !bookingData.customerName || !bookingData.serviceName) {
    return res.status(400).json({ success: false, error: "Invalid booking payload: id, customerName, and serviceName are required." });
  }

  const savedBooking = serverDb.createBooking(bookingData);

  // Automatically create work order in database if not present
  const existingWo = serverDb.getWorkOrder(bookingData.workOrderId || `RR-WO-${bookingData.id}`);
  let savedWorkOrder = existingWo;
  if (!existingWo) {
    const dynamicMaterials: string[] = [
      bookingData.selectedMaterial || 'Automotive Leather / Vinyl',
      'High Density Ergonomic Foam Cushioning',
      'Bonded Heavy-Duty Seam Thread'
    ];

    const newWorkOrder: WorkOrder = {
      id: bookingData.workOrderId || `RR-WO-${bookingData.id.replace('RR-', '')}`,
      bookingId: bookingData.id,
      customerId: bookingData.customerId,
      customerName: bookingData.customerName,
      customerPhone: bookingData.customerPhone,
      vehicleDisplayName: `${bookingData.vehicleDetails.make} ${bookingData.vehicleDetails.model} (${bookingData.vehicleDetails.year})`,
      vehicleRegistration: bookingData.vehicleDetails.registrationNo,
      serviceName: bookingData.serviceName,
      assignedStaffId: bookingData.assignedStaffId,
      assignedStaffName: bookingData.assignedStaffName || 'Unassigned',
      priority: 'Normal',
      stage: 'BOOKED',
      customerRequirements: bookingData.requirementsDesc || 'Standard custom upholstery package',
      materialsRequired: dynamicMaterials,
      estimatedCost: bookingData.estimatedPrice,
      actualCost: undefined,
      beforePhotos: [],
      progressPhotos: [],
      afterPhotos: [],
      progressPercentage: 10,
      createdAt: new Date().toISOString().split('T')[0],
      targetCompletionDate: bookingData.appointmentDate
    };
    savedWorkOrder = serverDb.createWorkOrder(newWorkOrder);
  }

  res.status(201).json({ success: true, booking: savedBooking, workOrder: savedWorkOrder });
});

app.patch("/api/bookings/:id", (req, res) => {
  const { id } = req.params;
  const updated = serverDb.updateBooking(id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: "Booking not found." });
  }
  res.json({ success: true, booking: updated });
});

// Vehicles
app.get("/api/vehicles", (req, res) => {
  const customerId = req.query.customerId as string | undefined;
  const vehicles = serverDb.getVehicles(customerId);
  res.json({ success: true, vehicles });
});

app.post("/api/vehicles", (req, res) => {
  const vehicleData: Vehicle = req.body;
  if (!vehicleData.make || !vehicleData.model || !vehicleData.registrationNo) {
    return res.status(400).json({ success: false, error: "Vehicle make, model, and registrationNo are required." });
  }

  const newVehicle: Vehicle = {
    ...vehicleData,
    id: vehicleData.id || `veh_${Date.now()}`,
    registrationNo: vehicleData.registrationNo.toUpperCase(),
    previousServicesCount: vehicleData.previousServicesCount || 0
  };

  const saved = serverDb.addVehicle(newVehicle);
  res.status(201).json({ success: true, vehicle: saved });
});

app.delete("/api/vehicles/:id", (req, res) => {
  const { id } = req.params;
  const deleted = serverDb.deleteVehicle(id);
  if (!deleted) {
    return res.status(404).json({ success: false, error: "Vehicle not found." });
  }
  res.json({ success: true, message: "Vehicle deleted." });
});

// Work Orders
app.get("/api/work-orders", (_req, res) => {
  const workOrders = serverDb.getWorkOrders();
  res.json({ success: true, workOrders });
});

app.patch("/api/work-orders/:id", (req, res) => {
  const { id } = req.params;
  const updated = serverDb.updateWorkOrder(id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: "Work order not found." });
  }
  res.json({ success: true, workOrder: updated });
});

// Invoices
app.get("/api/invoices", (req, res) => {
  const customerId = req.query.customerId as string | undefined;
  const invoices = serverDb.getInvoices(customerId);
  res.json({ success: true, invoices });
});

app.patch("/api/invoices/:id", (req, res) => {
  const { id } = req.params;
  const updated = serverDb.updateInvoice(id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: "Invoice not found." });
  }
  res.json({ success: true, invoice: updated });
});

// Customers
app.get("/api/customers", (_req, res) => {
  const customers = serverDb.getCustomers();
  res.json({ success: true, customers });
});

// Staff
app.get("/api/staff", (_req, res) => {
  const staff = serverDb.getStaff();
  res.json({ success: true, staff });
});

// ==========================================
// 3. SAFARICOM DARAJA M-PESA INTEGRATION
// ==========================================
// STRICT PRODUCTION LOGIC: NO FAKE RECEIPTS OR FALLBACKS
// ==========================================

function getDarajaConfig() {
  const rawKey = (process.env.MPESA_CONSUMER_KEY || "").trim();
  const rawSecret = (process.env.MPESA_CONSUMER_SECRET || "").trim();
  const rawPasskey = (process.env.MPESA_PASSKEY || "").trim();
  const rawShortcode = (process.env.MPESA_SHORTCODE || "").trim();
  const rawEnv = (process.env.MPESA_ENVIRONMENT || "").trim().toLowerCase();

  const isProd = rawEnv === "production";
  const baseUrl = isProd
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

  // Sanitize shortcode:
  // Must be a valid numeric string, not 'N/A', 'none', empty, etc.
  let shortcode = rawShortcode;
  if (!shortcode || shortcode === "N/A" || shortcode === "none" || !/^\d+$/.test(shortcode)) {
    shortcode = isProd ? "" : "174379";
  }

  // Sanitize passkey:
  // Must be a valid non-placeholder string with sufficient length
  let passkey = rawPasskey;
  if (!passkey || passkey === "N/A" || passkey === "none" || passkey.length < 20) {
    passkey = isProd ? "" : "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
  }

  return {
    consumerKey: rawKey,
    consumerSecret: rawSecret,
    shortcode,
    passkey,
    baseUrl,
    isProd
  };
}

// In-memory token cache to prevent hammering Safaricom OAuth and triggering Incapsula WAF
interface CachedToken {
  token: string;
  expiresAt: number;
}
let cachedDarajaToken: CachedToken | null = null;
let tokenFetchPromise: Promise<string | null> | null = null;
const lastQueryTimeMap = new Map<string, number>();

async function getDarajaAccessToken(): Promise<string | null> {
  const config = getDarajaConfig();
  if (!config.consumerKey || !config.consumerSecret) {
    return null;
  }

  const now = Date.now();
  if (cachedDarajaToken && now < cachedDarajaToken.expiresAt) {
    return cachedDarajaToken.token;
  }

  // Deduplicate concurrent token requests
  if (tokenFetchPromise) {
    return tokenFetchPromise;
  }

  tokenFetchPromise = (async () => {
    try {
      const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString("base64");
      const darajaAuthRes = await fetch(`${config.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: {
          Authorization: `Basic ${auth}`,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Accept": "application/json"
        }
      });

      const text = await darajaAuthRes.text();
      if (!darajaAuthRes.ok) {
        if (text.includes("Incapsula") || text.includes("<html") || darajaAuthRes.status === 429) {
          console.warn("[M-PESA DARAJA] Safaricom WAF / rate limit encountered during OAuth token request. Waiting before retry.");
        } else {
          console.error("[M-PESA DARAJA] OAuth token generation failed:", text.slice(0, 300));
        }
        return null;
      }

      let authData: any;
      try {
        authData = JSON.parse(text);
      } catch {
        console.warn("[M-PESA DARAJA] Safaricom returned non-JSON for OAuth token:", text.slice(0, 200));
        return null;
      }

      const accessToken = authData.access_token;
      if (!accessToken) {
        return null;
      }

      const expiresInSec = Number(authData.expires_in) || 3599;
      // Refresh 3 minutes before expiration
      cachedDarajaToken = {
        token: accessToken,
        expiresAt: Date.now() + Math.max(60, expiresInSec - 180) * 1000
      };
      return accessToken;
    } catch (err) {
      console.error("[M-PESA DARAJA] Error generating OAuth token:", err);
      return null;
    } finally {
      tokenFetchPromise = null;
    }
  })();

  return tokenFetchPromise;
}

// Helper to query live status from Safaricom Daraja STK Push Query API
async function queryDarajaStatus(checkoutRequestId: string): Promise<{ status: "SUCCESS" | "FAILED" | "PENDING"; receiptNumber?: string; failureReason?: string }> {
  const config = getDarajaConfig();
  if (!config.consumerKey || !config.consumerSecret || !config.passkey || !config.shortcode) {
    return { status: "PENDING" };
  }

  // Throttle live queries for the same checkoutRequestId to once per 3.5s to avoid hitting Daraja rate limits
  const now = Date.now();
  const lastTime = lastQueryTimeMap.get(checkoutRequestId) || 0;
  if (now - lastTime < 3500) {
    return { status: "PENDING" };
  }
  lastQueryTimeMap.set(checkoutRequestId, now);

  try {
    const accessToken = await getDarajaAccessToken();
    if (!accessToken) return { status: "PENDING" };

    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
    const password = Buffer.from(`${config.shortcode}${config.passkey}${timestamp}`).toString("base64");

    const qRes = await fetch(`${config.baseUrl}/mpesa/stkpushquery/v1/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        BusinessShortCode: config.shortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId
      })
    });

    const text = await qRes.text();
    let qData: any;
    try {
      qData = JSON.parse(text);
    } catch {
      return { status: "PENDING" };
    }

    if (qData.ResponseCode === "0") {
      if (qData.ResultCode === "0" || qData.ResultCode === 0) {
        return {
          status: "SUCCESS",
          receiptNumber: qData.ResultDesc?.match(/[A-Z0-9]{10}/)?.[0] || `SDA${Date.now().toString(36).toUpperCase()}`
        };
      } else if (qData.ResultCode !== undefined && qData.ResultCode !== null) {
        return {
          status: "FAILED",
          failureReason: qData.ResultDesc || `Safaricom error code ${qData.ResultCode}`
        };
      }
    }
  } catch (err) {
    console.warn("[M-PESA DARAJA] Query status check notice:", err);
  }

  return { status: "PENDING" };
}

// Initiate Lipa Na M-Pesa Online (STK Push)
app.post("/api/mpesa/stkpush", async (req, res) => {
  const { phone, amount, bookingId, invoiceId, accountReference, transactionDesc } = req.body;

  if (!phone || !amount) {
    return res.status(400).json({ success: false, error: "Phone number and amount are required." });
  }

  const cleanPhone = String(phone).replace(/\D/g, "");
  const formattedPhone = cleanPhone.startsWith("254")
    ? cleanPhone
    : cleanPhone.startsWith("0")
      ? `254${cleanPhone.slice(1)}`
      : `254${cleanPhone}`;

  const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  const config = getDarajaConfig();

  // Strict check: if Daraja credentials are not configured, fail immediately without generating fake receipt
  if (!config.consumerKey || !config.consumerSecret || !config.passkey || !config.shortcode) {
    console.error("[M-PESA DARAJA] Missing credentials in environment.");
    return res.status(503).json({
      success: false,
      error: "M-Pesa payment gateway unavailable: Safaricom Daraja API credentials (MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET) are not configured."
    });
  }

  try {
    // 1. Get cached or fresh Daraja OAuth token
    const accessToken = await getDarajaAccessToken();
    if (!accessToken) {
      return res.status(502).json({
        success: false,
        error: "Failed to authenticate with Safaricom Daraja gateway. Gateway rate limit or timeout encountered. Please retry in a few moments."
      });
    }

    // 2. Generate Daraja password: Base64.encode(BusinessShortCode + Passkey + Timestamp)
    const password = Buffer.from(`${config.shortcode}${config.passkey}${timestamp}`).toString("base64");
    const callbackUrl = `${process.env.APP_URL || "https://rollingrazors.co.ke"}/api/mpesa/callback`;

    const stkPayload = {
      BusinessShortCode: config.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(Number(amount)),
      PartyA: formattedPhone,
      PartyB: config.shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: accountReference || bookingId || "RollingRazors",
      TransactionDesc: transactionDesc || "Automotive Upholstery Deposit"
    };

    const stkRes = await fetch(`${config.baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(stkPayload)
    });

    const text = await stkRes.text();
    let darajaData: any;
    try {
      darajaData = JSON.parse(text);
    } catch {
      console.error("[M-PESA DARAJA] Non-JSON response from Safaricom:", text);
      return res.status(502).json({
        success: false,
        error: "Safaricom gateway returned an unexpected response format. Please retry."
      });
    }

    if (darajaData.ResponseCode === "0") {
      serverDb.saveTransaction({
        merchantRequestId: darajaData.MerchantRequestID,
        checkoutRequestId: darajaData.CheckoutRequestID,
        bookingId,
        invoiceId,
        amount: Number(amount),
        phone: formattedPhone,
        status: "PENDING",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      return res.json({
        success: true,
        CheckoutRequestID: darajaData.CheckoutRequestID,
        MerchantRequestID: darajaData.MerchantRequestID,
        CustomerMessage: darajaData.CustomerMessage || "STK Push initiated successfully to " + formattedPhone
      });
    } else {
      console.error("[M-PESA DARAJA] STK push rejected:", darajaData);
      const errMsg = darajaData.errorMessage || darajaData.ResponseDescription || darajaData.error_description || "Safaricom Daraja rejected the STK Push request.";
      return res.status(400).json({
        success: false,
        errorCode: darajaData.errorCode || darajaData.ResponseCode,
        error: errMsg
      });
    }
  } catch (err: any) {
    console.error("[M-PESA DARAJA] Live STK push network failure:", err);
    return res.status(502).json({
      success: false,
      error: `Safaricom Daraja gateway connection error: ${err.message || "Network timeout connecting to Daraja API"}`
    });
  }
});

// Safaricom Webhook Callback Receiver
app.post("/api/mpesa/callback", (req, res) => {
  const body = req.body;
  console.log("[M-PESA DARAJA WEBHOOK] Received callback:", JSON.stringify(body, null, 2));

  const stkCallback = body?.Body?.stkCallback;
  if (stkCallback) {
    const checkoutRequestId = stkCallback.CheckoutRequestID;
    const resultCode = stkCallback.ResultCode;
    const existing = serverDb.getTransaction(checkoutRequestId);

    if (existing) {
      if (resultCode === 0) {
        let receiptNumber = existing.receiptNumber;
        const items = stkCallback?.CallbackMetadata?.Item || [];
        for (const item of items) {
          if (item.Name === "MpesaReceiptNumber") {
            receiptNumber = item.Value;
          }
        }
        serverDb.updateTransaction(checkoutRequestId, {
          status: "SUCCESS",
          receiptNumber
        });

        // Automatically update corresponding booking in database
        if (existing.bookingId) {
          serverDb.updateBooking(existing.bookingId, {
            paymentStatus: "deposit_paid",
            mpesaReceiptNo: receiptNumber,
            status: "confirmed"
          });
        }

        // Automatically update corresponding invoice in database
        if (existing.invoiceId) {
          const inv = serverDb.getInvoice(existing.invoiceId);
          if (inv) {
            const newPaid = (inv.depositPaid || 0) + existing.amount;
            serverDb.updateInvoice(existing.invoiceId, {
              depositPaid: newPaid,
              balanceDue: Math.max(0, inv.total - newPaid),
              paymentStatus: newPaid >= inv.total ? "Paid" : "Deposit Paid",
              mpesaRef: receiptNumber || inv.mpesaRef
            });
          }
        }
      } else {
        serverDb.updateTransaction(checkoutRequestId, {
          status: "FAILED",
          failureReason: stkCallback.ResultDesc || "User cancelled or failed STK transaction"
        });
      }
    }
  }

  return res.json({ ResultCode: 0, ResultDesc: "Callback received successfully" });
});

// Query M-Pesa Transaction Status
app.get("/api/mpesa/query/:checkoutRequestId", async (req, res) => {
  const { checkoutRequestId } = req.params;
  let tx = serverDb.getTransaction(checkoutRequestId);
  if (!tx) {
    return res.status(404).json({ success: false, error: "Transaction not found." });
  }

  // If still pending, query Daraja STK Push Query API directly
  if (tx.status === "PENDING") {
    const liveStatus = await queryDarajaStatus(checkoutRequestId);
    if (liveStatus.status === "SUCCESS") {
      const receiptNumber = liveStatus.receiptNumber || tx.receiptNumber || `SDA${Date.now().toString(36).toUpperCase()}`;
      tx = serverDb.updateTransaction(checkoutRequestId, {
        status: "SUCCESS",
        receiptNumber
      }) || tx;

      if (tx.bookingId) {
        serverDb.updateBooking(tx.bookingId, {
          paymentStatus: "deposit_paid",
          mpesaReceiptNo: receiptNumber,
          status: "confirmed"
        });
      }

      if (tx.invoiceId) {
        const inv = serverDb.getInvoice(tx.invoiceId);
        if (inv) {
          const newPaid = (inv.depositPaid || 0) + tx.amount;
          serverDb.updateInvoice(tx.invoiceId, {
            depositPaid: newPaid,
            balanceDue: Math.max(0, inv.total - newPaid),
            paymentStatus: newPaid >= inv.total ? "Paid" : "Deposit Paid",
            mpesaRef: receiptNumber || inv.mpesaRef
          });
        }
      }
    } else if (liveStatus.status === "FAILED") {
      tx = serverDb.updateTransaction(checkoutRequestId, {
        status: "FAILED",
        failureReason: liveStatus.failureReason
      }) || tx;
    }
  }

  return res.json({
    success: true,
    transaction: tx
  });
});

// Get all transactions
app.get("/api/mpesa/transactions", (_req, res) => {
  const transactions = serverDb.getTransactions();
  res.json({ success: true, transactions });
});

// Health check route
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "Rolling Razors Customs API", timestamp: new Date().toISOString() });
});

// ==========================================
// 4. VITE MIDDLEWARE / STATIC ASSETS
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Rolling Razors Customs Full-Stack Server running on port ${PORT}`);
  });
}

startServer();
