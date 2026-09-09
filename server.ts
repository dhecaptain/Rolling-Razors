import express from "express";
import path from "path";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import cookieParser from "cookie-parser";
import { createServer as createViteServer } from "vite";
import { env } from "./server/env";
import { logger } from "./server/logger";
import { serverDb } from "./server/db";
import { prisma } from "./server/prisma";
import { initSentry, Sentry } from "./server/sentry";
import { requireCasbin } from "./server/casbin/enforcer";
import { normalizePhoneKe, toDarajaPhone, phoneKey, phonesMatch, isValidKePhone } from "./server/phone";
import { validate, adminLoginSchema, customerLoginSchema, customerRegisterSchema, stkPushSchema, bookingCreateSchema, vehicleCreateSchema } from "./server/validators";
import { Booking, Customer, User, Vehicle, WorkOrder } from "./src/types";

initSentry();
const app = express();
const PORT = env.PORT;

app.use(cookieParser());
app.use((req, _res, next) => { (req as any).id = crypto.randomUUID(); next(); });

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https:", "blob:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.safaricom.co.ke", "https://sandbox.safaricom.co.ke"],
      frameAncestors: ["'none'"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true },
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

app.use(express.json({ limit: "100kb" }));
app.use(pinoHttp({
  logger,
  customProps: (req) => ({ requestId: (req as any).id }),
  redact: { paths: ["req.headers.authorization", "req.headers.cookie", "req.body.password", "req.body.otp"], censor: "[REDACTED]" },
}));
app.set("trust proxy", 1);

const generalLimiter = rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false });
const customerAuthLimiter = rateLimit({ windowMs: 60_000, max: 10, standardHeaders: true, legacyHeaders: false, message: { success:false, error:"Too many customer attempts. Try again shortly." } });
const adminAuthLimiter = rateLimit({ windowMs: 60_000, max: 5, standardHeaders: true, legacyHeaders: false, message: { success:false, error:"Too many admin attempts. Try again in 5 minutes." } });
const mpesaLimiter = rateLimit({ windowMs: 60_000, max: 6, standardHeaders: true, legacyHeaders: false, message: { success:false, error:"M-Pesa rate limit: please wait." } });
const otpLimiter = rateLimit({ windowMs: 60_000, max: 5, standardHeaders: true, legacyHeaders: false });
const callbackLimiter = rateLimit({ windowMs: 60_000, max: 60, standardHeaders: true, legacyHeaders: false });
app.use("/api/", generalLimiter);

const JWT_SECRET = env.AUTH_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 16) { logger.error("AUTH_SECRET missing"); if (env.NODE_ENV==="production") process.exit(1); }

function generateToken(user: User, expiresInHours=24): string {
  const jti = crypto.randomUUID();
  const payload={ sub:user.id, jti, id:user.id, name:user.name, email:user.email, phone:user.phone, role:user.role, location:user.location, iss:"rolling-razors-kenya", aud:"rolling-razors-app" };
  return jwt.sign(payload, JWT_SECRET, { algorithm:"HS256", expiresIn:`${expiresInHours}h` });
}
function verifyToken(token:string): any|null { try{ return jwt.verify(token, JWT_SECRET, { algorithms:["HS256"], issuer:"rolling-razors-kenya", audience:"rolling-razors-app" }); }catch{ return null; } }
async function hashPassword(p:string): Promise<string> { return bcrypt.hash(p, env.BCRYPT_ROUNDS); }
async function comparePassword(p:string, hash:string): Promise<boolean> { try{ return await bcrypt.compare(p, hash); }catch{ return p===hash; } }
function hashOtp(otp:string): string { return crypto.createHmac("sha256", env.OTP_HASH_SECRET).update(otp).digest("hex"); }

const tokenDenylist = new Set<string>();
function authenticateToken(req: express.Request,res: express.Response,next: express.NextFunction){
  let token: string | undefined;
  const h=req.headers.authorization;
  if(h?.startsWith("Bearer ")) token=h.split(" ")[1];
  else if((req as any).cookies?.admin_token) token=(req as any).cookies.admin_token;
  if(!token) return res.status(401).json({ success:false, error:"Authorization token required." });
  const d=verifyToken(token); if(!d) return res.status(401).json({ success:false, error:"Invalid or expired session token." }); if(d.jti && tokenDenylist.has(d.jti)) return res.status(401).json({ success:false, error:"Token revoked." }); (req as any).user=d; (req as any).token=token; next();
}
function authenticateOptional(req: express.Request,_res: express.Response,next: express.NextFunction){
  let token: string | undefined;
  const h=req.headers.authorization;
  if(h?.startsWith("Bearer ")) token=h.split(" ")[1];
  else if((req as any).cookies?.admin_token) token=(req as any).cookies.admin_token;
  if(token){ const d=verifyToken(token); if(d && !(d.jti && tokenDenylist.has(d.jti))) (req as any).user=d; } next();
}
function requireAdmin(req: express.Request,res: express.Response,next: express.NextFunction){ const u=(req as any).user; if(!u||u.role!=="admin") return res.status(403).json({ success:false, error:"Admin access required." }); next(); }
function checkAdminIpAllowlist(req: express.Request,res: express.Response,next: express.NextFunction){
  if(!env.ADMIN_IP_ALLOWLIST) return next();
  const allowlist=env.ADMIN_IP_ALLOWLIST.split(",").map(s=>s.trim()).filter(Boolean);
  const ip=(req.ip || req.headers["x-forwarded-for"] as string || "").split(",")[0].trim();
  if(allowlist.includes(ip) || allowlist.includes("*")) return next();
  logger.warn({ ip, path:req.path }, "[Admin] IP not in allowlist");
  return res.status(403).json({ success:false, error:"Admin access denied from this network." });
}

