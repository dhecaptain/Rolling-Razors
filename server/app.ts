import express from "express";
import path from "path";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import helmet from "helmet";
import cors from "cors";
import pinoHttp from "pino-http";
import cookieParser from "cookie-parser";
import { clerkMiddleware, getAuth, clerkClient } from "@clerk/express";
import { createServer as createViteServer } from "vite";
import { env } from "./env";
import { logger } from "./logger";
import { serverDb } from "./db";
import type { MpesaTransactionRecord } from "./db";
import { prisma } from "./prisma";
import { kv } from "./kv";
import { rateLimitMiddleware } from "./rates";
import { initSentry, Sentry } from "./sentry";
import { requireCasbin, authorize } from "./casbin/enforcer";
import { normalizePhoneKe, toDarajaPhone, phoneKey, phonesMatch, isValidKePhone } from "./phone";
import { validate, adminLoginSchema, customerLoginSchema, customerRegisterSchema, stkPushSchema, paystackInitSchema, bookingCreateSchema, vehicleCreateSchema, buildDraftSchema, uploadImageSchema, staffCreateSchema, staffUpdateSchema, changePasswordSchema, bootstrapSchema } from "./validators";
import { DurableStorageRequiredError, storageService } from "./storage";
import { Booking, Customer, User, Vehicle, WorkOrder, UserRole, Staff } from "../src/types";

initSentry();
const app = express();

app.use(cookieParser());
app.use((req, _res, next) => { (req as any).id = crypto.randomUUID(); next(); });

const isProduction = env.NODE_ENV === "production";

app.use(helmet({
  frameguard: false,
  // In development Vite injects an inline React "preamble" script and opens an
  // HMR WebSocket. The hardened production CSP blocks both (script-src 'self'
  // and connect-src 'self'), which triggers
  // "@vitejs/plugin-react can't detect preamble". Keep strict CSP in production
  // and disable it in development only.
  contentSecurityPolicy: isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https:", "blob:"],
      // Clerk bundles clerk-js via the React SDK, but hosted components / bot
      // protection (Turnstile) load resources from Clerk + Cloudflare origins.
      scriptSrc: ["'self'", "https://*.clerk.accounts.dev", "https://*.clerk.com", "https://challenges.cloudflare.com", "https://js.paystack.co"],
      connectSrc: [
        "'self'",
        "https://api.safaricom.co.ke",
        "https://sandbox.safaricom.co.ke",
        "https://*.clerk.accounts.dev",
        "https://*.clerk.com",
        "https://clerk.rollingrazors.co.ke",
        "https://api.paystack.co",
      ],
      frameSrc: ["'self'", "https://*.clerk.accounts.dev", "https://*.clerk.com", "https://challenges.cloudflare.com", "https://checkout.paystack.com"],
      workerSrc: ["'self'", "blob:"],
      frameAncestors: ["'none'"],
    },
  } : false,
  hsts: isProduction ? { maxAge: 31536000, includeSubDomains: true } : false,
}));

const allowedOrigins = env.CORS_ORIGIN ? env.CORS_ORIGIN.split(",").map(s => s.trim()).filter(Boolean) : [];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (env.NODE_ENV !== "production") return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json({ limit: "15mb", verify: (_req, _res, buf) => { (_req as any).rawBody = buf; } }));
app.use(pinoHttp({
  logger,
  customProps: (req) => ({ requestId: (req as any).id }),
  redact: { paths: ["req.headers.authorization", "req.headers.cookie", "req.body.password", "req.body.otp"], censor: "[REDACTED]" },
}));
app.set("trust proxy", 1);

// Clerk session verification. Only mounted when Clerk is the active provider so
// that environments without Clerk credentials keep working via the legacy path.
if (env.AUTH_PROVIDER === "clerk") {
  app.use("/api", clerkMiddleware());
  logger.info("[AUTH] Clerk middleware enabled (server-side session verification)");
} else {
  logger.info("[AUTH] Legacy JWT provider active — set AUTH_PROVIDER=clerk and CLERK_SECRET_KEY to switch");
}

const generalLimiter = rateLimitMiddleware({ name: "general", max: env.RATE_LIMIT_GENERAL_MAX });
const customerAuthLimiter = rateLimitMiddleware({
  name: "customer-auth",
  max: env.RATE_LIMIT_AUTH_MAX,
  message: "Too many customer attempts. Try again shortly.",
  keyFns: [(req) => (req.body?.phone ? `${req.ip}:${req.body.phone}` : undefined)]
});
const adminAuthLimiter = rateLimitMiddleware({ name: "admin-auth", max: env.RATE_LIMIT_ADMIN_MAX, message: "Too many admin attempts. Try again in 5 minutes." });
const mpesaLimiter = rateLimitMiddleware({ name: "mpesa", max: env.RATE_LIMIT_MPESA_MAX, message: "M-Pesa rate limit: please wait." });
const paystackLimiter = rateLimitMiddleware({ name: "paystack", max: env.RATE_LIMIT_PAYSTACK_MAX, message: "Payment rate limit: please wait a moment." });
const callbackLimiter = rateLimitMiddleware({ name: "mpesa-callback", max: 60 });
app.use("/api/", generalLimiter);

const JWT_SECRET = env.AUTH_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 16) { logger.error("AUTH_SECRET missing"); if (env.NODE_ENV==="production") process.exit(1); }

const DEFAULT_STAFF_AVATAR = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80";

function generateToken(user: User, expiresInHours=24): string {
  const jti = crypto.randomUUID();
  const payload={ sub:user.id, jti, id:user.id, name:user.name, email:user.email, phone:user.phone, role:user.role, location:user.location, mustChangePassword:Boolean(user.mustChangePassword), iatms:Date.now(), iss:"rolling-razors-kenya", aud:"rolling-razors-app" };
  return jwt.sign(payload, JWT_SECRET, { algorithm:"HS256", expiresIn:`${expiresInHours}h` });
}
function verifyToken(token:string): any|null { try{ return jwt.verify(token, JWT_SECRET, { algorithms:["HS256"], issuer:"rolling-razors-kenya", audience:"rolling-razors-app" }); }catch{ return null; } }
async function hashPassword(p:string): Promise<string> { return bcrypt.hash(p, env.BCRYPT_ROUNDS); }
// Fail-closed password comparison. Accepts bcrypt hashes ($2a/$2b/$2y). The
// plaintext compare only ever runs outside production (local dev fallback);
// production NEVER accepts a plaintext credential.
async function comparePassword(p:string, hash:string): Promise<boolean> {
  if (!hash) return false;
  if (hash.startsWith("$2a$") || hash.startsWith("$2b$") || hash.startsWith("$2y$")) {
    try { return await bcrypt.compare(p, hash); } catch { return false; }
  }
  if (env.NODE_ENV === "production") return false;
  const a = Buffer.from(String(p)); const b = Buffer.from(String(hash));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const DENYLIST_KEY = "rr:denylist:jti";
const tokenDenylist = {
  async has(jti: string): Promise<boolean> { return kv.sismember(DENYLIST_KEY, jti); },
  async add(jti: string, ttlSec: number): Promise<void> { await kv.sadd(DENYLIST_KEY, jti, ttlSec); },
};
// Revocation check fails closed: if the denylist store errors we cannot prove
// the token is NOT revoked, so we reject rather than risk a stolen jti passing.
function isRevoked(d: any): Promise<boolean> {
  if (!d?.jti) return Promise.resolve(false);
  return tokenDenylist.has(d.jti).catch((e: any) => {
    logger.error({ err: e }, "[auth] denylist store error — failing closed");
    return true;
  });
}
function authenticateToken(req: express.Request,res: express.Response,next: express.NextFunction){
  let token: string | undefined;
  const h=req.headers.authorization;
  if(h?.startsWith("Bearer ")) token=h.split(" ")[1];
  else if((req as any).cookies?.rr_auth_token) token=(req as any).cookies.rr_auth_token;
  else if((req as any).cookies?.admin_token) token=(req as any).cookies.admin_token;
  if(!token) return res.status(401).json({ success:false, error:"Authorization token required." });
  const d=verifyToken(token); if(!d) return res.status(401).json({ success:false, error:"Invalid or expired session token." });
  isRevoked(d).then(async revoked => {
    if (revoked) return res.status(401).json({ success:false, error:"Token revoked." });
    if (await isUserRevoked(d)) return res.status(401).json({ success:false, error:"Session revoked. Sign in again." });
    (req as any).user=d; (req as any).token=token;
    if (isPasswordChangeBlocked(req)) return res.status(403).json({ success:false, error:"You must change your temporary passcode before using the dashboard." });
    next();
  });
}
function authenticateOptional(req: express.Request,_res: express.Response,next: express.NextFunction){
  let token: string | undefined;
  const h=req.headers.authorization;
  if(h?.startsWith("Bearer ")) token=h.split(" ")[1];
  else if((req as any).cookies?.rr_auth_token) token=(req as any).cookies.rr_auth_token;
  else if((req as any).cookies?.admin_token) token=(req as any).cookies.admin_token;
  if(token){ const d=verifyToken(token); if(d){ isRevoked(d).then(async revoked=> { if(!revoked && !(await isUserRevoked(d))) (req as any).user=d; next(); }); return; } }
  next();
}
// Role model: staff accounts are owner/manager/craftsman/receptionist. A "staff"
// bypass is anything that is not a customer — used for the inline ownership
// skips that staff historically enjoyed via the old "admin" flag.
const STAFF_ROLES = new Set(["owner", "manager", "craftsman", "receptionist"]);
function isStaffRole(role?: string): boolean {
  return typeof role === "string" && STAFF_ROLES.has(role);
}
function requireRole(roles: string[]) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const u=(req as any).user;
    if(!u) return res.status(401).json({ success:false, error:"Authorization required." });
    if(!roles.includes(u.role)) return res.status(403).json({ success:false, error:"Admin access required." });
    next();
  };
}
// Grand-daddy guard used across the dashboard: owner + manager.
const requireAdmin = requireRole(["owner", "manager"]);

// Per-user session revocation. Setting rr:revoke:user:<id> to a timestamp
// invalidates every token minted before it. Used to kick a staff member out
// immediately on deactivation or passcode change when we have no index of their
// outstanding jtis. Tokens carry an `iatms` (ms) claim so revocation is exact:
// a token issued a moment before the marker IS revoked, while one minted after
// survives — no second-truncation window in either direction.
const REVOKE_KEY_PREFIX = "rr:revoke:user";
async function isUserRevoked(d: any): Promise<boolean> {
  if (!d || !d.id || !d.iat) return false;
  const marker = await kv.get(`${REVOKE_KEY_PREFIX}:${d.id}`).catch((e: any) => {
    logger.error({ err: e }, "[auth] revoke-marker store error — failing closed, rejecting session");
    return "Infinity"; // a store error cannot prove the session is still valid, so revoke
  });
  if (!marker) return false;
  // Pre-`iatms` tokens (issued before this deploy) fall back to the JWT iat
  // second boundary, which can never spuriously revoke a newer token.
  const tokenMs = typeof d.iatms === "number" ? d.iatms : Math.floor(d.iat) * 1000;
  return tokenMs < Number(marker);
}

// Forced-passcode gate. A staff session still carrying mustChangePassword may
// only reach the passcode-change/verify/logout endpoints; every other
// authenticated route returns 403 until the temporary passcode is replaced.
// This is the server-side twin of the ForcePasswordChangeModal UI.
const PASSWORD_CHANGE_ALLOWLIST = ["/api/auth/change-password", "/api/auth/verify", "/api/auth/logout"];
function isPasswordChangeBlocked(req: express.Request): boolean {
  const u = (req as any).user;
  return Boolean(u && u.mustChangePassword && isStaffRole(u.role) && PASSWORD_CHANGE_ALLOWLIST.indexOf(req.path) === -1);
}

// ---------------------------------------------------------------------------
// Clerk authentication boundary (server-side verification).
// The frontend never proves identity on its own: every protected request is
// verified against Clerk's JWKS via clerkMiddleware/getAuth, the role is derived
// from Clerk publicMetadata (never from the client), and the app profile is
// lazily synced keyed by the Clerk user id.
// ---------------------------------------------------------------------------
const clerkRoleCache = new Map<string, { role: UserRole; expiresAt: number }>();

async function resolveClerkRole(clerkId: string, sessionClaims: any): Promise<UserRole> {
  if (env.ADMIN_CLERK_IDS.includes(clerkId)) return "owner";
  const claimRole = String(sessionClaims?.publicMetadata?.role ?? sessionClaims?.public_metadata?.role ?? "").toLowerCase();
  if (claimRole === "admin") return "owner"; // legacy Clerk metadata migrated to owner
  if (isStaffRole(claimRole)) return claimRole as UserRole;
  if (claimRole) return "customer";
  const cached = clerkRoleCache.get(clerkId);
  if (cached && cached.expiresAt > Date.now()) return cached.role;
  let role: UserRole = "customer";
  try {
    const clerkUser = await clerkClient.users.getUser(clerkId);
    const meta = String(clerkUser.publicMetadata?.role || "").toLowerCase();
    if (meta === "admin") role = "owner";
    else if (isStaffRole(meta)) role = meta as UserRole;
  } catch (err) {
    logger.warn({ err }, "[Clerk] role lookup failed; defaulting to customer");
  }
  clerkRoleCache.set(clerkId, { role, expiresAt: Date.now() + 60_000 });
  return role;
}

async function syncClerkProfile(clerkId: string, sessionClaims: any, role: UserRole): Promise<User> {
  let clerkUser: any = null;
  try { clerkUser = await clerkClient.users.getUser(clerkId); } catch { /* tolerate backend lookup failure */ }
  const name = clerkUser
    ? ([clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || clerkUser.username || "Driver")
    : (sessionClaims?.name || "Driver");
  const email = clerkUser?.primaryEmailAddress?.emailAddress || sessionClaims?.email || "";
  const phone = clerkUser?.primaryPhoneNumber?.phoneNumber || sessionClaims?.phone_number || "";

  // Link to an existing application profile (phone/email) before creating a new one.
  let existing: User | undefined;
  if (phone) existing = (await serverDb.findUser(phone)) || undefined;
  if (!existing && email) existing = (await serverDb.findUser(email)) || undefined;
  // Never hijack a profile that is already bound to a different Clerk identity.
  if (existing && existing.clerkId && existing.clerkId !== clerkId) existing = undefined;

  const appUser: User = existing
    ? { ...existing, clerkId, role, name: existing.name || name, email: existing.email || email, phone: existing.phone || phone }
    : {
        id: `cust-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
        clerkId,
        name,
        phone,
        email,
        role,
        avatar: clerkUser?.imageUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
        location: "Nairobi, Kenya",
      };
  await serverDb.upsertUser(appUser);

  // Ensure a CRM Customer row exists for customers (bookings reference Customer.id).
  if (appUser.role === "customer") {
    const existingCustomer = await serverDb.getCustomer(appUser.id);
    if (!existingCustomer) {
      await serverDb.saveCustomer({
        id: appUser.id, name: appUser.name, phone: appUser.phone || "", email: appUser.email || "",
        avatar: appUser.avatar, totalSpent: 0, status: "New", address: appUser.location || "Nairobi, Kenya", savedVehicles: [],
      });
    }
  }
  return appUser;
}

async function requireClerkAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const { userId, sessionClaims } = getAuth(req);
    if (!userId) return res.status(401).json({ success:false, error:"Authorization token required." });
    const role = await resolveClerkRole(userId, sessionClaims);
    let appUser = await serverDb.getUserByClerkId(userId);
    if (!appUser) {
      appUser = await syncClerkProfile(userId, sessionClaims, role);
    } else if (appUser.role !== role) {
      appUser = { ...appUser, role };
      await serverDb.upsertUser(appUser);
    }
    // A staff directory row in "deactivated" state loses all access immediately,
    // including Clerk sessions — the role checks on protected routes are not enough
    // if the session predates the deactivation.
    if (isStaffRole(appUser.role)) {
      const directory = await serverDb.getStaffByUserId(appUser.id);
      if (directory?.status === "deactivated") {
        return res.status(403).json({ success:false, error:"This staff account has been deactivated. Contact the workshop owner." });
      }
      if (await isUserRevoked({ id: appUser.id, iat: 1 })) {
        return res.status(401).json({ success:false, error:"Session revoked. Sign in again." });
      }
    }
    (req as any).user = { id: appUser.id, clerkId: userId, role: appUser.role, name: appUser.name, phone: appUser.phone, email: appUser.email };
    next();
  } catch (err) {
    logger.warn({ err }, "[Clerk] authentication failed");
    return res.status(401).json({ success:false, error:"Invalid or expired session token." });
  }
}

// Active authentication boundary used by every protected route.
const authenticate: express.RequestHandler = (env.AUTH_PROVIDER === "clerk" ? requireClerkAuth : authenticateToken) as express.RequestHandler;

function legacyAuthOnly(_req: express.Request, res: express.Response, next: express.NextFunction) {
  if (env.AUTH_PROVIDER === "clerk") return res.status(404).json({ success:false, error:"Legacy auth endpoint disabled (AUTH_PROVIDER=clerk)." });
  next();
}
function clerkAuthOnly(_req: express.Request, res: express.Response, next: express.NextFunction) {
  if (env.AUTH_PROVIDER !== "clerk") return res.status(404).json({ success:false, error:"Clerk auth endpoint disabled (AUTH_PROVIDER=legacy)." });
  next();
}

function checkAdminIpAllowlist(req: express.Request,res: express.Response,next: express.NextFunction){
  if(!env.ADMIN_IP_ALLOWLIST) return next();
  const allowlist=env.ADMIN_IP_ALLOWLIST.split(",").map(s=>s.trim()).filter(Boolean);
  const ip=(req.ip || req.headers["x-forwarded-for"] as string || "").split(",")[0].trim();
  if(allowlist.includes(ip) || allowlist.includes("*")) return next();
  logger.warn({ ip, path:req.path }, "[Admin] IP not in allowlist");
  return res.status(403).json({ success:false, error:"Admin access denied from this network." });
}

function getPagination(req: express.Request){ const page=Math.max(1, parseInt(req.query.page as string)||1); const limit=Math.min(100, Math.max(1, parseInt(req.query.limit as string)||20)); const offset=(page-1)*limit; return { page, limit, offset }; }

// Parses appointment date + time into a Date. Accepts 24h ("10:00") and 12h
// ("10:00 AM", "2:30 PM") formats, and slot ranges ("10:00 AM - 12:00 PM") by
// using the first time token. Returns an Invalid Date when unparsable so callers
// can reject it explicitly.
function parseAppointmentDateTime(date: string, time: string): Date {
  const match = String(time || "").match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  const parts = String(date || "").split("-").map(Number);
  if (!match || parts.length !== 3 || parts.some(n => !Number.isFinite(n))) return new Date(NaN);
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = (match[3] || "").toUpperCase();
  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  if (hours > 23 || minutes > 59) return new Date(NaN);
  const [y, m, d] = parts;
  return new Date(y, m - 1, d, hours, minutes, 0, 0);
}

app.post("/api/auth/admin/login", legacyAuthOnly, adminAuthLimiter, checkAdminIpAllowlist, async (req,res)=>{
  const v=validate(adminLoginSchema, req.body); if(!v.success) return res.status(400).json({ success:false, error:v.error });
  const { identifier, password }=v.data as any; const cleanIdent=String(identifier).trim(); const cleanPass=String(password).trim();
  if(!cleanIdent || !cleanPass) return res.status(400).json({ success:false, error:"Workshop staff email/phone and passcode are required." });

  const creds = await serverDb.findUserWithHash(cleanIdent);
  let user = creds?.user;

  // This is the staff-only sign-in boundary: customer (driver) credentials are
  // never accepted here, even when technically valid.
  if (user && !isStaffRole(user.role)) {
    await serverDb.createAuditLog({ actorId: cleanIdent, actorName: cleanIdent, actorRole: "customer", action: "admin:login:rejected-customer", entityType: "User", entityId: user.id, ip: req.ip, requestId: (req as any).id }).catch(()=>{});
    return res.status(403).json({ success:false, error:"This is the staff-only sign-in. Driver (customer) credentials are not accepted here." });
  }
  if (user) {
    const directory = await serverDb.getStaffByUserId(user.id);
    if (directory?.status === "deactivated") {
      await serverDb.createAuditLog({ actorId: cleanIdent, actorName: cleanIdent, actorRole: user.role, action: "admin:login:deactivated", entityType: "User", entityId: user.id, ip: req.ip, requestId: (req as any).id }).catch(()=>{});
      return res.status(403).json({ success:false, error:"This staff account has been deactivated. Contact the workshop owner." });
    }
  }

  let passwordOk = Boolean(creds?.passwordHash && await comparePassword(cleanPass, creds.passwordHash));

  // Backward-compat shim: an environment-configured ADMIN_EMAIL/ADMIN_PASSWORD
  // still signs in the workshop owner. The first success migrates the env
  // credential into the app DB (hashed), after which the DB path is authoritative.
  const adminEmail=env.ADMIN_EMAIL; const adminPhone=env.ADMIN_PHONE; const adminPass=env.ADMIN_PASSWORD;
  if (!passwordOk && adminPass) {
    const matchesEmail=Boolean(adminEmail && cleanIdent.toLowerCase()===adminEmail.toLowerCase());
    const matchesPhone=Boolean(adminPhone && phoneKey(cleanIdent)===phoneKey(adminPhone));
    if ((matchesEmail || matchesPhone) && await comparePassword(cleanPass, adminPass)) {
      const existingByEmail = adminEmail ? await prisma.user.findFirst({ where: { email: { equals: adminEmail.toLowerCase(), mode:"insensitive" } } }) : null;
      if (user && !isStaffRole(user.role)) user = { ...user, role: "owner" };
      if (!user) {
        user = {
          id: existingByEmail && isStaffRole(existingByEmail.role) ? existingByEmail.id : `owner-${Date.now()}`,
          name: (existingByEmail?.name) || env.ADMIN_NAME || (adminEmail ? adminEmail.split("@")[0] : "Workshop Administrator"),
          phone: existingByEmail?.phone || adminPhone || "+254 712 345 678",
          email: adminEmail || "admin@rollingrazors.co.ke",
          role: "owner",
          avatar: existingByEmail?.avatar || DEFAULT_STAFF_AVATAR,
          location: existingByEmail?.location || "Workshop HQ, Industrial Area, Nairobi",
          mustChangePassword: Boolean((existingByEmail as any)?.mustChangePassword),
        };
      }
      const envHash = await hashPassword(adminPass);
      await serverDb.upsertUser(user);
      await serverDb.setUserPassword(user.id, envHash, false);
      passwordOk = true;
    }
  }

  if (!passwordOk || !user) {
    await serverDb.createAuditLog({ actorId: cleanIdent, actorName: cleanIdent, actorRole: user?.role || "unknown", action: "admin:login:failed", entityType: "User", entityId: user?.id || cleanIdent, ip: req.ip, requestId: (req as any).id }).catch(()=>{});
    return res.status(401).json({ success:false, error:"Access Denied: Invalid workshop staff credentials." });
  }

  const sessionUser: User = { ...user, name: user.name || "Workshop Staff", avatar: user.avatar || DEFAULT_STAFF_AVATAR };
  const token=generateToken(sessionUser,8);
  res.cookie("admin_token", token, { httpOnly:true, secure: env.NODE_ENV==="production", sameSite:"strict", maxAge: 8*60*60*1000, path:"/" });
  await serverDb.createAuditLog({ actorId: sessionUser.id, actorName: sessionUser.name, actorRole: sessionUser.role, action: "admin:login:success", entityType: "User", entityId: sessionUser.id, ip: req.ip, requestId: (req as any).id }).catch(()=>{});
  return res.json({ success:true, user:{ ...sessionUser, mustChangePassword:Boolean(sessionUser.mustChangePassword), token }, token });
});

// First-login passcode change (mustChangePassword flow). Sets the stored hash,
// flips the flag off, activates an "invited" directory row, revokes every older
// session, and hands back a fresh token.
app.post("/api/auth/change-password", legacyAuthOnly, authenticate, adminAuthLimiter, async (req,res)=>{
  const v=validate(changePasswordSchema, req.body); if(!v.success) return res.status(400).json({ success:false, error:v.error });
  const { currentPassword, newPassword }=v.data as any;
  const sess=(req as any).user; if(!sess) return res.status(401).json({ success:false, error:"Authorization required." });
  const creds = await serverDb.getUserWithHashById(sess.id);
  if(!creds?.user || !creds.passwordHash) return res.status(401).json({ success:false, error:"No stored passcode found for this account." });
  const directory = await serverDb.getStaffByUserId(creds.user.id);
  if (directory?.status === "deactivated") return res.status(403).json({ success:false, error:"This staff account has been deactivated." });
  if(!(await comparePassword(String(currentPassword||""), creds.passwordHash))) {
    await serverDb.createAuditLog({ actorId: creds.user.id, actorName: creds.user.name, actorRole: creds.user.role, action: "auth:change-password:failed", entityType: "User", entityId: creds.user.id, ip: req.ip, requestId: (req as any).id }).catch(()=>{});
    return res.status(401).json({ success:false, error:"Current passcode is incorrect." });
  }
  const hash=await hashPassword(String(newPassword));
  await serverDb.setUserPassword(creds.user.id, hash, false);
  if (directory && directory.status === "invited") await serverDb.setStaffStatus(directory.id, "active");
  await kv.set(`${REVOKE_KEY_PREFIX}:${creds.user.id}`, String(Date.now()), 7*24*60*60).catch(()=>{});
  const token=generateToken({ ...creds.user, mustChangePassword:false }, 8);
  res.cookie("admin_token", token, { httpOnly:true, secure: env.NODE_ENV==="production", sameSite:"strict", maxAge: 8*60*60*1000, path:"/" });
  await serverDb.createAuditLog({ actorId: creds.user.id, actorName: creds.user.name, actorRole: creds.user.role, action: "auth:change-password:success", entityType: "User", entityId: creds.user.id, ip: req.ip, requestId: (req as any).id }).catch(()=>{});
  return res.json({ success:true, user:{ ...creds.user, mustChangePassword:false, token }, token });
});

function generateTempPassword(length=12): string {
  const chars="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let out=""; for(let i=0;i<length;i++) out+=chars[crypto.randomInt(chars.length)];
  return out;
}

// One-time owner bootstrap for a fresh installation. Guarded by the server-only
// BOOTSTRAP_TOKEN header — refuses to run when any owner/manager exists.
app.post("/api/admin/bootstrap", adminAuthLimiter, checkAdminIpAllowlist, async (req,res)=>{
  const token=(req.headers["x-bootstrap-token"] as string) || "";
  if(!env.BOOTSTRAP_TOKEN || !safeEqual(token, env.BOOTSTRAP_TOKEN)) return res.status(403).json({ success:false, error:"Invalid bootstrap token." });
  const v=validate(bootstrapSchema, req.body); if(!v.success) return res.status(400).json({ success:false, error:v.error });
  const input=v.data as any;
  const existingAdmin = await prisma.user.findFirst({ where: { role: { in: ["owner", "manager"] } } });
  if (existingAdmin) return res.status(409).json({ success:false, error:"Administration is already set up. Bootstrap is only allowed on a fresh installation." });
  const phoneClean=normalizePhoneKe(input.phone);
  const emailClean=String(input.email).trim().toLowerCase();
  const directory=await serverDb.getStaff();
  if (directory.some(s => phonesMatch(s.phone, phoneClean))) return res.status(409).json({ success:false, error:"A directory entry already exists for this phone number." });
  if (directory.some(s => (s.email || "").toLowerCase() === emailClean)) return res.status(409).json({ success:false, error:"A directory entry already exists for this email." });
  const tempPassword = input.password || generateTempPassword();
  const hash=await hashPassword(tempPassword);
  const id=`owner-${Date.now()}-${crypto.randomUUID().slice(0,6)}`;
  const createdUser: User = { id, name: input.name, phone: phoneClean, email: emailClean, role: "owner", avatar: DEFAULT_STAFF_AVATAR, location: "Workshop HQ, Industrial Area, Nairobi", mustChangePassword: true };
  await serverDb.createStaffAccount({ userId: id, staffId: id, name: input.name, role: "owner", phone: phoneClean, email: emailClean, avatar: DEFAULT_STAFF_AVATAR, passwordHash: hash, specialty: "Workshop Administration" });
  await serverDb.createAuditLog({ actorId: id, actorName: input.name, actorRole: "owner", action: "admin:bootstrap", entityType: "User", entityId: id, after: { ...createdUser } as any, ip: req.ip, requestId: (req as any).id }).catch(()=>{});
  return res.status(201).json({ success:true, message:"Workshop administration initialised. Sign in with the phone/email and the one-time passcode below, then change it on first access.", temporaryPassword: tempPassword, user: createdUser });
});

app.post("/api/auth/customer/login", legacyAuthOnly, customerAuthLimiter, async (req,res)=>{
  const v=validate(customerLoginSchema, req.body); if(!v.success) return res.status(400).json({ success:false, error:v.error });
  const { identifier, phone, password }=v.data as any;
  const loginIdentifier = String(identifier || phone || '').trim();
  if(!loginIdentifier) return res.status(400).json({ success:false, error:"Email or phone is required." });
  if(!identifier && !isValidKePhone(loginIdentifier)) return res.status(400).json({ success:false, error:"Invalid Kenyan phone number." });
  const creds=await serverDb.findUserWithHash(loginIdentifier);
  let customer=creds?.user;
  if(!customer){
    const custs=await serverDb.getCustomers(); const custRecord=custs.find(c=> identifier ? String(c.email || '').toLowerCase() === loginIdentifier.toLowerCase() : phonesMatch(c.phone, loginIdentifier));
    if(custRecord){ customer={ id:custRecord.id, name:custRecord.name, phone:custRecord.phone, email:custRecord.email, role:"customer", avatar:custRecord.avatar||"", location:custRecord.address }; }
  }
  if(!customer) return res.status(404).json({ success:false, error:"No driver account found with this email. Please register first." });
  if(!creds?.passwordHash || !(await comparePassword(String(password), creds.passwordHash)))
    return res.status(401).json({ success:false, error:"Incorrect password. If you registered before passwords were enabled, contact the workshop to reset your password." });
  const token=generateToken(customer, 24*7);
  res.cookie("rr_auth_token", token, { httpOnly:true, secure: env.NODE_ENV==="production", sameSite:"strict", maxAge: 7*24*60*60*1000, path:"/" });
  return res.json({ success:true, user:customer });
});

app.post("/api/auth/customer/register", legacyAuthOnly, customerAuthLimiter, async (req,res)=>{
  const v=validate(customerRegisterSchema, req.body); if(!v.success) return res.status(400).json({ success:false, error:v.error });
  const { name, phone, email, password }=v.data as any; const formattedPhone=normalizePhoneKe(String(phone));
  if(!isValidKePhone(String(phone))) return res.status(400).json({ success:false, error:"Invalid Kenyan phone number. Must be Safaricom 07... format." });
  const existing=await serverDb.findUser(String(phone)); if(existing) return res.status(409).json({ success:false, error:"An account with this phone number already exists. Please sign in." });
  const newId=`cust-${Date.now()}-${crypto.randomUUID().slice(0,8)}`; const newUser: User={ id:newId, name:String(name).trim(), phone:formattedPhone, email: email?String(email).trim().toLowerCase():`${String(name).toLowerCase().replace(/\s+/g,".")}@gmail.com`, role:"customer", avatar:"https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80", location:"Nairobi, Kenya" };
  const passwordHash = await hashPassword(String(password));
  await serverDb.upsertUser(newUser);
  await serverDb.setUserPassword(newUser.id, passwordHash);
  const newCustomer: Customer={ id:newId, name:newUser.name, phone:newUser.phone, email:newUser.email, avatar:newUser.avatar, totalSpent:0, status:"New", address:"Nairobi, Kenya", savedVehicles:[] };
  await serverDb.saveCustomer(newCustomer); const token=generateToken(newUser, 24*7);
  res.cookie("rr_auth_token", token, { httpOnly:true, secure: env.NODE_ENV==="production", sameSite:"strict", maxAge: 7*24*60*60*1000, path:"/" });
  return res.status(201).json({ success:true, user:newUser });
});

app.post("/api/auth/logout", async (req,res)=>{
  // Clerk sessions end client-side via clerk.signOut(); Clerk tokens are short
  // lived and stateless so no server-side denylist is required. We still clear
  // the legacy admin cookie and revoke a legacy jti if one is presented.
  const h=req.headers.authorization;
  const legacyToken = h?.startsWith("Bearer ") ? h.split(" ")[1] : ((req as any).cookies?.rr_auth_token || (req as any).cookies?.admin_token);
  if(legacyToken){ const d=verifyToken(legacyToken); if(d?.jti) await tokenDenylist.add(d.jti, 7*24*60*60); }
  res.clearCookie("admin_token", { httpOnly:true, secure: env.NODE_ENV==="production", sameSite:"strict", path:"/" });
  res.clearCookie("rr_auth_token", { httpOnly:true, secure: env.NODE_ENV==="production", sameSite:"strict", path:"/" });
  return res.json({ success:true, message:"Logged out." });
});

// Clerk profile sync/verify: returns the application profile for the verified Clerk session.
app.post("/api/auth/sync", clerkAuthOnly, async (req,res)=>{
  try {
    const { userId, sessionClaims } = getAuth(req);
    if(!userId) return res.status(401).json({ success:false, error:"Authentication required." });
    const role = await resolveClerkRole(userId, sessionClaims);
    const appUser = await syncClerkProfile(userId, sessionClaims, role);
    return res.json({ success:true, valid:true, user:{ id:appUser.id, clerkId:userId, name:appUser.name, phone:appUser.phone, email:appUser.email, role:appUser.role, avatar:appUser.avatar, location:appUser.location } });
  } catch(err) {
    logger.warn({ err }, "[Clerk] profile sync failed");
    return res.status(401).json({ success:false, error:"Unable to sync Clerk profile." });
  }
});

app.get("/api/build-draft", authenticate, async (req,res)=>{
  const user=(req as any).user;
  const draft=await serverDb.getBuildDraft(user.id);
  return res.json({ success:true, draft: draft || null });
});

app.put("/api/build-draft", authenticate, async (req,res)=>{
  const v=validate(buildDraftSchema, req.body);
  if(!v.success) return res.status(400).json({ success:false, error:v.error });
  const user=(req as any).user;
  const draft=await serverDb.saveBuildDraft(user.id, v.data as { material:string; color:string; pattern:string });
  return res.json({ success:true, draft });
});

app.delete("/api/build-draft", authenticate, async (req,res)=>{
  const user=(req as any).user;
  await serverDb.deleteBuildDraft(user.id);
  return res.json({ success:true });
});

app.get("/api/auth/verify", legacyAuthOnly, async (req,res)=>{
  let token: string | undefined;
  const h=req.headers.authorization;
  if(h?.startsWith("Bearer ")) token=h.split(" ")[1];
  else if((req as any).cookies?.rr_auth_token) token=(req as any).cookies.rr_auth_token;
  else if((req as any).cookies?.admin_token) token=(req as any).cookies.admin_token;
  if(!token) return res.status(401).json({ valid:false, error:"Missing Bearer token." });
  const d=verifyToken(token); if(!d) return res.status(401).json({ valid:false, error:"Token signature invalid or expired." });
  const revoked = await isRevoked(d);
  if (revoked) return res.status(401).json({ valid:false, error:"Token revoked." });
  return res.json({ valid:true, user:d });
});

app.get("/api/bookings", authenticate, async (req,res)=>{
  const { page, limit }=getPagination(req);
  const status=req.query.status as string|undefined; const q=req.query.q as string|undefined;
  const user=(req as any).user;
  const customerId=isStaffRole(user.role) ? (req.query.customerId as string|undefined) : user.id;
  const { data: bookings, total }=await serverDb.getBookingsPaginated(customerId, status, page, limit, q);
  const sanitized = isStaffRole(user.role) ? bookings : bookings.map(b => ({ ...b, internalNotes: undefined }));
  res.json({ success:true, bookings: sanitized, pagination:{ page, limit, total, pages:Math.ceil(total/limit) } });
});

app.post("/api/bookings", authenticate, async (req,res)=>{
  const v=validate(bookingCreateSchema, req.body); if(!v.success) return res.status(400).json({ success:false, error:v.error });
  const input=v.data as any;
  const user=(req as any).user;
  const customerId=isStaffRole(user.role) ? input.customerId : user.id;
  if (!customerId) return res.status(400).json({ success:false, error:"A customer account is required." });
  const customer = await serverDb.getCustomer(customerId);
  if (!customer) return res.status(404).json({ success:false, error:"Customer account not found." });
  const service = await prisma.service.findUnique({ where: { id: input.serviceId } });
  if (!service) return res.status(400).json({ success:false, error:"Selected service is no longer available." });
  const appointment = parseAppointmentDateTime(input.appointmentDate, input.appointmentTime);
  if (Number.isNaN(appointment.getTime()) || appointment.getTime() < Date.now()) return res.status(400).json({ success:false, error:"Appointment must be a valid future date and time." });
  const slotStart = appointment.toISOString();
  const conflictingBooking=await prisma.booking.findFirst({ where:{ slotStart: appointment, status:{ in:["pending","confirmed","checked_in","in_progress","quality_check","ready"] } } });
  if(conflictingBooking) return res.status(409).json({ success:false, error:"That appointment slot is already reserved. Please choose another time." });
  const bookingId=`RR-${Date.now().toString().slice(-6)}${Math.floor(100+Math.random()*900)}`;
  const workOrderId=`RR-WO-${bookingId.replace('RR-','')}`;
  const estimatedPrice=Math.max(0, Math.round(service.startingPrice));
  const customerName=isStaffRole(user.role) ? customer.name : user.name;
  const customerPhone=normalizePhoneKe(isStaffRole(user.role) ? customer.phone : user.phone);
  const consentTimestamp = new Date();
  const bookingData: Booking={
    id:bookingId, customerId, customerName, customerPhone, customerEmail:customer.email,
    serviceId:service.id, serviceName:service.name, vehicleDetails:{ ...input.vehicleDetails, registrationNo: input.vehicleDetails.registrationNo.toUpperCase() },
    requirementsDesc:input.requirementsDesc, notes:input.notes, customOptions:input.customOptions, referencePhotos:input.referencePhotos, selectedMaterial:input.selectedMaterial, stitchingStyle:input.stitchingStyle,
    appointmentDate:input.appointmentDate, appointmentTime:input.appointmentTime, slotStart, locationType:input.locationType, customerLocation:input.customerLocation, customerLocationAddress:input.customerLocationAddress,
    estimatedPrice, depositAmount: Math.round(estimatedPrice*0.35), balanceAmount: Math.round(estimatedPrice*0.65), depositPaid:false, paymentStatus:"pending",     status:"pending", workOrderId, createdAt:new Date().toISOString(), privacyAcceptedAt:consentTimestamp.toISOString(), termsAcceptedAt:consentTimestamp.toISOString(), timeline:[{ status:"pending", timestamp:new Date().toLocaleString(), title:"Booking Created", note:`Appointment requested for ${input.vehicleDetails.make} ${input.vehicleDetails.model}.`, updatedBy:customerName }],
  };
  const dynamicMaterials:string[]=[bookingData.selectedMaterial||'Automotive Leather / Vinyl','High Density Ergonomic Foam Cushioning','Bonded Heavy-Duty Seam Thread'];
  const newWorkOrder: WorkOrder={ id:workOrderId, bookingId, customerId, customerName:bookingData.customerName, customerPhone:bookingData.customerPhone, vehicleDisplayName:`${bookingData.vehicleDetails.make} ${bookingData.vehicleDetails.model} (${bookingData.vehicleDetails.year})`, vehicleRegistration:bookingData.vehicleDetails.registrationNo, serviceName:bookingData.serviceName, assignedStaffId:bookingData.assignedStaffId, assignedStaffName:bookingData.assignedStaffName||'Unassigned', priority:'Normal', stage:'BOOKED', customerRequirements:bookingData.requirementsDesc||'Standard custom upholstery package', materialsRequired:dynamicMaterials, estimatedCost:bookingData.estimatedPrice, actualCost:undefined, beforePhotos:[], progressPhotos:[], afterPhotos:[], progressPercentage:10, createdAt:new Date().toISOString().split('T')[0], targetCompletionDate:bookingData.appointmentDate };
  try {
    const { booking: savedBooking, workOrder: savedWorkOrder }=await serverDb.createBookingWithWorkOrder(bookingData, newWorkOrder);
    res.status(201).json({ success:true, booking:savedBooking, workOrder:savedWorkOrder });
  } catch(e:any){
    if(String(e.message).includes("Unique")||String(e).includes("unique")) return res.status(409).json({ success:false, error:"That appointment slot was just reserved. Please choose another time." });
    throw e;
  }
});

app.patch("/api/bookings/:id", authenticate, async (req,res)=>{
  const { id }=req.params; const existing=await serverDb.getBooking(id); if(!existing) return res.status(404).json({ success:false, error:"Booking not found." });
  const user=(req as any).user; const isAdmin = isStaffRole(user.role);

  // Customers may only cancel their own booking (free cancellation up to 24h is
  // advertised on the public site). Cancellation releases the appointment slot.
  if (!isAdmin) {
    if(existing.customerId && existing.customerId!==user.id && !phonesMatch(existing.customerPhone, user.phone||"")) return res.status(403).json({ success:false, error:"Forbidden." });
    const filtered:any={}; for(const k of ["status"]) if(k in req.body) filtered[k]=req.body[k];
    if(Object.keys(filtered).length===0) return res.status(403).json({ success:false, error:"Customers can only update status to cancelled." });
    if(filtered.status!=="cancelled") return res.status(403).json({ success:false, error:"Forbidden." });
    const v=serverDb.validateBookingTransition(existing.status, filtered.status);
    if(!v.valid) return res.status(409).json({ success:false, error:v.error });
    filtered.slotStart = null;
    const before={ ...existing };
    const updated=await serverDb.updateBooking(id, filtered);
    await serverDb.createAuditLog({ actorId:user.id, actorName:user.name, actorRole:user.role, action:"booking:cancelled", entityType:"Booking", entityId:id, before, after:updated, ip:req.ip, requestId:(req as any).id });
    return res.json({ success:true, booking:updated });
  }

  const canUpdate = await authorize(user.role, "bookings", "update");
  const canConfirm = await authorize(user.role, "bookings", "confirm");
  if (!canUpdate && !canConfirm) return res.status(403).json({ success:false, error:"Forbidden." });
  // Confirm-only roles (receptionist) may record the deposit and confirm or
  // cancel, but cannot reassign staff or edit internal notes — those stay with
  // owner/manager who hold the full bookings:update policy row.
  const allowed = canUpdate
    ? ["status","assignedStaffId","assignedStaffName","paymentStatus","paymentMethod","mpesaReceiptNo","depositPaid","depositAmount","balanceAmount","internalNotes"]
    : ["status","paymentStatus","paymentMethod","mpesaReceiptNo","depositPaid","depositAmount","balanceAmount"];
  const patch:any={}; for(const k of allowed) if(k in req.body) patch[k]=req.body[k];
  if(patch.status){
    if(!canUpdate && !["confirmed","cancelled"].includes(patch.status)) return res.status(403).json({ success:false, error:"Receptionist can only confirm or cancel bookings." });
    const v=serverDb.validateBookingTransition(existing.status, patch.status);
    if(!v.valid) return res.status(409).json({ success:false, error:v.error });
    if(patch.status==="confirmed" && !existing.depositPaid && !patch.depositPaid) return res.status(409).json({ success:false, error:"Cannot confirm booking without deposit. Record M-Pesa payment first." });
    if(patch.status==="cancelled") patch.slotStart = null;
  }
  const before={ ...existing };
  const updated=await serverDb.updateBooking(id, patch);
  await serverDb.createAuditLog({ actorId:user.id, actorName:user.name, actorRole:user.role, action:`booking:${patch.status||"update"}`, entityType:"Booking", entityId:id, before, after:updated, ip:req.ip, requestId:(req as any).id });
  res.json({ success:true, booking:updated });
});

app.get("/api/vehicles", authenticate, async (req,res)=>{
  const { page, limit }=getPagination(req);
  const user=(req as any).user;
  const customerId=isStaffRole(user.role) ? (req.query.customerId as string|undefined) : user.id;
  const { data: vehicles, total }=await serverDb.getVehiclesPaginated(customerId, page, limit);
  res.json({ success:true, vehicles, pagination:{ page, limit, total, pages:Math.ceil(total/limit) } });
});

app.post("/api/vehicles", authenticate, async (req,res)=>{
  const v=validate(vehicleCreateSchema, req.body); if(!v.success) return res.status(400).json({ success:false, error:v.error });
  const vehicleData=v.data as Vehicle; const user=(req as any).user;
  const customerId=isStaffRole(user.role) ? vehicleData.customerId : user.id;
  if (!customerId) return res.status(400).json({ success:false, error:"A customer account is required." });
  const newVehicle: Vehicle={ ...vehicleData, customerId, id:`veh_${Date.now()}_${crypto.randomUUID().slice(0,6)}`, registrationNo:vehicleData.registrationNo.toUpperCase(), previousServicesCount:0 };
  const result=await serverDb.addVehicle(newVehicle);
  if(result.conflict) return res.status(409).json({ success:false, error:"That registration number is already registered to another account." });
  res.status(result.created ? 201 : 200).json({ success:true, vehicle:result.vehicle, alreadyExists:!result.created });
});

app.delete("/api/vehicles/:id", authenticate, async (req,res)=>{
  const { id }=req.params; const vehicles=await serverDb.getVehicles(); const target=vehicles.find(v=>v.id===id); if(!target) return res.status(404).json({ success:false, error:"Vehicle not found." });
  const user=(req as any).user; if(!isStaffRole(user.role) && target.customerId && target.customerId!==user.id) return res.status(403).json({ success:false, error:"You can only delete your own vehicles." });
  const deleted=await serverDb.deleteVehicle(id); if(!deleted) return res.status(404).json({ success:false, error:"Vehicle not found." }); res.json({ success:true, message:"Vehicle deleted." });
});

app.get("/api/work-orders", authenticate, async (req,res)=>{
  const { page, limit }=getPagination(req);
  const user=(req as any).user;
  const customerId = isStaffRole(user.role) ? undefined : user.id;
  const { data: workOrders, total }=await serverDb.getWorkOrdersPaginated(customerId, page, limit);
  const sanitized = isStaffRole(user.role) ? workOrders : workOrders.map(wo => ({ ...wo, internalNotes: undefined }));
  return res.json({ success:true, workOrders: sanitized, pagination:{ page, limit, total, pages:Math.ceil(total/limit) } });
});

app.patch("/api/work-orders/:id", authenticate, requireCasbin("work-orders","update"), async (req,res)=>{
  const { id }=req.params; const allowed=["stage","progressPercentage","assignedStaffId","assignedStaffName","priority","internalNotes","actualCost","version","beforePhotos","progressPhotos","afterPhotos","targetCompletionDate","materialsRequired"]; const patch:any={}; for(const k of allowed) if(k in req.body) patch[k]=req.body[k];
  const user=(req as any).user;
  const result=await serverDb.updateWorkOrderWithVersion(id, patch, { id:user.id, name:user.name, role:user.role, ip:req.ip, requestId:(req as any).id });
  if(result.conflict) return res.status(409).json({ success:false, error:result.error, conflict:true });
  if(result.error) return res.status(404).json({ success:false, error:result.error });
  if(patch.stage && ["VEHICLE_RECEIVED","MATERIALS_PREPARED"].includes(patch.stage)){
    const low=await serverDb.getLowStock();
    if(low.length) logger.warn({ workOrderId:id, low:low.map((i:any)=>i.sku) }, "[Inventory] low stock warning on stage transition");
  }
  res.json({ success:true, workOrder:result.workOrder });
});

/**
 * Storage & Image Upload Endpoints
 * Supports pluggable zero-cost Cloudinary, Supabase Storage, and Local fallback.
 */
app.post("/api/uploads", authenticate, async (req, res) => {
  const v = validate(uploadImageSchema, req.body);
  if (!v.success) return res.status(400).json({ success: false, error: v.error });
  const { category, entityId, originalFilename, mimeType, base64Data } = v.data;
  const user = (req as any).user;
  // Privacy is defined by the server-side category policy. Never allow a client
  // to mark customer or work-order photos as public.
  const isPrivate = category.startsWith("work-order") || category === "booking-reference";

  try {
    const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(cleanBase64, "base64");

    const result = await storageService.uploadImage(buffer, {
      category,
      entityId: entityId || (category === "booking-reference" ? user.id : undefined),
      originalFilename,
      mimeType,
      isPrivate,
      userId: user.id,
    });

    res.status(201).json({ success: true, file: result });
  } catch (err: any) {
    logger.error({ err, category }, "[Upload] Upload failed");
    const unavailable = err instanceof DurableStorageRequiredError;
    res.status(unavailable ? 503 : 400).json({ success: false, error: err.message || "Failed to process image upload." });
  }
});

// Secure file access for locally stored images or signed token verification
app.get("/api/uploads/file/:encodedKey", (req, res, next) => {
  const key = decodeURIComponent(req.params.encodedKey);
  const isPrivate = key.startsWith("work-order") || key.startsWith("booking-reference");
  if (isPrivate) return authenticate(req, res, next);
  next();
}, async (req, res) => {
  const { encodedKey } = req.params;
  const key = decodeURIComponent(encodedKey);
  const isPrivate = key.startsWith("work-order") || key.startsWith("booking-reference");

  if (isPrivate) {
    let authorized = false;
    const user = (req as any).user;
    if (user && isStaffRole(user.role)) {
      authorized = true;
    } else if (user && key.includes(user.id)) {
      authorized = true;
    } else if (user) {
      const parts = key.split("/");
      const entityId = parts[1];
      if (entityId && entityId !== "general") {
        const booking = await serverDb.getBooking(entityId);
        if (booking && (booking.customerId === user.id || phonesMatch(booking.customerPhone, user.phone || ""))) {
          authorized = true;
        } else {
          const wo = await serverDb.getWorkOrder(entityId);
          if (wo && wo.customerId === user.id) authorized = true;
        }
      }
    }

    if (!authorized) {
      return res.status(403).json({ success: false, error: "Access denied to private workshop asset." });
    }
  }

  if (isPrivate && storageService.providerName !== "local") {
    try {
      const signedUrl = await storageService.getSignedUrl(key, 300);
      const imageResponse = await fetch(signedUrl);
      if (!imageResponse.ok) {
        logger.warn({ key, status: imageResponse.status }, "[Storage] Private image provider returned an error");
        return res.status(503).json({ success: false, error: "Private image is temporarily unavailable." });
      }
      res.setHeader("Content-Type", imageResponse.headers.get("content-type") || "application/octet-stream");
      res.setHeader("Content-Disposition", "inline");
      res.setHeader("Cache-Control", "private, no-store");
      res.setHeader("X-Content-Type-Options", "nosniff");
      return res.send(Buffer.from(await imageResponse.arrayBuffer()));
    } catch (err) {
      logger.error({ err, key }, "[Storage] Could not sign private image URL");
      return res.status(503).json({ success: false, error: "Private image is temporarily unavailable." });
    }
  }

  const filePath = storageService.localProvider.getFilePath(key);
  if (!filePath) {
    return res.status(404).json({ success: false, error: "File not found." });
  }

  const ext = path.extname(filePath).toLowerCase();
  const mimeMap: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".heic": "image/heic",
  };
  const contentType = mimeMap[ext] || "application/octet-stream";
  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", "inline");
  res.setHeader("Cache-Control", isPrivate ? "private, max-age=3600" : "public, max-age=86400, immutable");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.sendFile(filePath);
});

// Delete uploaded image (creator or admin only)
app.delete("/api/uploads/:encodedKey", authenticate, async (req, res) => {
  const { encodedKey } = req.params;
  const key = decodeURIComponent(encodedKey);
  const user = (req as any).user;

  if (!isStaffRole(user.role) && !key.includes(user.id)) {
    return res.status(403).json({ success: false, error: "Forbidden: insufficient permissions to delete asset." });
  }

  const deleted = await storageService.deleteImage(key);
  res.json({ success: deleted });
});

app.get("/api/invoices", authenticate, async (req,res)=>{
  const { page, limit }=getPagination(req);
  const user=(req as any).user;
  const customerId=isStaffRole(user.role) ? (req.query.customerId as string|undefined) : user.id;
  const { data: invoices, total }=await serverDb.getInvoicesPaginated(customerId, page, limit);
  res.json({ success:true, invoices, pagination:{ page, limit, total, pages:Math.ceil(total/limit) } });
});

app.patch("/api/invoices/:id", authenticate, requireAdmin, requireCasbin("invoices","update"), async (req,res)=>{
  const { id }=req.params; const allowed=["paymentStatus","paymentMethod","mpesaRef","depositPaid","balanceDue"]; const patch:any={}; for(const key of allowed) if(key in req.body) patch[key]=req.body[key];
  if(!Object.keys(patch).length) return res.status(400).json({ success:false, error:"No supported invoice fields supplied." });
  if("balanceDue" in patch && (!Number.isInteger(patch.balanceDue)||patch.balanceDue<0)) return res.status(400).json({ success:false,error:"Balance due must be a non-negative whole number." });
  const updated=await serverDb.updateInvoice(id, patch); if(!updated) return res.status(404).json({ success:false, error:"Invoice not found." }); res.json({ success:true, invoice:updated });
});

app.get("/api/customers", authenticate, requireCasbin("customers","read"), async (req,res)=>{
  const { page, limit }=getPagination(req);
  const { data: customers, total }=await serverDb.getCustomersPaginated(page, limit);
  res.json({ success:true, customers, pagination:{ page, limit, total, pages:Math.ceil(total/limit) } });
});
app.get("/api/audit-logs", authenticate, requireAdmin, requireCasbin("audit-logs","read"), async (req,res)=>{
  const entityType=req.query.entityType as string|undefined; const entityId=req.query.entityId as string|undefined; const limit=Math.min(100, parseInt(req.query.limit as string)||20);
  const logs=await serverDb.getAuditLogs(entityType, entityId, limit);
  res.json({ success:true, logs });
});
app.get("/api/inventory", authenticate, requireAdmin, requireCasbin("inventory","read"), async (_req,res)=>{
  const items=await serverDb.getInventory();
  const low=await serverDb.getLowStock();
  res.json({ success:true, inventory:items, lowStock:low });
});
app.get("/api/inventory/low", authenticate, requireAdmin, requireCasbin("inventory","read"), async (_req,res)=>{
  const low=await serverDb.getLowStock();
  res.json({ success:true, lowStock:low });
});
app.get("/api/staff", authenticate, requireAdmin, requireCasbin("staff","read"), async (_req,res)=>{ res.json({ success:true, staff: await serverDb.getStaff() }); });
app.post("/api/staff", authenticate, requireAdmin, requireCasbin("staff","create"), async (req,res)=>{
  const v=validate(staffCreateSchema, req.body); if(!v.success) return res.status(400).json({ success:false, error:v.error });
  const input=v.data as any;
  const actor=(req as any).user;
  if(input.role==="owner" && actor.role!=="owner") return res.status(403).json({ success:false, error:"Only the workshop owner can assign the owner role." });
  const phoneClean=normalizePhoneKe(input.phone);
  const emailClean=input.email ? String(input.email).trim().toLowerCase() : "";
  const directory=await serverDb.getStaff();
  if(directory.some(s=>phonesMatch(s.phone, phoneClean))) return res.status(409).json({ success:false, error:"A staff member with this phone number already exists." });
  if(emailClean && directory.some(s=>(s.email||"").toLowerCase()===emailClean)) return res.status(409).json({ success:false, error:"A staff member with this email already exists." });
  // Reuse an existing non-staff profile by id when a driver later registered under
  // the same contact; otherwise mint a fresh staff account sharing one id.
  const existingByPhone = await serverDb.findUser(phoneClean).catch(()=>undefined);
  const existingByEmail = !existingByPhone && emailClean ? await serverDb.findUser(emailClean).catch(()=>undefined) : undefined;
  const existing = existingByPhone || existingByEmail;
  if(existing && isStaffRole(existing.role)) return res.status(409).json({ success:false, error:"An active staff profile already exists for this person." });
  const tempPassword = input.password || generateTempPassword();
  const hash=await hashPassword(tempPassword);
  const staffId=`staff-${crypto.randomUUID().slice(0,8)}`;
  const userId = existing && !isStaffRole(existing.role) ? existing.id : staffId;
  try {
    await serverDb.createStaffAccount({ userId, staffId, name: input.name, role: input.role, phone: phoneClean, email: emailClean || undefined, avatar: input.avatar || DEFAULT_STAFF_AVATAR, passwordHash: hash, specialization: input.specialization, specialty: input.specialty });
  } catch (e: any) {
    if (e?.code === "P2002") return res.status(409).json({ success:false, error:"A staff account with this phone or email already exists." });
    logger.error({ err: e }, "[Staff] create failed");
    return res.status(500).json({ success:false, error:"Could not create the staff account. Please try again." });
  }
  const staff=await serverDb.getStaffById(staffId);
  await serverDb.createAuditLog({ actorId: actor.id, actorName: actor.name, actorRole: actor.role, action: "staff:create", entityType: "Staff", entityId: staffId, after: { id: staffId, name: input.name, role: input.role, phone: phoneClean, email: emailClean } as any, ip: req.ip, requestId: (req as any).id }).catch(()=>{});
  return res.status(201).json({ success:true, staff, temporaryPassword: tempPassword, message:"Staff member created. Send them the one-time passcode and privacy notice; they must change it on first sign-in." });
});

app.patch("/api/staff/:id", authenticate, requireAdmin, requireCasbin("staff","update"), async (req,res)=>{
  const { id }=req.params;
  const v=validate(staffUpdateSchema, req.body); if(!v.success) return res.status(400).json({ success:false, error:v.error });
  const input=v.data as any;
  const actor=(req as any).user;
  const existing=await serverDb.getStaffById(id); if(!existing) return res.status(404).json({ success:false, error:"Staff member not found." });
  if(input.role!==undefined && input.role!=="owner" && existing.role==="owner" && actor.role!=="owner") return res.status(403).json({ success:false, error:"Only the workshop owner can change the owner's role." });
  if(input.role==="owner" && actor.role!=="owner") return res.status(403).json({ success:false, error:"Only the workshop owner can assign the owner role." });
  const patch:any={};
  if(input.name!==undefined) patch.name=input.name;
  if(input.phone!==undefined) patch.phone=normalizePhoneKe(input.phone);
  if(input.email!==undefined) patch.email=String(input.email).trim().toLowerCase() || undefined;
  if(input.role!==undefined) patch.role=input.role;
  if(input.specialization!==undefined) patch.specialization=input.specialization;
  if(input.specialty!==undefined) patch.specialty=input.specialty;
  if(input.avatar!==undefined) patch.avatar=input.avatar;
  const current=await serverDb.getStaff();
  if(patch.email && current.some(s=>s.id!==id && (s.email||"").toLowerCase()===patch.email)) return res.status(409).json({ success:false, error:"A staff member with this email already exists." });
  if(patch.phone && current.some(s=>s.id!==id && phonesMatch(s.phone, patch.phone))) return res.status(409).json({ success:false, error:"A staff member with this phone number already exists." });
  const before={ ...existing };
  const updated=await serverDb.updateStaffRecord(id, patch as Partial<Staff>); if(!updated) return res.status(404).json({ success:false, error:"Staff member not found." });
  if(patch.role && existing.userId) {
    await serverDb.updateUserRole(existing.userId, patch.role);
    // A role change takes effect immediately: demote/promote revokes outstanding
    // sessions so reduced permissions cannot be bypassed by a stale elevated token.
    if(patch.role !== existing.role) await kv.set(`${REVOKE_KEY_PREFIX}:${existing.userId}`, String(Date.now()), 7*24*60*60).catch(()=>{});
  }
  await serverDb.createAuditLog({ actorId: actor.id, actorName: actor.name, actorRole: actor.role, action: "staff:update", entityType: "Staff", entityId: id, before, after: updated, ip: req.ip, requestId: (req as any).id }).catch(()=>{});
  return res.json({ success:true, staff: updated });
});

app.post("/api/staff/:id/deactivate", authenticate, requireAdmin, requireCasbin("staff","update"), async (req,res)=>{
  const { id }=req.params;
  const actor=(req as any).user;
  const existing=await serverDb.getStaffById(id); if(!existing) return res.status(404).json({ success:false, error:"Staff member not found." });
  if(existing.userId && existing.userId===actor.id) return res.status(403).json({ success:false, error:"You cannot deactivate your own account." });
  if(existing.role==="owner" && actor.role!=="owner") return res.status(403).json({ success:false, error:"Only the workshop owner can deactivate the owner." });
  if(existing.status==="deactivated") return res.status(409).json({ success:false, error:"This staff member is already deactivated." });
  const updated=await serverDb.setStaffStatus(id, "deactivated"); if(!updated) return res.status(404).json({ success:false, error:"Staff member not found." });
  // Soft deactivate: the directory row stays (history preserved) but every
  // outstanding session is revoked and logins are blocked until reactivated.
  if(existing.userId) await kv.set(`${REVOKE_KEY_PREFIX}:${existing.userId}`, String(Date.now()), 7*24*60*60).catch(()=>{});
  await serverDb.createAuditLog({ actorId: actor.id, actorName: actor.name, actorRole: actor.role, action: "staff:deactivated", entityType: "Staff", entityId: id, before: { ...existing }, after: updated, ip: req.ip, requestId: (req as any).id }).catch(()=>{});
  return res.json({ success:true, staff: updated, message:"Staff member deactivated. Active sessions were revoked." });
});

app.post("/api/staff/:id/reactivate", authenticate, requireAdmin, requireCasbin("staff","update"), async (req,res)=>{
  const { id }=req.params;
  const actor=(req as any).user;
  const existing=await serverDb.getStaffById(id); if(!existing) return res.status(404).json({ success:false, error:"Staff member not found." });
  const updated=await serverDb.setStaffStatus(id, "active"); if(!updated) return res.status(404).json({ success:false, error:"Staff member not found." });
  await serverDb.createAuditLog({ actorId: actor.id, actorName: actor.name, actorRole: actor.role, action: "staff:reactivated", entityType: "Staff", entityId: id, before: { ...existing }, after: updated, ip: req.ip, requestId: (req as any).id }).catch(()=>{});
  return res.json({ success:true, staff: updated, message:"Staff member reactivated and can sign in again." });
});
app.get("/api/services", async (_req,res)=>{
  const services=await prisma.service.findMany({ orderBy:{ startingPrice:"asc" } });
  res.json({ success:true, services });
});
app.post("/api/services", authenticate, requireAdmin, requireCasbin("services","update"), async (req,res)=>{
  const body=req.body || {};
  if(typeof body.name!=="string" || body.name.trim().length<2 || !Number.isInteger(body.startingPrice) || body.startingPrice<0) return res.status(400).json({ success:false, error:"Service name and a non-negative whole-number price are required." });
  try {
    const service=await prisma.service.create({ data:{ id:`svc_${crypto.randomUUID()}`, name:body.name.trim(), category:body.category||null, shortDesc:body.shortDesc||"", longDesc:body.longDesc||body.shortDesc||"", startingPrice:body.startingPrice, estimatedDuration:body.estimatedDuration||"1 - 2 Days", image:body.image||"", iconName:body.iconName||"Scissors", isFeatured:Boolean(body.isFeatured), popular:Boolean(body.popular), includedFeatures:Array.isArray(body.includedFeatures)?body.includedFeatures:[], materialsAvailable:Array.isArray(body.materialsAvailable)?body.materialsAvailable:[] } });
    res.status(201).json({ success:true, service });
  } catch(error:any) { if(error?.code==="P2002") return res.status(409).json({ success:false, error:"A service with this name already exists." }); throw error; }
});
app.patch("/api/services/:id", authenticate, requireAdmin, requireCasbin("services","update"), async (req,res)=>{
  const body=req.body || {}; const data:any={};
  if("startingPrice" in body){ if(!Number.isInteger(body.startingPrice)||body.startingPrice<0) return res.status(400).json({ success:false,error:"Price must be a non-negative whole number." }); data.startingPrice=body.startingPrice; }
  if("isFeatured" in body) data.isFeatured=Boolean(body.isFeatured);
  if("popular" in body) data.popular=Boolean(body.popular);
  if("name" in body){ if(typeof body.name!=="string"||body.name.trim().length<2) return res.status(400).json({success:false,error:"Service name is invalid."}); data.name=body.name.trim(); }
  if("shortDesc" in body){ if(typeof body.shortDesc!=="string"||body.shortDesc.length>500) return res.status(400).json({success:false,error:"Short description must be 500 characters or fewer."}); data.shortDesc=body.shortDesc; }
  if("longDesc" in body){ if(typeof body.longDesc!=="string"||body.longDesc.length>3000) return res.status(400).json({success:false,error:"Full description must be 3,000 characters or fewer."}); data.longDesc=body.longDesc; }
  if("estimatedDuration" in body){ if(typeof body.estimatedDuration!=="string"||body.estimatedDuration.length>100) return res.status(400).json({success:false,error:"Estimated duration is invalid."}); data.estimatedDuration=body.estimatedDuration; }
  if("image" in body){ if(typeof body.image!=="string"||body.image.length>2000) return res.status(400).json({success:false,error:"Service image URL is invalid."}); data.image=body.image; }
  if(!Object.keys(data).length) return res.status(400).json({success:false,error:"No supported service fields supplied."});
  try { const service=await prisma.service.update({ where:{id:req.params.id}, data }); res.json({success:true,service}); }
  catch(error:any){ if(error?.code==="P2025") return res.status(404).json({success:false,error:"Service not found."}); if(error?.code==="P2002") return res.status(409).json({success:false,error:"A service with this name already exists."}); throw error; }
});

function getDarajaConfig(){
  const rawKey=env.MPESA_CONSUMER_KEY; const rawSecret=env.MPESA_CONSUMER_SECRET; const rawPasskey=env.MPESA_PASSKEY; const rawShortcode=env.MPESA_SHORTCODE; const rawEnv=env.MPESA_ENVIRONMENT;
  const isProd=rawEnv==="production"; const baseUrl=isProd?"https://api.safaricom.co.ke":"https://sandbox.safaricom.co.ke";
  let shortcode=rawShortcode; if(!shortcode||shortcode==="N/A"||shortcode==="none"||!/^\d+$/.test(shortcode)) shortcode=isProd?"":"174379";
  let passkey=rawPasskey; if(!passkey||passkey==="N/A"||passkey==="none"||passkey.length<20) passkey=isProd?"":"bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
  return { consumerKey:rawKey, consumerSecret:rawSecret, shortcode, passkey, baseUrl, isProd };
}
interface CachedToken{ token:string; expiresAt:number; }
let cachedDarajaToken: CachedToken|null=null; let tokenFetchPromise: Promise<string|null>|null=null; const lastQueryTimeMap=new Map<string,number>();
async function getDarajaAccessToken(): Promise<string|null>{
  const config=getDarajaConfig(); if(!config.consumerKey||!config.consumerSecret) return null;
  const now=Date.now(); if(cachedDarajaToken && now < cachedDarajaToken.expiresAt) return cachedDarajaToken.token;
  if(tokenFetchPromise) return tokenFetchPromise;
  tokenFetchPromise=(async()=>{
    try{
      const auth=Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString("base64");
      const darajaAuthRes=await fetch(`${config.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, { headers:{ Authorization:`Basic ${auth}`, "User-Agent":"Mozilla/5.0", Accept:"application/json" } });
      const text=await darajaAuthRes.text(); if(!darajaAuthRes.ok){ if(text.includes("Incapsula")||text.includes("<html")||darajaAuthRes.status===429) logger.warn("[M-PESA] WAF/rate limit"); else logger.error({ text:text.slice(0,300)}, "[M-PESA] OAuth failed"); return null; }
      let authData:any; try{ authData=JSON.parse(text);}catch{ logger.warn("[M-PESA] non-JSON OAuth"); return null; }
      const accessToken=authData.access_token; if(!accessToken) return null;
      const expiresInSec=Number(authData.expires_in)||3599; cachedDarajaToken={ token:accessToken, expiresAt: Date.now()+Math.max(60,expiresInSec-180)*1000 }; return accessToken;
    } catch(err){ logger.error({ err }, "[M-PESA] OAuth error"); return null; } finally{ tokenFetchPromise=null; }
  })(); return tokenFetchPromise;
}
async function queryDarajaStatus(checkoutRequestId:string): Promise<{ status:"SUCCESS"|"FAILED"|"PENDING"; receiptNumber?:string; failureReason?:string }>{
  const config=getDarajaConfig(); if(!config.consumerKey||!config.consumerSecret||!config.passkey||!config.shortcode) return { status:"PENDING" };
  const now=Date.now(); const lastTime=lastQueryTimeMap.get(checkoutRequestId)||0; if(now-lastTime<3500) return { status:"PENDING" }; lastQueryTimeMap.set(checkoutRequestId, now);
  try{
    const accessToken=await getDarajaAccessToken(); if(!accessToken) return { status:"PENDING" };
    const timestamp=new Date().toISOString().replace(/[-:T.Z]/g,"").slice(0,14); const password=Buffer.from(`${config.shortcode}${config.passkey}${timestamp}`).toString("base64");
    const qRes=await fetch(`${config.baseUrl}/mpesa/stkpushquery/v1/query`, { method:"POST", headers:{ Authorization:`Bearer ${accessToken}`, "User-Agent":"Mozilla/5.0", Accept:"application/json", "Content-Type":"application/json" }, body:JSON.stringify({ BusinessShortCode:config.shortcode, Password:password, Timestamp:timestamp, CheckoutRequestID:checkoutRequestId }) });
    const text=await qRes.text(); let qData:any; try{ qData=JSON.parse(text);}catch{ return { status:"PENDING" }; }
    if(qData.ResponseCode==="0"){ if(qData.ResultCode==="0"||qData.ResultCode===0) return { status:"SUCCESS", receiptNumber:qData.ResultDesc?.match(/[A-Z0-9]{10}/)?.[0]||`SDA${Date.now().toString(36).toUpperCase()}` }; else if(qData.ResultCode!==undefined && qData.ResultCode!==null) return { status:"FAILED", failureReason: qData.ResultDesc||`Safaricom error code ${qData.ResultCode}` }; }
  }catch(err){ logger.warn({ err }, "[M-PESA] query status notice"); }
  return { status:"PENDING" };
}