function getPagination(req: express.Request){ const page=Math.max(1, parseInt(req.query.page as string)||1); const limit=Math.min(100, Math.max(1, parseInt(req.query.limit as string)||20)); const offset=(page-1)*limit; return { page, limit, offset }; }

app.post("/api/auth/admin/login", adminAuthLimiter, checkAdminIpAllowlist, async (req,res)=>{
  const v=validate(adminLoginSchema, req.body); if(!v.success) return res.status(400).json({ success:false, error:v.error });
  const { identifier, password }=v.data as any; const cleanIdent=String(identifier).trim().toLowerCase(); const cleanPass=String(password).trim();
  const adminEmail=env.ADMIN_EMAIL; const adminPhone=env.ADMIN_PHONE; const adminPass=env.ADMIN_PASSWORD;
  if(!adminPass){ logger.error("[AUTH] ADMIN_PASSWORD not configured"); return res.status(500).json({ success:false, error:"Admin authentication service unavailable." }); }
  const matchesEmail=Boolean(adminEmail && cleanIdent===adminEmail); const matchesPhone=Boolean(adminPhone && phoneKey(cleanIdent)===phoneKey(adminPhone));
  let isPassMatch=false;
  if (adminPass.startsWith("$2a$") || adminPass.startsWith("$2b$")) isPassMatch=await comparePassword(cleanPass, adminPass);
  else isPassMatch=cleanPass===adminPass;
  if((!matchesEmail && !matchesPhone) || !isPassMatch) {
    await serverDb.createAuditLog({ actorId: cleanIdent, actorName: cleanIdent, actorRole: "admin", action: "admin:login:failed", entityType: "User", entityId: cleanIdent, ip: req.ip, requestId: (req as any).id }).catch(()=>{});
    return res.status(401).json({ success:false, error:"Access Denied: Invalid workshop staff credentials." });
  }
  const adminName=env.ADMIN_NAME || (adminEmail?adminEmail.split("@")[0]:"Workshop Administrator");
  let adminUser: User={ id:"staff-admin", name:adminName, phone:adminPhone||"+254 712 345 678", email:adminEmail||"admin@rollingrazors.co.ke", role:"admin", avatar:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80", location:"Workshop HQ, Industrial Area, Nairobi" };
  try {
    const existingByEmail = adminEmail ? await prisma.user.findUnique({ where: { email: adminEmail } }) : null;
    if (existingByEmail && existingByEmail.id !== adminUser.id) adminUser.id = existingByEmail.id;
  } catch {}
  await serverDb.upsertUser(adminUser);
  if(env.ADMIN_REQUIRE_2FA){
    const otp=Math.floor(100000+Math.random()*900000).toString(); const expiresAt=Date.now()+5*60*1000;
    await serverDb.saveOtp(`admin:${cleanIdent}`, hashOtp(otp), expiresAt);
    logger.info({ identifier: cleanIdent, requestId:(req as any).id }, "[Admin] 2FA OTP sent");
    return res.json({ success:false, requiresOtp:true, message:"OTP sent to workshop phone.", debugOtp: env.NODE_ENV!=="production"?otp:undefined });
  }
  const token=generateToken(adminUser,8);
  res.cookie("admin_token", token, { httpOnly:true, secure: env.NODE_ENV==="production", sameSite:"strict", maxAge: 8*60*60*1000, path:"/" });
  await serverDb.createAuditLog({ actorId: adminUser.id, actorName: adminUser.name, actorRole: "admin", action: "admin:login:success", entityType: "User", entityId: adminUser.id, ip: req.ip, requestId: (req as any).id }).catch(()=>{});
  return res.json({ success:true, user:{ ...adminUser, token }, token });
});

app.post("/api/auth/admin/verify-otp", adminAuthLimiter, checkAdminIpAllowlist, async (req,res)=>{
  const { identifier, otp }=req.body; if(!identifier || !otp) return res.status(400).json({ success:false, error:"Identifier and OTP required." });
  const key=`admin:${String(identifier).trim().toLowerCase()}`;
  const record=await serverDb.getOtp(key);
  const hashed=hashOtp(String(otp).trim());
  if(!record || record.expiresAt < Date.now() || (record.otp!==hashed && record.otp!==String(otp).trim())) return res.status(401).json({ success:false, error:"Invalid or expired OTP." });
  await serverDb.deleteOtp(key);
  const adminEmail=env.ADMIN_EMAIL; const adminPhone=env.ADMIN_PHONE;
  const adminName2=env.ADMIN_NAME || (adminEmail?adminEmail.split("@")[0]:"Workshop Administrator");
  let adminUser2: User={ id:"staff-admin", name:adminName2, phone:adminPhone||"+254 712 345 678", email:adminEmail||"admin@rollingrazors.co.ke", role:"admin", avatar:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80", location:"Workshop HQ, Industrial Area, Nairobi" };
  try {
    const existingByEmail2 = adminEmail ? await prisma.user.findUnique({ where: { email: adminEmail } }) : null;
    if (existingByEmail2 && existingByEmail2.id !== adminUser2.id) adminUser2.id = existingByEmail2.id;
  } catch {}
  await serverDb.upsertUser(adminUser2); const token=generateToken(adminUser2,8);
  res.cookie("admin_token", token, { httpOnly:true, secure: env.NODE_ENV==="production", sameSite:"strict", maxAge: 8*60*60*1000, path:"/" });
  await serverDb.createAuditLog({ actorId: adminUser2.id, actorName: adminUser2.name, actorRole: "admin", action: "admin:login:success:2fa", entityType: "User", entityId: adminUser2.id, ip: req.ip, requestId: (req as any).id }).catch(()=>{});
  return res.json({ success:true, user:{ ...adminUser2, token }, token });
});

app.post("/api/auth/customer/login", customerAuthLimiter, async (req,res)=>{
  const v=validate(customerLoginSchema, req.body); if(!v.success) return res.status(400).json({ success:false, error:v.error });
  const { phone, otp }=v.data as any; const key=phoneKey(String(phone));
  if(otp){
    if(!isValidKePhone(String(phone))) return res.status(400).json({ success:false, error:"Invalid Kenyan phone number." });
    const record=await serverDb.getOtp(key); const hashed=hashOtp(String(otp).trim());
    if(!record || record.expiresAt < Date.now() || (record.otp!==hashed && record.otp!==String(otp).trim())) return res.status(401).json({ success:false, error:"Invalid or expired OTP code." });
    await serverDb.deleteOtp(key);
  }
  let customer=await serverDb.findUser(String(phone));
  if(!customer){ const custs=await serverDb.getCustomers(); const custRecord=custs.find(c=>phonesMatch(c.phone, String(phone))); if(custRecord){ customer={ id:custRecord.id, name:custRecord.name, phone:custRecord.phone, email:custRecord.email, role:"customer", avatar:custRecord.avatar||"", location:custRecord.address }; await serverDb.upsertUser(customer); } }
  if(!customer) return res.status(404).json({ success:false, error:"No driver account found with this phone number. Please register first." });
  const token=generateToken(customer, 24*7); return res.json({ success:true, user:{ ...customer, token }, token });
});

app.post("/api/auth/customer/register", customerAuthLimiter, async (req,res)=>{
  const v=validate(customerRegisterSchema, req.body); if(!v.success) return res.status(400).json({ success:false, error:v.error });
  const { name, phone, email }=v.data as any; const formattedPhone=normalizePhoneKe(String(phone));
  if(!isValidKePhone(String(phone))) return res.status(400).json({ success:false, error:"Invalid Kenyan phone number. Must be Safaricom 07... format." });
  const existing=await serverDb.findUser(String(phone)); if(existing) return res.status(409).json({ success:false, error:"An account with this phone number already exists. Please sign in." });
  const newId=`cust-${Date.now()}-${crypto.randomUUID().slice(0,8)}`; const newUser: User={ id:newId, name:String(name).trim(), phone:formattedPhone, email: email?String(email).trim().toLowerCase():`${String(name).toLowerCase().replace(/\s+/g,".")}@gmail.com`, role:"customer", avatar:"https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80", location:"Nairobi, Kenya" };
  await serverDb.upsertUser(newUser); const newCustomer: Customer={ id:newId, name:newUser.name, phone:newUser.phone, email:newUser.email, avatar:newUser.avatar, totalSpent:0, status:"New", address:"Nairobi, Kenya", savedVehicles:[] };
  await serverDb.saveCustomer(newCustomer); const token=generateToken(newUser, 24*7);
  return res.status(201).json({ success:true, user:{ ...newUser, token }, token });
});

app.post("/api/auth/customer/send-otp", otpLimiter, async (req,res)=>{
  const { phone }=req.body; if(!phone||!String(phone).trim()) return res.status(400).json({ success:false, error:"Phone number is required." });
  if(!isValidKePhone(String(phone))) return res.status(400).json({ success:false, error:"Invalid Kenyan phone number." });
  const key=phoneKey(String(phone));
  const existing=await serverDb.getOtp(key); if(existing && existing.expiresAt > Date.now() - 4*60*1000) {
    const waitSec=Math.ceil((existing.expiresAt - Date.now())/1000);
    if(waitSec>240) return res.status(429).json({ success:false, error:`OTP already sent. Try again in ${waitSec-240}s.` });
  }
  const otp=Math.floor(100000+Math.random()*900000).toString(); const expiresAt=Date.now()+5*60*1000;
  const hashed=hashOtp(otp);
  await serverDb.saveOtp(key, hashed, expiresAt); logger.info({ phone:key, requestId:(req as any).id }, `[OTP] sent expiresIn=300s`);
  return res.json({ success:true, message:`OTP sent via SMS to ${normalizePhoneKe(String(phone))}.`, expiresInSeconds:300, debugOtp: env.NODE_ENV!=="production" ? otp : undefined });
});

app.post("/api/auth/logout", authenticateToken, async (req,res)=>{
  const user=(req as any).user; if(user?.jti) tokenDenylist.add(user.jti);
  res.clearCookie("admin_token", { httpOnly:true, secure: env.NODE_ENV==="production", sameSite:"strict", path:"/" });
  return res.json({ success:true, message:"Logged out." });
});

app.get("/api/auth/verify", (req,res)=>{
  let token: string | undefined;
  const h=req.headers.authorization;
  if(h?.startsWith("Bearer ")) token=h.split(" ")[1];
  else if((req as any).cookies?.admin_token) token=(req as any).cookies.admin_token;
  if(!token) return res.status(401).json({ valid:false, error:"Missing Bearer token." });
  const d=verifyToken(token); if(!d) return res.status(401).json({ valid:false, error:"Token signature invalid or expired." });
  if(d.jti && tokenDenylist.has(d.jti)) return res.status(401).json({ valid:false, error:"Token revoked." });
  return res.json({ valid:true, user:d });
});

app.get("/api/bookings", authenticateToken, async (req,res)=>{
  const { page, limit }=getPagination(req);
  const status=req.query.status as string|undefined; const q=req.query.q as string|undefined;
  const user=(req as any).user;
  const customerId=user.role === "admin" ? (req.query.customerId as string|undefined) : user.id;
  const { data: bookings, total }=await serverDb.getBookingsPaginated(customerId, status, page, limit, q);
  res.json({ success:true, bookings, pagination:{ page, limit, total, pages:Math.ceil(total/limit) } });
});

app.post("/api/bookings", authenticateToken, async (req,res)=>{
  const v=validate(bookingCreateSchema, req.body); if(!v.success) return res.status(400).json({ success:false, error:v.error });
  const input=v.data as any;
  const user=(req as any).user;
  const customerId=user.role === "admin" ? input.customerId : user.id;
  if (!customerId) return res.status(400).json({ success:false, error:"A customer account is required." });
  const customer = await serverDb.getCustomer(customerId);
  if (!customer) return res.status(404).json({ success:false, error:"Customer account not found." });
  const service = await prisma.service.findUnique({ where: { id: input.serviceId } });
  if (!service) return res.status(400).json({ success:false, error:"Selected service is no longer available." });
  const appointment = new Date(`${input.appointmentDate}T${input.appointmentTime}`);
  if (Number.isNaN(appointment.getTime()) || appointment.getTime() < Date.now()) return res.status(400).json({ success:false, error:"Appointment must be a valid future date and time." });
  const conflictingBooking=await prisma.booking.findFirst({ where:{ appointmentDate:input.appointmentDate, appointmentTime:input.appointmentTime, status:{ in:["pending","confirmed","in_progress"] } } });
  if(conflictingBooking) return res.status(409).json({ success:false, error:"That appointment slot is already reserved. Please choose another time." });
  const bookingId=`RR-${Date.now().toString().slice(-6)}${Math.floor(100+Math.random()*900)}`;
  const workOrderId=`RR-WO-${bookingId.replace('RR-','')}`;
  const estimatedPrice=Math.max(0, Math.round(service.startingPrice));
  const customerName=user.role === "admin" ? customer.name : user.name;
  const customerPhone=normalizePhoneKe(user.role === "admin" ? customer.phone : user.phone);
  const bookingData: Booking={
    id:bookingId, customerId, customerName, customerPhone, customerEmail:customer.email,
    serviceId:service.id, serviceName:service.name, vehicleDetails:{ ...input.vehicleDetails, registrationNo: input.vehicleDetails.registrationNo.toUpperCase() },
    requirementsDesc:input.requirementsDesc, notes:input.notes, customOptions:input.customOptions, referencePhotos:input.referencePhotos, selectedMaterial:input.selectedMaterial, stitchingStyle:input.stitchingStyle,
    appointmentDate:input.appointmentDate, appointmentTime:input.appointmentTime, locationType:input.locationType, customerLocation:input.customerLocation, customerLocationAddress:input.customerLocationAddress,
    estimatedPrice, depositAmount: Math.round(estimatedPrice*0.35), balanceAmount: Math.round(estimatedPrice*0.65), depositPaid:false, paymentStatus:"pending", status:"pending", workOrderId, createdAt:new Date().toISOString(), timeline:[{ status:"pending", timestamp:new Date().toLocaleString(), title:"Booking Created", note:`Appointment requested for ${input.vehicleDetails.make} ${input.vehicleDetails.model}.`, updatedBy:customerName }],
  };
  const dynamicMaterials:string[]=[bookingData.selectedMaterial||'Automotive Leather / Vinyl','High Density Ergonomic Foam Cushioning','Bonded Heavy-Duty Seam Thread'];
  const newWorkOrder: WorkOrder={ id:workOrderId, bookingId, customerId, customerName:bookingData.customerName, customerPhone:bookingData.customerPhone, vehicleDisplayName:`${bookingData.vehicleDetails.make} ${bookingData.vehicleDetails.model} (${bookingData.vehicleDetails.year})`, vehicleRegistration:bookingData.vehicleDetails.registrationNo, serviceName:bookingData.serviceName, assignedStaffId:bookingData.assignedStaffId, assignedStaffName:bookingData.assignedStaffName||'Unassigned', priority:'Normal', stage:'BOOKED', customerRequirements:bookingData.requirementsDesc||'Standard custom upholstery package', materialsRequired:dynamicMaterials, estimatedCost:bookingData.estimatedPrice, actualCost:undefined, beforePhotos:[], progressPhotos:[], afterPhotos:[], progressPercentage:10, createdAt:new Date().toISOString().split('T')[0], targetCompletionDate:bookingData.appointmentDate };
  const { booking: savedBooking, workOrder: savedWorkOrder }=await serverDb.createBookingWithWorkOrder(bookingData, newWorkOrder);
  res.status(201).json({ success:true, booking:savedBooking, workOrder:savedWorkOrder });
});

app.patch("/api/bookings/:id", authenticateToken, requireAdmin, requireCasbin("bookings","update"), async (req,res)=>{
  const { id }=req.params; const existing=await serverDb.getBooking(id); if(!existing) return res.status(404).json({ success:false, error:"Booking not found." });
  const user=(req as any).user; if(user.role!=="admin" && existing.customerId && existing.customerId!==user.id && !phonesMatch(existing.customerPhone, user.phone||"")) return res.status(403).json({ success:false, error:"Forbidden." });
  const allowed=["status","assignedStaffId","assignedStaffName","paymentStatus","paymentMethod","mpesaReceiptNo","depositPaid","depositAmount","balanceAmount","internalNotes"];
  if(user.role!=="admin"){
    const filtered:any={}; for(const k of ["status"] ) if(k in req.body) filtered[k]=req.body[k];
    if(Object.keys(filtered).length===0) return res.status(403).json({ success:false, error:"Customers can only update status to cancelled." });
    if(filtered.status!=="cancelled") return res.status(403).json({ success:false, error:"Forbidden." });
    const v=serverDb.validateBookingTransition(existing.status, filtered.status);
    if(!v.valid) return res.status(409).json({ success:false, error:v.error });
    const before={ ...existing };
    const updated=await serverDb.updateBooking(id, filtered);
    await serverDb.createAuditLog({ actorId:user.id, actorName:user.name, actorRole:user.role, action:`booking:${filtered.status}`, entityType:"Booking", entityId:id, before, after:updated, ip:req.ip, requestId:(req as any).id });
    return res.json({ success:true, booking:updated });
  }
  const patch:any={}; for(const k of allowed) if(k in req.body) patch[k]=req.body[k];
  if(patch.status){
    const v=serverDb.validateBookingTransition(existing.status, patch.status);
    if(!v.valid) return res.status(409).json({ success:false, error:v.error });
    if(patch.status==="confirmed" && !existing.depositPaid && !patch.depositPaid) return res.status(409).json({ success:false, error:"Cannot confirm booking without deposit. Record M-Pesa payment first." });
  }
  const before={ ...existing };
  const updated=await serverDb.updateBooking(id, patch);
  await serverDb.createAuditLog({ actorId:user.id, actorName:user.name, actorRole:user.role, action:`booking:${patch.status||"update"}`, entityType:"Booking", entityId:id, before, after:updated, ip:req.ip, requestId:(req as any).id });
  res.json({ success:true, booking:updated });
});

app.get("/api/vehicles", authenticateToken, async (req,res)=>{
  const { page, limit }=getPagination(req);
  const user=(req as any).user;
  const customerId=user.role === "admin" ? (req.query.customerId as string|undefined) : user.id;
  const { data: vehicles, total }=await serverDb.getVehiclesPaginated(customerId, page, limit);
  res.json({ success:true, vehicles, pagination:{ page, limit, total, pages:Math.ceil(total/limit) } });
});

app.post("/api/vehicles", authenticateToken, async (req,res)=>{
  const v=validate(vehicleCreateSchema, req.body); if(!v.success) return res.status(400).json({ success:false, error:v.error });
  const vehicleData=v.data as Vehicle; const user=(req as any).user;
  const customerId=user.role === "admin" ? vehicleData.customerId : user.id;
  if (!customerId) return res.status(400).json({ success:false, error:"A customer account is required." });
  try {
    const newVehicle: Vehicle={ ...vehicleData, customerId, id:`veh_${Date.now()}_${crypto.randomUUID().slice(0,6)}`, registrationNo:vehicleData.registrationNo.toUpperCase(), previousServicesCount:0 };
    const saved=await serverDb.addVehicle(newVehicle); res.status(201).json({ success:true, vehicle:saved });
  } catch(e:any){
    if(String(e.message).includes("Unique")||String(e).includes("unique")) return res.status(409).json({ success:false, error:`Vehicle with registration ${vehicleData.registrationNo.toUpperCase()} already exists.` });
    throw e;
  }
});

app.delete("/api/vehicles/:id", authenticateToken, async (req,res)=>{
  const { id }=req.params; const vehicles=await serverDb.getVehicles(); const target=vehicles.find(v=>v.id===id); if(!target) return res.status(404).json({ success:false, error:"Vehicle not found." });
  const user=(req as any).user; if(user.role!=="admin" && target.customerId && target.customerId!==user.id) return res.status(403).json({ success:false, error:"You can only delete your own vehicles." });
  const deleted=await serverDb.deleteVehicle(id); if(!deleted) return res.status(404).json({ success:false, error:"Vehicle not found." }); res.json({ success:true, message:"Vehicle deleted." });
});

app.get("/api/work-orders", authenticateToken, async (req,res)=>{
  const { page, limit }=getPagination(req);
  const user=(req as any).user;
  if (user.role === "admin") {
    const { data: workOrders, total }=await serverDb.getWorkOrdersPaginated(page, limit);
    return res.json({ success:true, workOrders, pagination:{ page, limit, total, pages:Math.ceil(total/limit) } });
  }
  const { data: bookings }=await serverDb.getBookingsPaginated(user.id, undefined, 1, 1000);
  const bookingIds=new Set(bookings.map(b=>b.id));
  const { data: workOrders, total }=await serverDb.getWorkOrdersPaginated(page, limit);
  const scoped=workOrders.filter(wo=>bookingIds.has(wo.bookingId));
  return res.json({ success:true, workOrders:scoped, pagination:{ page, limit, total:scoped.length, pages:Math.ceil(scoped.length/limit) } });
});

app.patch("/api/work-orders/:id", authenticateToken, requireAdmin, requireCasbin("work-orders","update"), async (req,res)=>{
  const { id }=req.params; const allowed=["stage","progressPercentage","assignedStaffId","assignedStaffName","priority","internalNotes","actualCost","version"]; const patch:any={}; for(const k of allowed) if(k in req.body) patch[k]=req.body[k];
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

app.get("/api/invoices", authenticateToken, async (req,res)=>{
  const { page, limit }=getPagination(req);
  const user=(req as any).user;
  const customerId=user.role === "admin" ? (req.query.customerId as string|undefined) : user.id;
  const { data: invoices, total }=await serverDb.getInvoicesPaginated(customerId, page, limit);
  res.json({ success:true, invoices, pagination:{ page, limit, total, pages:Math.ceil(total/limit) } });
});

app.patch("/api/invoices/:id", authenticateToken, requireAdmin, requireCasbin("invoices","update"), async (req,res)=>{
  const { id }=req.params; const allowed=["paymentStatus","paymentMethod","mpesaRef","depositPaid","balanceDue"]; const patch:any={}; for(const key of allowed) if(key in req.body) patch[key]=req.body[key];
  if(!Object.keys(patch).length) return res.status(400).json({ success:false, error:"No supported invoice fields supplied." });
  if("balanceDue" in patch && (!Number.isInteger(patch.balanceDue)||patch.balanceDue<0)) return res.status(400).json({ success:false,error:"Balance due must be a non-negative whole number." });
  const updated=await serverDb.updateInvoice(id, patch); if(!updated) return res.status(404).json({ success:false, error:"Invoice not found." }); res.json({ success:true, invoice:updated });
});

app.get("/api/customers", authenticateToken, requireAdmin, async (req,res)=>{
  const { page, limit }=getPagination(req);
  const { data: customers, total }=await serverDb.getCustomersPaginated(page, limit);
  res.json({ success:true, customers, pagination:{ page, limit, total, pages:Math.ceil(total/limit) } });
});
app.get("/api/audit-logs", authenticateToken, requireAdmin, requireCasbin("audit-logs","read"), async (req,res)=>{
  const entityType=req.query.entityType as string|undefined; const entityId=req.query.entityId as string|undefined; const limit=Math.min(100, parseInt(req.query.limit as string)||20);
  const logs=await serverDb.getAuditLogs(entityType, entityId, limit);
  res.json({ success:true, logs });
});
app.get("/api/inventory", authenticateToken, requireAdmin, requireCasbin("inventory","read"), async (_req,res)=>{
  const items=await serverDb.getInventory();
  const low=await serverDb.getLowStock();
  res.json({ success:true, inventory:items, lowStock:low });
});
app.get("/api/inventory/low", authenticateToken, requireAdmin, requireCasbin("inventory","read"), async (_req,res)=>{
  const low=await serverDb.getLowStock();
  res.json({ success:true, lowStock:low });
});
app.get("/api/staff", authenticateToken, requireAdmin, async (_req,res)=>{ res.json({ success:true, staff: await serverDb.getStaff() }); });
app.get("/api/services", async (_req,res)=>{
  const services=await prisma.service.findMany({ orderBy:{ startingPrice:"asc" } });
  res.json({ success:true, services });
});
app.post("/api/services", authenticateToken, requireAdmin, requireCasbin("services","update"), async (req,res)=>{
  const body=req.body || {};
  if(typeof body.name!=="string" || body.name.trim().length<2 || !Number.isInteger(body.startingPrice) || body.startingPrice<0) return res.status(400).json({ success:false, error:"Service name and a non-negative whole-number price are required." });
  try {
    const service=await prisma.service.create({ data:{ id:`svc_${crypto.randomUUID()}`, name:body.name.trim(), category:body.category||null, shortDesc:body.shortDesc||"", longDesc:body.longDesc||body.shortDesc||"", startingPrice:body.startingPrice, estimatedDuration:body.estimatedDuration||"1 - 2 Days", image:body.image||"", iconName:body.iconName||"Scissors", isFeatured:Boolean(body.isFeatured), popular:Boolean(body.popular), includedFeatures:Array.isArray(body.includedFeatures)?body.includedFeatures:[], materialsAvailable:Array.isArray(body.materialsAvailable)?body.materialsAvailable:[] } });
    res.status(201).json({ success:true, service });
  } catch(error:any) { if(error?.code==="P2002") return res.status(409).json({ success:false, error:"A service with this name already exists." }); throw error; }
});
app.patch("/api/services/:id", authenticateToken, requireAdmin, requireCasbin("services","update"), async (req,res)=>{
  const body=req.body || {}; const data:any={};
  if("startingPrice" in body){ if(!Number.isInteger(body.startingPrice)||body.startingPrice<0) return res.status(400).json({ success:false,error:"Price must be a non-negative whole number." }); data.startingPrice=body.startingPrice; }
  if("isFeatured" in body) data.isFeatured=Boolean(body.isFeatured);
  if("popular" in body) data.popular=Boolean(body.popular);
  if("name" in body){ if(typeof body.name!=="string"||body.name.trim().length<2) return res.status(400).json({success:false,error:"Service name is invalid."}); data.name=body.name.trim(); }
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

app.post("/api/mpesa/stkpush", mpesaLimiter, authenticateToken, async (req,res)=>{
  const v=validate(stkPushSchema, req.body); if(!v.success) return res.status(400).json({ success:false, error:v.error });
  const { phone, amount, bookingId, invoiceId, accountReference, transactionDesc }=v.data as any; const formattedPhone=toDarajaPhone(String(phone));
  if(!isValidKePhone(String(phone))) return res.status(400).json({ success:false, error:"Invalid Kenyan phone number." });
  if(bookingId){
    const booking=await serverDb.getBooking(bookingId); if(!booking) return res.status(404).json({ success:false, error:"Booking not found." });
    const user=(req as any).user;
    if(!user || (user.role!=="admin" && booking.customerId!==user.id)) return res.status(403).json({ success:false, error:"Not your booking." });
    const expected=Math.round(booking.depositAmount);
    if(Math.round(Number(amount))!==expected) return res.status(400).json({ success:false, error:`Amount mismatch: expected KES ${expected.toLocaleString()} for booking ${bookingId}.` });
    if(booking.depositPaid) return res.status(409).json({ success:false, error:"Deposit already paid for this booking." });
    const recentTx=await prisma.mpesaTransaction.findFirst({ where:{ bookingId, status:"PENDING", createdAt:{ gte: new Date(Date.now()-5*60*1000) } } });
    if(recentTx) return res.status(409).json({ success:false, error:"STK push already pending for this booking. Check your phone or wait 5 minutes.", CheckoutRequestID: recentTx.checkoutRequestId });
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

app.post("/api/mpesa/callback", callbackLimiter, async (req,res)=>{
  if(env.MPESA_CALLBACK_SECRET){
    const token=req.headers["x-callback-token"] as string || req.query.token as string;
    if(token!==env.MPESA_CALLBACK_SECRET) { logger.warn({ ip:req.ip }, "[M-PESA] callback auth failed"); return res.status(401).json({ ResultCode:1, ResultDesc:"Unauthorized callback" }); }
  }
  const body=req.body; logger.info({ body, requestId:(req as any).id }, "[M-PESA WEBHOOK] callback"); const stkCallback=body?.Body?.stkCallback;
  if(stkCallback){
    const checkoutRequestId=stkCallback.CheckoutRequestID; const resultCode=stkCallback.ResultCode;
    const existing=await serverDb.getTransaction(checkoutRequestId);
    if(!existing){ logger.warn({ checkoutRequestId }, "[M-PESA] callback for unknown transaction"); }
    else if(existing.status!=="PENDING"){ logger.info({ checkoutRequestId, status:existing.status }, "[M-PESA] callback idempotent skip");
    } else if(resultCode===0){
      let receiptNumber=existing.receiptNumber; const items=stkCallback?.CallbackMetadata?.Item||[]; for(const item of items) if(item.Name==="MpesaReceiptNumber") receiptNumber=item.Value;
      await prisma.$transaction(async (txClient)=>{
        const claimed=await txClient.mpesaTransaction.updateMany({ where:{ checkoutRequestId: checkoutRequestId, status:"PENDING" }, data:{ status:"SUCCESS", receiptNumber: receiptNumber as string } });
        if(claimed.count===0) return;
        if(existing.bookingId) await txClient.booking.updateMany({ where:{ id: existing.bookingId, depositPaid:false }, data:{ paymentStatus:"deposit_paid", mpesaReceiptNo:receiptNumber, status:"confirmed", depositPaid:true } });
        if(existing.invoiceId){
          const inv=await txClient.invoice.findUnique({ where:{ id: existing.invoiceId } });
          if(inv){ const newPaid=(inv.depositPaid||0)+existing.amount; let payStatus="Deposit Paid"; if(newPaid>=inv.total) payStatus="Paid"; await (txClient.invoice.update as any)({ where:{ id: existing.invoiceId }, data:{ depositPaid:newPaid, balanceDue:Math.max(0, inv.total-newPaid), paymentStatus:payStatus, mpesaRef: receiptNumber||inv.mpesaRef } }); }
        }
      });
    } else {
      await serverDb.updateTransaction(checkoutRequestId, { status:"FAILED", failureReason: stkCallback.ResultDesc||"User cancelled or failed STK transaction" });
    }
  }
  return res.json({ ResultCode:0, ResultDesc:"Callback received successfully" });
});

app.get("/api/mpesa/query/:checkoutRequestId", authenticateToken, async (req,res)=>{
  const { checkoutRequestId }=req.params; let tx=await serverDb.getTransaction(checkoutRequestId); if(!tx) return res.status(404).json({ success:false, error:"Transaction not found." });
  const user=(req as any).user;
  if(user.role!=="admin" && tx.bookingId){ const booking=await serverDb.getBooking(tx.bookingId); if(!booking || booking.customerId!==user.id) return res.status(403).json({ success:false, error:"Not your transaction." }); }
  if(tx.status==="PENDING"){
    const liveStatus=await queryDarajaStatus(checkoutRequestId);
    if(liveStatus.status==="SUCCESS"){
      const receiptNumber=liveStatus.receiptNumber||tx.receiptNumber||`SDA${Date.now().toString(36).toUpperCase()}`;
      await prisma.$transaction(async (txPrisma)=>{
        const claimed=await txPrisma.mpesaTransaction.updateMany({ where:{ checkoutRequestId: checkoutRequestId, status:"PENDING" }, data:{ status:"SUCCESS", receiptNumber: receiptNumber as string } });
        if(claimed.count===0) return;
        if(tx!.bookingId) await txPrisma.booking.updateMany({ where:{ id: tx!.bookingId, depositPaid:false }, data:{ paymentStatus:"deposit_paid", mpesaReceiptNo:receiptNumber, status:"confirmed", depositPaid:true } });
        if(tx!.invoiceId){
          const inv=await txPrisma.invoice.findUnique({ where:{ id: tx!.invoiceId } });
          if(inv){ const newPaid=(inv.depositPaid||0)+tx!.amount; let payStatus="Deposit Paid"; if(newPaid>=inv.total) payStatus="Paid"; await (txPrisma.invoice.update as any)({ where:{ id: tx!.invoiceId }, data:{ depositPaid:newPaid, balanceDue:Math.max(0, inv.total-newPaid), paymentStatus:payStatus, mpesaRef: receiptNumber||inv.mpesaRef } }); }
        }
      });
      tx=await serverDb.getTransaction(checkoutRequestId)||tx;
    } else if(liveStatus.status==="FAILED"){ tx=await serverDb.updateTransaction(checkoutRequestId, { status:"FAILED", failureReason:liveStatus.failureReason })||tx; }
  }
  return res.json({ success:true, transaction:tx });
});

app.get("/api/mpesa/transactions", authenticateToken, requireAdmin, async (req,res)=>{
  const { page, limit }=getPagination(req);
  const { data: transactions, total }=await serverDb.getTransactionsPaginated(page, limit);
  res.json({ success:true, transactions, pagination:{ page, limit, total, pages:Math.ceil(total/limit) } });
});
app.post("/api/mpesa/reconcile", authenticateToken, requireAdmin, async (_req,res)=>{
  const pendings=await prisma.mpesaTransaction.findMany({ where:{ status:"PENDING", createdAt:{ gte: new Date(Date.now()-24*60*60*1000) } }, take:20 });
  let checked=0, updated=0;
  for(const tx of pendings){ const live=await queryDarajaStatus(tx.checkoutRequestId); if(live.status!=="PENDING"){ checked++; if(live.status==="SUCCESS"){ await prisma.$transaction(async (p)=>{ await p.mpesaTransaction.update({ where:{ checkoutRequestId:tx.checkoutRequestId }, data:{ status:"SUCCESS", receiptNumber:live.receiptNumber } }); if(tx.bookingId) await p.booking.update({ where:{ id:tx.bookingId }, data:{ paymentStatus:"deposit_paid", mpesaReceiptNo:live.receiptNumber, status:"confirmed" } }).catch(()=>{}); }); updated++; } else if(live.status==="FAILED"){ await prisma.mpesaTransaction.update({ where:{ checkoutRequestId:tx.checkoutRequestId }, data:{ status:"FAILED", failureReason:live.failureReason } }); updated++; } }
  }
  res.json({ success:true, checked, updated });
});
app.get("/api/health", async (_req,res)=>{
  const checks:any={ db:"unknown", daraja:"unknown" };
  try{ await prisma.$queryRaw`SELECT 1`; checks.db="connected"; }catch(e){ checks.db="disconnected"; checks.dbError=String(e).slice(0,200); }
  const darajaCfg=getDarajaConfig(); checks.daraja= darajaCfg.consumerKey && darajaCfg.consumerSecret ? "configured" : "not_configured";
  checks.uptime=process.uptime(); checks.timestamp=new Date().toISOString(); checks.env=env.NODE_ENV;
  const status= checks.db==="connected" ? "ok" : "degraded";
  res.status(status==="ok"?200:503).json({ status, service:"Rolling Razors Customs API", ...checks });
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

async function startServer(){
  if(env.NODE_ENV!=="production"){
    const vite=await createViteServer({ server:{ middlewareMode:true }, appType:"spa" }); app.use(vite.middlewares);
  } else { const distPath=path.join(process.cwd(),"dist"); app.use(express.static(distPath, { maxAge:"1y", etag:true })); app.get("*", (_req,res)=>{ res.sendFile(path.join(distPath,"index.html")); }); }
  const server=app.listen(PORT,"0.0.0.0",()=>{ logger.info(`Rolling Razors Customs Full-Stack Server running on port ${PORT} [${env.NODE_ENV}] with Postgres`); });
  const shutdown=async()=>{ logger.info("Shutting down..."); await prisma.$disconnect().catch(()=>{}); server.close(()=>process.exit(0)); };
  process.on("SIGTERM", shutdown); process.on("SIGINT", shutdown);
}
startServer();