app.post("/api/mpesa/stkpush", mpesaLimiter, authenticate, async (req,res)=>{
  const v=validate(stkPushSchema, req.body); if(!v.success) return res.status(400).json({ success:false, error:v.error });
  const { phone, amount, bookingId, invoiceId, accountReference, transactionDesc }=v.data as any; const formattedPhone=toDarajaPhone(String(phone));
  if(!isValidKePhone(String(phone))) return res.status(400).json({ success:false, error:"Invalid Kenyan phone number." });
  if (!bookingId && !invoiceId) return res.status(400).json({ success: false, error: "A valid bookingId or invoiceId is required." });
  const user = (req as any).user;
  if (!user) return res.status(401).json({ success: false, error: "Authentication required." });
  if (bookingId) {
    const booking = await serverDb.getBooking(bookingId); if (!booking) return res.status(404).json({ success: false, error: "Booking not found." });
    if (!isStaffRole(user.role) && booking.customerId !== user.id) return res.status(403).json({ success: false, error: "Not your booking." });
    const expected = Math.round(booking.depositAmount);
    if (Math.round(Number(amount)) !== expected) return res.status(400).json({ success: false, error: `Amount mismatch: expected KES ${expected.toLocaleString()} for booking ${bookingId}.` });
    if (booking.depositPaid) return res.status(409).json({ success: false, error: "Deposit already paid for this booking." });
    const recentTx = await prisma.mpesaTransaction.findFirst({ where: { bookingId, status: "PENDING", createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) } } });
    if (recentTx) return res.status(409).json({ success: false, error: "STK push already pending for this booking. Check your phone or wait 5 minutes.", CheckoutRequestID: recentTx.checkoutRequestId });
  }
  if (invoiceId) {
    const inv = await serverDb.getInvoice(invoiceId); if (!inv) return res.status(404).json({ success: false, error: "Invoice not found." });
    if (!isStaffRole(user.role)) {
      const linkedBooking = inv.bookingId ? await serverDb.getBooking(inv.bookingId) : null;
      if (!linkedBooking || linkedBooking.customerId !== user.id) return res.status(403).json({ success: false, error: "Not your invoice." });
    }
    const expected = inv.balanceDue > 0 ? Math.round(inv.balanceDue) : Math.round(inv.total);
    if (Math.round(Number(amount)) !== expected) return res.status(400).json({ success: false, error: `Amount mismatch: expected KES ${expected.toLocaleString()} for invoice ${invoiceId}.` });
    if (inv.paymentStatus === "Paid" || inv.balanceDue <= 0) return res.status(409).json({ success: false, error: "Invoice is already fully paid." });
    const recentTx = await prisma.mpesaTransaction.findFirst({ where: { invoiceId, status: "PENDING", createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) } } });
    if (recentTx) return res.status(409).json({ success: false, error: "STK push already pending for this invoice. Check your phone or wait 5 minutes.", CheckoutRequestID: recentTx.checkoutRequestId });
  }
  const timestamp=new Date().toISOString().replace(/[-:T.Z]/g,"").slice(0,14); const config=getDarajaConfig();
  if(!config.consumerKey||!config.consumerSecret||!config.passkey||!config.shortcode){ logger.error("[M-PESA] Missing credentials"); return res.status(503).json({ success:false, error:"M-Pesa payment gateway unavailable: Daraja credentials not configured." }); }
  try{
    const accessToken=await getDarajaAccessToken(); if(!accessToken) return res.status(502).json({ success:false, error:"Failed to authenticate with Safaricom Daraja gateway. Please retry." });
    const password=Buffer.from(`${config.shortcode}${config.passkey}${timestamp}`).toString("base64"); const callbackUrl=`${env.APP_URL}/api/mpesa/callback`;
    const stkPayload={ BusinessShortCode:config.shortcode, Password:password, Timestamp:timestamp, TransactionType:"CustomerPayBillOnline", Amount:Math.round(Number(amount)), PartyA:formattedPhone, PartyB:config.shortcode, PhoneNumber:formattedPhone, CallBackURL:callbackUrl, AccountReference:accountReference||bookingId||"RollingRazors", TransactionDesc:transactionDesc||"Automotive Upholstery Deposit" };
    const stkRes=await fetch(`${config.baseUrl}/mpesa/stkpush/v1/processrequest`, { method:"POST", headers:{ Authorization:`Bearer ${accessToken}`, "User-Agent":"Mozilla/5.0", Accept:"application/json", "Content-Type":"application/json" }, body:JSON.stringify(stkPayload) });
    const text=await stkRes.text(); let darajaData:any; try{ darajaData=JSON.parse(text);}catch{ logger.error({ text }, "[M-PESA] non-JSON STK response"); return res.status(502).json({ success:false, error:"Safaricom gateway returned unexpected format. Please retry." }); }
    if(darajaData.ResponseCode==="0"){ await serverDb.saveTransaction({ merchantRequestId:darajaData.MerchantRequestID, checkoutRequestId:darajaData.CheckoutRequestID, bookingId, invoiceId, amount:Number(amount), phone:formattedPhone, status:"PENDING", createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() }); return res.json({ success:true, CheckoutRequestID:darajaData.CheckoutRequestID, MerchantRequestID:darajaData.MerchantRequestID, CustomerMessage:darajaData.CustomerMessage||"STK Push initiated successfully to "+formattedPhone }); }
    else { logger.error({ darajaData }, "[M-PESA] STK rejected"); const errMsg=darajaData.errorMessage||darajaData.ResponseDescription||darajaData.error_description||"Safaricom Daraja rejected the STK Push request."; return res.status(400).json({ success:false, errorCode:darajaData.errorCode||darajaData.ResponseCode, error:errMsg }); }
  }catch(err:any){ logger.error({ err }, "[M-PESA] STK network failure"); return res.status(502).json({ success:false, error:`Safaricom gateway connection error: ${err.message||"Network timeout"}` }); }
});

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(String(a ?? ""));
  const bb = Buffer.from(String(b ?? ""));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

// Verify-then-apply: a transaction may only reach SUCCESS/FAILED after Daraja
// (stkpushquery) confirms it. Callback bodies are never trusted on their own,
// and every application path (callback, query, reconcile) shares applyMpesaSuccess
// below so booking/invoice updates can never diverge between routes.
async function applyMpesaSuccess(existing: MpesaTransactionRecord, receiptNumber?: string): Promise<{ claimed: boolean }> {
  const receipt = receiptNumber || existing.receiptNumber || `SDA${Date.now().toString(36).toUpperCase()}`;
  let claimed = 0;
  await prisma.$transaction(async (tx) => {
    claimed = (await tx.mpesaTransaction.updateMany({ where: { checkoutRequestId: existing.checkoutRequestId, status: "PENDING" }, data: { status: "SUCCESS", receiptNumber: receipt } })).count;
    if (claimed === 0) return;
    if (existing.bookingId) await tx.booking.updateMany({ where: { id: existing.bookingId, depositPaid: false }, data: { paymentStatus: "deposit_paid", mpesaReceiptNo: receipt, status: "confirmed", depositPaid: true } });
    if (existing.invoiceId) {
      const inv = await tx.invoice.findUnique({ where: { id: existing.invoiceId } });
      if (inv) {
        const newPaid = (inv.depositPaid || 0) + existing.amount;
        const payStatus = newPaid >= inv.total ? "Paid" : "Deposit Paid";
        await (tx.invoice.update as any)({ where: { id: existing.invoiceId }, data: { depositPaid: newPaid, balanceDue: Math.max(0, inv.total - newPaid), paymentStatus: payStatus, mpesaRef: receipt || inv.mpesaRef } });
      }
    }
  });
  return { claimed: claimed > 0 };
}

async function verifyAndApplyMpesa(checkoutRequestId: string): Promise<{ status: "UNKNOWN" | "PENDING" | "SUCCESS" | "FAILED"; tx?: MpesaTransactionRecord }> {
  const tx = await serverDb.getTransaction(checkoutRequestId);
  if (!tx) return { status: "UNKNOWN" };
  if (tx.status !== "PENDING") return { status: tx.status, tx };
  const live = await queryDarajaStatus(checkoutRequestId);
  if (live.status === "SUCCESS") {
    await applyMpesaSuccess(tx, live.receiptNumber);
    return { status: "SUCCESS", tx: (await serverDb.getTransaction(checkoutRequestId)) || tx };
  }
  if (live.status === "FAILED") {
    return { status: "FAILED", tx: (await serverDb.updateTransaction(checkoutRequestId, { status: "FAILED", failureReason: live.failureReason })) || tx };
  }
  return { status: "PENDING", tx };
}

app.post("/api/mpesa/callback", callbackLimiter, async (req, res) => {
  if (!env.MPESA_CALLBACK_SECRET) {
    logger.error({ requestId: (req as any).id }, "[M-PESA] callback endpoint disabled because MPESA_CALLBACK_SECRET is not configured");
    return res.status(503).json({ ResultCode: 1, ResultDesc: "Callback endpoint is not configured" });
  }
  const token = String((req.headers["x-callback-token"] as string) || req.query.token || "").trim();
  if (!token || !safeEqual(token, env.MPESA_CALLBACK_SECRET)) {
    logger.warn({ ip: req.ip, requestId: (req as any).id }, "[M-PESA] callback auth failed");
    return res.status(401).json({ ResultCode: 1, ResultDesc: "Unauthorized callback" });
  }
  const stkCallback = req.body?.Body?.stkCallback;
  if (stkCallback?.CheckoutRequestID) {
    const checkoutRequestId = String(stkCallback.CheckoutRequestID);
    logger.info({ checkoutRequestId, resultCode: stkCallback.ResultCode, requestId: (req as any).id }, "[M-PESA] callback received");
    const existing = await serverDb.getTransaction(checkoutRequestId);
    if (!existing) {
      logger.warn({ checkoutRequestId, requestId: (req as any).id }, "[M-PESA] callback for unknown transaction");
    } else if (existing.status !== "PENDING") {
      logger.info({ checkoutRequestId, status: existing.status }, "[M-PESA] callback idempotent skip");
    } else {
      // Verify-then-apply: never trust the callback body alone — confirm with Daraja first.
      const live = await queryDarajaStatus(checkoutRequestId);
      if (live.status === "SUCCESS") {
        const callbackReceipt = Array.isArray(stkCallback.CallbackMetadata?.Item)
          ? stkCallback.CallbackMetadata.Item.find((i: any) => i?.Name === "MpesaReceiptNumber")?.Value
          : undefined;
        const result = await applyMpesaSuccess(existing, live.receiptNumber || callbackReceipt);
        logger.info({ checkoutRequestId, claimed: result.claimed }, "[M-PESA] callback verified SUCCESS via Daraja");
      } else if (live.status === "FAILED") {
        await serverDb.updateTransaction(checkoutRequestId, { status: "FAILED", failureReason: live.failureReason || stkCallback.ResultDesc || "STK transaction failed" });
      } else {
        logger.info({ checkoutRequestId }, "[M-PESA] callback received but Daraja status pending — left PENDING");
      }
    }
  }
  return res.json({ ResultCode: 0, ResultDesc: "Callback received successfully" });
});

app.get("/api/mpesa/query/:checkoutRequestId", authenticate, async (req, res) => {
  const { checkoutRequestId } = req.params;
  const result = await verifyAndApplyMpesa(checkoutRequestId);
  const tx = result.tx;
  if (!tx) return res.status(404).json({ success: false, error: "Transaction not found." });
  const user = (req as any).user;
  if (!isStaffRole(user.role) && tx.bookingId) {
    const booking = await serverDb.getBooking(tx.bookingId);
    if (!booking || booking.customerId !== user.id) return res.status(403).json({ success: false, error: "Not your transaction." });
  }
  return res.json({ success: true, transaction: tx });
});

app.get("/api/mpesa/transactions", authenticate, requireAdmin, async (req, res) => {
  const { page, limit } = getPagination(req);
  const { data: transactions, total } = await serverDb.getTransactionsPaginated(page, limit);
  res.json({ success: true, transactions, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});
app.post("/api/mpesa/reconcile", authenticate, requireAdmin, async (_req, res) => {
  const pendings = await prisma.mpesaTransaction.findMany({ where: { status: "PENDING", createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }, take: 20 });
  let checked = 0, updated = 0;
  for (const tx of pendings) {
    const r = await verifyAndApplyMpesa(tx.checkoutRequestId);
    if (r.status === "PENDING") continue;
    checked++;
    if (r.status !== "UNKNOWN") updated++;
  }
  res.json({ success: true, checked, updated });
});

// --- Paystack (card / bank / mobile-money deposits, KES) ---
// Paystack test vs live mode is decided by which secret key is configured; the
// API endpoint is identical for both. Transactions are persisted in the same
// table as M-Pesa using the Paystack `reference` as the checkoutRequestId, so
// the shared claim/apply/reconcile machinery handles them unchanged.
const PAYSTACK_API = "https://api.paystack.co";

function getPaystackConfig() {
  return { key: env.PAYSTACK_SECRET_KEY, isProd: env.PAYSTACK_ENVIRONMENT === "live" };
}

function makePaystackReference(): string {
  return `PSK-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

async function paystackVerify(reference: string): Promise<{ ok: boolean; status?: "SUCCESS" | "FAILED" | "PENDING"; amount?: number; receiptNumber?: string; failureReason?: string; error?: string }> {
  const cfg = getPaystackConfig();
  if (!cfg.key) return { ok: false, error: "Paystack gateway unavailable: secret key not configured." };
  try {
    const res = await fetch(`${PAYSTACK_API}/transaction/verify/${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${cfg.key}` } });
    const text = await res.text();
    let data: any; try { data = JSON.parse(text); } catch { data = {}; }
    if (!res.ok || !data?.status) return { ok: false, error: data?.message || `Paystack verification failed (HTTP ${res.status}).` };
    const t = data.data || {};
    const status = t.status === "success" ? "SUCCESS" : t.status === "failed" || t.status === "abandoned" ? "FAILED" : "PENDING";
    return { ok: true, status, amount: Number(t.amount), receiptNumber: typeof t.reference === "string" ? t.reference : String(t.id || reference), failureReason: t.gateway_response || undefined };
  } catch (err: any) {
    logger.error({ err }, "[PAYSTACK] verify network failure");
    return { ok: false, error: `Paystack connection error: ${err.message || "Network timeout"}` };
  }
}

app.post("/api/paystack/initialize", paystackLimiter, authenticate, async (req, res) => {
  const v = validate(paystackInitSchema, req.body);
  if (!v.success) return res.status(400).json({ success: false, error: v.error });
  const { amount, email, bookingId, invoiceId } = v.data as any;
  const cfg = getPaystackConfig();
  if (!cfg.key) return res.status(503).json({ success: false, error: "Paystack payment gateway unavailable: secret key not configured." });

  if (!bookingId && !invoiceId) return res.status(400).json({ success: false, error: "A valid bookingId or invoiceId is required." });
  const user = (req as any).user;
  if (!user) return res.status(401).json({ success: false, error: "Authentication required." });
  let payerEmail = (email || user?.email || "").trim();
  if (bookingId) {
    const booking = await serverDb.getBooking(bookingId);
    if (!booking) return res.status(404).json({ success: false, error: "Booking not found." });
    if (!isStaffRole(user.role) && booking.customerId !== user.id) return res.status(403).json({ success: false, error: "Not your booking." });
    const expected = Math.round(booking.depositAmount);
    if (Math.round(Number(amount)) !== expected) return res.status(400).json({ success: false, error: `Amount mismatch: expected KES ${expected.toLocaleString()} for booking ${bookingId}.` });
    if (booking.depositPaid) return res.status(409).json({ success: false, error: "Deposit already paid for this booking." });
    const recentTx = await prisma.mpesaTransaction.findFirst({ where: { bookingId, status: "PENDING", createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) } } });
    if (recentTx) {
      if (recentTx.merchantRequestId === "PAYSTACK") {
        // A stale Paystack checkout charges nothing until the popup is
        // completed, so fail it and let the customer retry with a fresh
        // checkout — unless it actually succeeded, in which case the deposit
        // is already paid.
        const stale = await paystackVerify(recentTx.checkoutRequestId);
        if (!stale.ok) return res.status(502).json({ success: false, error: "Could not confirm the previous checkout status with Paystack. Please try again in a moment." });
        if (stale.status === "SUCCESS") {
          await applyMpesaSuccess(recentTx, stale.receiptNumber || recentTx.checkoutRequestId);
          return res.status(409).json({ success: false, error: "Deposit already paid for this booking." });
        }
        await prisma.mpesaTransaction.update({ where: { checkoutRequestId: recentTx.checkoutRequestId }, data: { status: "FAILED", failureReason: stale.status === "FAILED" ? "Checkout abandoned." : "Superseded by a new checkout." } });
      } else {
        return res.status(409).json({ success: false, error: "A payment is already pending for this booking. Complete it or wait 5 minutes." });
      }
    }
    if (!payerEmail) {
      const customer = await serverDb.getCustomer(booking.customerId);
      payerEmail = customer?.email || "";
    }
  }
  if (invoiceId) {
    const inv = await serverDb.getInvoice(invoiceId);
    if (!inv) return res.status(404).json({ success: false, error: "Invoice not found." });
    if (!isStaffRole(user.role)) {
      const linkedBooking = inv.bookingId ? await serverDb.getBooking(inv.bookingId) : null;
      if (!linkedBooking || linkedBooking.customerId !== user.id) return res.status(403).json({ success: false, error: "Not your invoice." });
    }
    const expected = inv.balanceDue > 0 ? Math.round(inv.balanceDue) : Math.round(inv.total);
    if (Math.round(Number(amount)) !== expected) return res.status(400).json({ success: false, error: `Amount mismatch: expected KES ${expected.toLocaleString()} for invoice ${invoiceId}.` });
    if (inv.paymentStatus === "Paid" || inv.balanceDue <= 0) return res.status(409).json({ success: false, error: "Invoice is already fully paid." });
    const recentTx = await prisma.mpesaTransaction.findFirst({ where: { invoiceId, status: "PENDING", createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) } } });
    if (recentTx) {
      if (recentTx.merchantRequestId === "PAYSTACK") {
        const stale = await paystackVerify(recentTx.checkoutRequestId);
        if (!stale.ok) return res.status(502).json({ success: false, error: "Could not confirm previous checkout status. Please try again." });
        if (stale.status === "SUCCESS") {
          await applyMpesaSuccess(recentTx, stale.receiptNumber || recentTx.checkoutRequestId);
          return res.status(409).json({ success: false, error: "Invoice is already fully paid." });
        }
        await prisma.mpesaTransaction.update({ where: { checkoutRequestId: recentTx.checkoutRequestId }, data: { status: "FAILED", failureReason: "Superseded by a new checkout." } });
      } else {
        return res.status(409).json({ success: false, error: "A payment is already pending for this invoice. Complete it or wait 5 minutes." });
      }
    }
  }
  if (!payerEmail) payerEmail = "customer@rollingrazors.co.ke";

  const amountCents = Math.round(Number(amount) * 100);
  const reference = makePaystackReference();
  const callbackUrl = `${env.APP_URL}/checkout/callback?reference=${reference}`;
  try {
    const initRes = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email: payerEmail, amount: amountCents, currency: "KES", reference, callback_url: callbackUrl, metadata: { bookingId, invoiceId, amount: Math.round(Number(amount)) } }),
    });
    const text = await initRes.text();
    let initData: any; try { initData = JSON.parse(text); } catch { initData = {}; }
    if (!initRes.ok || !initData?.status || !initData?.data?.authorization_url) {
      logger.error({ initData }, "[PAYSTACK] initialize rejected");
      return res.status(502).json({ success: false, error: initData?.message || "Paystack could not start the checkout. Please try again." });
    }
    await serverDb.saveTransaction({
      merchantRequestId: "PAYSTACK",
      checkoutRequestId: reference,
      bookingId,
      invoiceId,
      amount: Math.round(Number(amount)),
      phone: String((req as any).user?.phone || "card-checkout").slice(0, 40),
      status: "PENDING",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    // Supersede any other lingering Paystack pendings for this booking so an
    // abandoned checkout can never double-charge or block a customer later.
    await prisma.mpesaTransaction.updateMany({ where: { bookingId, status: "PENDING", merchantRequestId: "PAYSTACK", checkoutRequestId: { not: reference } }, data: { status: "FAILED", failureReason: "Superseded by a new checkout." } });
    return res.json({ success: true, reference, authorization_url: initData.data.authorization_url, access_code: initData.data.access_code });
  } catch (err: any) {
    logger.error({ err }, "[PAYSTACK] initialize network failure");
    return res.status(502).json({ success: false, error: `Paystack connection error: ${err.message || "Network timeout"}` });
  }
});

app.get("/api/paystack/verify", authenticate, async (req, res) => {
  const reference = String(req.query.reference || "").trim();
  if (!reference) return res.status(400).json({ success: false, error: "Missing reference." });
  const tx = await serverDb.getTransaction(reference);
  if (!tx) return res.status(404).json({ success: false, error: "Transaction not found." });
  const user = (req as any).user;
  if (!isStaffRole(user.role) && tx.bookingId) {
    const booking = await serverDb.getBooking(tx.bookingId);
    if (!booking || booking.customerId !== user.id) return res.status(403).json({ success: false, error: "Not your transaction." });
  }
  const verified = await paystackVerify(reference);
  if (!verified.ok) return res.status(502).json({ success: false, error: verified.error });
  if (tx.status === "PENDING") {
    if (verified.status === "SUCCESS") {
      if (verified.amount !== undefined && Math.round(verified.amount) !== Math.round(tx.amount * 100)) {
        await serverDb.updateTransaction(reference, { status: "FAILED", failureReason: `Amount mismatch: Paystack charged ${verified.amount} subunits for a KES ${tx.amount} deposit.` });
      } else {
        const result = await applyMpesaSuccess(tx, verified.receiptNumber || reference);
        logger.info({ reference, claimed: result.claimed }, "[PAYSTACK] verify applied SUCCESS");
      }
    } else if (verified.status === "FAILED") {
      await serverDb.updateTransaction(reference, { status: "FAILED", failureReason: verified.failureReason || "Payment was not completed." });
    }
  }
  const current = await serverDb.getTransaction(reference);
  return res.json({ success: true, status: current?.status || verified.status, transaction: current });
});

app.post("/api/paystack/webhook", callbackLimiter, async (req, res) => {
  if (env.PAYSTACK_WEBHOOK_SECRET) {
    const signature = String(req.headers["x-paystack-signature"] || "").trim();
    const rawBody = Buffer.isBuffer((req as any).rawBody) ? (req as any).rawBody : Buffer.from(JSON.stringify(req.body || {}));
    const expected = crypto.createHmac("sha512", env.PAYSTACK_WEBHOOK_SECRET).update(rawBody).digest("hex");
    if (!signature || !safeEqual(signature, expected)) {
      logger.warn({ ip: req.ip, requestId: (req as any).id }, "[PAYSTACK] webhook signature invalid");
      return res.status(401).json({ success: false, error: "Invalid signature" });
    }
  }
  const event = req.body?.event;
  if (event === "charge.success") {
    const reference = String(req.body?.data?.reference || "").trim();
    if (reference) {
      logger.info({ reference, requestId: (req as any).id }, "[PAYSTACK] charge.success received");
      const existing = await serverDb.getTransaction(reference);
      if (!existing) {
        logger.warn({ reference, requestId: (req as any).id }, "[PAYSTACK] webhook for unknown transaction");
      } else if (existing.status !== "PENDING") {
        logger.info({ reference, status: existing.status }, "[PAYSTACK] webhook idempotent skip");
      } else {
        const verified = await paystackVerify(reference);
        if (verified.ok && verified.status === "SUCCESS") {
          if (verified.amount !== undefined && Math.round(verified.amount) !== Math.round(existing.amount * 100)) {
            logger.warn({ reference, charged: verified.amount, expected: existing.amount * 100 }, "[PAYSTACK] webhook amount mismatch");
            await serverDb.updateTransaction(reference, { status: "FAILED", failureReason: `Amount mismatch: Paystack charged ${verified.amount} subunits for a KES ${existing.amount} deposit.` });
          } else {
            const result = await applyMpesaSuccess(existing, verified.receiptNumber || reference);
            logger.info({ reference, claimed: result.claimed }, "[PAYSTACK] webhook applied SUCCESS");
          }
        } else {
          logger.warn({ reference, verified }, "[PAYSTACK] webhook could not confirm SUCCESS — left PENDING");
        }
      }
    }
  }
  return res.json({ success: true });
});
app.get("/api/health", async (_req,res)=>{
  const checks:any={ db:"unknown", daraja:"unknown", paystack:"unknown" };
  try{ await prisma.$queryRaw`SELECT 1`; checks.db="connected"; }catch(e){ checks.db="disconnected"; checks.dbError=String(e).slice(0,200); }
  const darajaCfg=getDarajaConfig(); checks.daraja= darajaCfg.consumerKey && darajaCfg.consumerSecret ? "configured" : "not_configured";
  checks.paystack= getPaystackConfig().key ? "configured" : "not_configured";
  checks.uptime=process.uptime(); checks.timestamp=new Date().toISOString(); checks.env=env.NODE_ENV;
  const status= checks.db==="connected" ? "ok" : "degraded";
  res.status(status==="ok"?200:503).json({ status, service:"Rolling Razors Customs API", authProvider: env.AUTH_PROVIDER, ...checks });
});
app.get("/api/openapi.json", (_req,res)=>{
  res.json({
    openapi:"3.0.0",
    info:{ title:"Rolling Razors Customs API", version:"1.0.0", description:"Kenyan automotive upholstery booking + M-Pesa Daraja" },
    servers:[{ url: env.APP_URL }],
    paths:{
      "/api/health":{ get:{ summary:"Health check" }},
      "/api/auth/customer/register":{ post:{ summary:"Register customer" }},
      "/api/auth/customer/login":{ post:{ summary:"Customer login" }},
      "/api/auth/admin/login":{ post:{ summary:"Admin login" }},
      "/api/bookings":{ get:{ summary:"List bookings (paginated)" }, post:{ summary:"Create booking" }},
      "/api/vehicles":{ get:{ summary:"List vehicles" }, post:{ summary:"Add vehicle" }},
      "/api/mpesa/stkpush":{ post:{ summary:"Initiate STK push" }},
      "/api/mpesa/callback":{ post:{ summary:"Daraja callback" }},
    }
  });
});
app.use("/api", (_req,res)=>res.status(404).json({ success:false, error:"API endpoint not found." }));
app.use((err:any,req:express.Request,res:express.Response,_next:express.NextFunction)=>{ Sentry.captureException(err, { extra:{ requestId:(req as any).id, path:req.path } }); logger.error({ err, requestId:(req as any).id }, "Unhandled error"); res.status(err.status||500).json({ success:false, error: env.NODE_ENV==="production"?"Internal server error.":err.message||"Internal error", requestId:(req as any).id }); });

/**
 * Build the shared Express app.
 *
 *   serveStatic: true  → attach the SPA serving layer (Vite dev middleware in
 *                        development, built `dist/` + index.html fallback in
 *                        production). Used by the local server entry and the
 *                        Vercel serverless handler.
 *   serveStatic: false → API-only app (no Vite / static assets).
 */
export async function createApp(opts: { serveStatic?: boolean } = {}): Promise<express.Express> {
  if (opts.serveStatic !== false) {
    if (env.NODE_ENV !== "production") {
      const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath, { maxAge: "1y", etag: true }));
      app.get("*", (_req, res) => { res.sendFile(path.join(distPath, "index.html")); });
    }
  }
  return app;
}

export { app };
