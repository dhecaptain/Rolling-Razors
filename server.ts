import express from "express";
import path from "path";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import { createServer as createViteServer } from "vite";
import { env } from "./server/env";
import { logger } from "./server/logger";
import { serverDb } from "./server/db";
import { prisma } from "./server/prisma";
import { normalizePhoneKe, toDarajaPhone, phoneKey, phonesMatch } from "./server/phone";
import { validate, adminLoginSchema, customerLoginSchema, customerRegisterSchema, stkPushSchema, bookingCreateSchema, vehicleCreateSchema } from "./server/validators";
import { Booking, Customer, User, Vehicle, WorkOrder, Invoice } from "./src/types";

const app = express();
const PORT = env.PORT;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: env.CORS_ORIGIN ? env.CORS_ORIGIN.split(",").map(s=>s.trim()) : true, credentials: true }));
app.use(express.json({ limit: "100kb" }));
app.use(pinoHttp({ logger }));
app.set("trust proxy", 1);

const generalLimiter = rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 60_000, max: 10, standardHeaders: true, legacyHeaders: false, message: { success:false, error:"Too many attempts. Try again shortly." } });
const mpesaLimiter = rateLimit({ windowMs: 60_000, max: 6, standardHeaders: true, legacyHeaders: false, message: { success:false, error:"M-Pesa rate limit: please wait." } });
const otpLimiter = rateLimit({ windowMs: 60_000, max: 5, standardHeaders: true, legacyHeaders: false });
app.use("/api/", generalLimiter);

const JWT_SECRET = env.AUTH_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 16) { logger.error("AUTH_SECRET missing"); if (env.NODE_ENV==="production") process.exit(1); }

function generateToken(user: User, expiresInHours=24): string {
  const payload={ sub:user.id, id:user.id, name:user.name, email:user.email, phone:user.phone, role:user.role, location:user.location, iss:"rolling-razors-kenya", aud:"rolling-razors-app" };
  return jwt.sign(payload, JWT_SECRET, { algorithm:"HS256", expiresIn:`${expiresInHours}h` });
}
function verifyToken(token:string): any|null { try{ return jwt.verify(token, JWT_SECRET, { algorithms:["HS256"], issuer:"rolling-razors-kenya", audience:"rolling-razors-app" }); }catch{ return null; } }
function hashPassword(p:string): string { return crypto.createHash("sha256").update(p+JWT_SECRET).digest("hex"); }
function authenticateToken(req: express.Request,res: express.Response,next: express.NextFunction){ const h=req.headers.authorization; if(!h||!h.startsWith("Bearer ")) return res.status(401).json({ success:false, error:"Authorization token required." }); const d=verifyToken(h.split(" ")[1]); if(!d) return res.status(401).json({ success:false, error:"Invalid or expired session token." }); (req as any).user=d; next(); }
function authenticateOptional(req: express.Request,_res: express.Response,next: express.NextFunction){ const h=req.headers.authorization; if(h?.startsWith("Bearer ")){ const d=verifyToken(h.split(" ")[1]); if(d) (req as any).user=d; } next(); }
function requireAdmin(req: express.Request,res: express.Response,next: express.NextFunction){ const u=(req as any).user; if(!u||u.role!=="admin") return res.status(403).json({ success:false, error:"Admin access required." }); next(); }

app.post("/api/auth/admin/login", authLimiter, async (req,res)=>{
  const v=validate(adminLoginSchema, req.body); if(!v.success) return res.status(400).json({ success:false, error:v.error });
  const { identifier, password }=v.data as any; const cleanIdent=String(identifier).trim().toLowerCase(); const cleanPass=String(password).trim();
  const adminEmail=env.ADMIN_EMAIL; const adminPhone=env.ADMIN_PHONE; const adminPass=env.ADMIN_PASSWORD;
  if(!adminPass){ logger.error("[AUTH] ADMIN_PASSWORD not configured"); return res.status(500).json({ success:false, error:"Admin authentication service unavailable." }); }
  const matchesEmail=Boolean(adminEmail && cleanIdent===adminEmail); const matchesPhone=Boolean(adminPhone && phoneKey(cleanIdent)===phoneKey(adminPhone)); const isPassMatch=cleanPass===adminPass;
  if((!matchesEmail && !matchesPhone) || !isPassMatch) return res.status(401).json({ success:false, error:"Access Denied: Invalid workshop staff credentials." });
  const adminName=env.ADMIN_NAME || (adminEmail?adminEmail.split("@")[0]:"Workshop Administrator");
  const adminUser: User={ id:"staff-admin", name:adminName, phone:adminPhone||"+254 712 345 678", email:adminEmail||"admin@rollingrazors.co.ke", role:"admin", avatar:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80", location:"Workshop HQ, Industrial Area, Nairobi" };
  await serverDb.upsertUser(adminUser); const token=generateToken(adminUser,24);
  return res.json({ success:true, user:{ ...adminUser, token }, token });
});

app.post("/api/auth/customer/login", authLimiter, async (req,res)=>{
  const v=validate(customerLoginSchema, req.body); if(!v.success) return res.status(400).json({ success:false, error:v.error });
  const { phone, otp }=v.data as any; const key=phoneKey(String(phone));
  if(otp){ const record=await serverDb.getOtp(key); if(!record || record.expiresAt < Date.now() || record.otp!==String(otp).trim()) return res.status(401).json({ success:false, error:"Invalid or expired OTP code." }); await serverDb.deleteOtp(key); }
  let customer=await serverDb.findUser(String(phone));
  if(!customer){ const custs=await serverDb.getCustomers(); const custRecord=custs.find(c=>phonesMatch(c.phone, String(phone))); if(custRecord){ customer={ id:custRecord.id, name:custRecord.name, phone:custRecord.phone, email:custRecord.email, role:"customer", avatar:custRecord.avatar||"", location:custRecord.address }; await serverDb.upsertUser(customer); } }
  if(!customer) return res.status(404).json({ success:false, error:"No driver account found with this phone number. Please register first." });
  const token=generateToken(customer, 7*24); return res.json({ success:true, user:{ ...customer, token }, token });
});

app.post("/api/auth/customer/register", authLimiter, async (req,res)=>{
  const v=validate(customerRegisterSchema, req.body); if(!v.success) return res.status(400).json({ success:false, error:v.error });
  const { name, phone, email }=v.data as any; const formattedPhone=normalizePhoneKe(String(phone));
  const existing=await serverDb.findUser(String(phone)); if(existing) return res.status(409).json({ success:false, error:"An account with this phone number already exists. Please sign in." });
  const newId=`cust-${Date.now()}`; const newUser: User={ id:newId, name:String(name).trim(), phone:formattedPhone, email: email?String(email).trim().toLowerCase():`${String(name).toLowerCase().replace(/\s+/g,".")}@gmail.com`, role:"customer", avatar:"https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80", location:"Nairobi, Kenya" };
  await serverDb.upsertUser(newUser); const newCustomer: Customer={ id:newId, name:newUser.name, phone:newUser.phone, email:newUser.email, avatar:newUser.avatar, totalSpent:0, status:"New", address:"Nairobi, Kenya", savedVehicles:[] };
  await serverDb.saveCustomer(newCustomer); const token=generateToken(newUser, 7*24);
  return res.status(201).json({ success:true, user:{ ...newUser, token }, token });
});

app.post("/api/auth/customer/send-otp", otpLimiter, async (req,res)=>{
  const { phone }=req.body; if(!phone||!String(phone).trim()) return res.status(400).json({ success:false, error:"Phone number is required." });
  const key=phoneKey(String(phone)); if(!key||key.length!==9) return res.status(400).json({ success:false, error:"Invalid Kenyan phone number." });
  const otp=Math.floor(100000+Math.random()*900000).toString(); const expiresAt=Date.now()+5*60*1000;
  await serverDb.saveOtp(key, otp, expiresAt); logger.info({ phone:key }, `[OTP] code=${otp}`);
  return res.json({ success:true, message:`OTP sent via SMS to ${normalizePhoneKe(String(phone))}.`, expiresInSeconds:300, debugOtp: env.NODE_ENV!=="production"?otp:undefined });
});

app.get("/api/auth/verify", (req,res)=>{
  const h=req.headers.authorization; if(!h||!h.startsWith("Bearer ")) return res.status(401).json({ valid:false, error:"Missing Bearer token." });
  const d=verifyToken(h.split(" ")[1]); if(!d) return res.status(401).json({ valid:false, error:"Token signature invalid or expired." });
  return res.json({ valid:true, user:d });
});

app.get("/api/bookings", authenticateOptional, async (req,res)=>{
  const customerId=req.query.customerId as string|undefined; const user=(req as any).user;
  if(customerId && user && user.role!=="admin" && user.id!==customerId) return res.status(403).json({ success:false, error:"Forbidden." });
  const bookings=await serverDb.getBookings(customerId); res.json({ success:true, bookings });
});

app.post("/api/bookings", authenticateOptional, async (req,res)=>{
  const v=validate(bookingCreateSchema, req.body); if(!v.success) return res.status(400).json({ success:false, error:v.error });
  const bookingData=v.data as unknown as Booking; const savedBooking=await serverDb.createBooking(bookingData);
  const existingWo=await serverDb.getWorkOrder(bookingData.workOrderId || `RR-WO-${bookingData.id}`);
  let savedWorkOrder=existingWo;
  if(!existingWo){ const dynamicMaterials:string[]=[bookingData.selectedMaterial||'Automotive Leather / Vinyl','High Density Ergonomic Foam Cushioning','Bonded Heavy-Duty Seam Thread'];
    const newWorkOrder: WorkOrder={ id:bookingData.workOrderId||`RR-WO-${bookingData.id.replace('RR-','')}`, bookingId:bookingData.id, customerId:bookingData.customerId, customerName:bookingData.customerName, customerPhone:bookingData.customerPhone, vehicleDisplayName:`${bookingData.vehicleDetails.make} ${bookingData.vehicleDetails.model} (${bookingData.vehicleDetails.year})`, vehicleRegistration:bookingData.vehicleDetails.registrationNo, serviceName:bookingData.serviceName, assignedStaffId:bookingData.assignedStaffId, assignedStaffName:bookingData.assignedStaffName||'Unassigned', priority:'Normal', stage:'BOOKED', customerRequirements:bookingData.requirementsDesc||'Standard custom upholstery package', materialsRequired:dynamicMaterials, estimatedCost:bookingData.estimatedPrice, actualCost:undefined, beforePhotos:[], progressPhotos:[], afterPhotos:[], progressPercentage:10, createdAt:new Date().toISOString().split('T')[0], targetCompletionDate:bookingData.appointmentDate };
    savedWorkOrder=await serverDb.createWorkOrder(newWorkOrder);
  }
  res.status(201).json({ success:true, booking:savedBooking, workOrder:savedWorkOrder });
});

app.patch("/api/bookings/:id", authenticateToken, async (req,res)=>{
  const { id }=req.params; const existing=await serverDb.getBooking(id); if(!existing) return res.status(404).json({ success:false, error:"Booking not found." });
  const user=(req as any).user; if(user.role!=="admin" && existing.customerId && existing.customerId!==user.id && !phonesMatch(existing.customerPhone, user.phone||"")) return res.status(403).json({ success:false, error:"Forbidden." });
  const updated=await serverDb.updateBooking(id, req.body); res.json({ success:true, booking:updated });
});

app.get("/api/vehicles", authenticateOptional, async (req,res)=>{
  const customerId=req.query.customerId as string|undefined; const vehicles=await serverDb.getVehicles(customerId); res.json({ success:true, vehicles });
});

app.post("/api/vehicles", authenticateOptional, async (req,res)=>{
  const v=validate(vehicleCreateSchema, req.body); if(!v.success) return res.status(400).json({ success:false, error:v.error });
  const vehicleData=v.data as Vehicle;
  try {
    const newVehicle: Vehicle={ ...vehicleData, id:vehicleData.id||`veh_${Date.now()}`, registrationNo:vehicleData.registrationNo.toUpperCase(), previousServicesCount:vehicleData.previousServicesCount||0 };
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

app.get("/api/work-orders", authenticateOptional, async (_req,res)=>{ res.json({ success:true, workOrders: await serverDb.getWorkOrders() }); });

app.patch("/api/work-orders/:id", authenticateToken, requireAdmin, async (req,res)=>{
  const { id }=req.params; const allowed=["stage","progressPercentage","assignedStaffId","assignedStaffName","priority","internalNotes","actualCost"]; const patch:any={}; for(const k of allowed) if(k in req.body) patch[k]=req.body[k];
  const updated=await serverDb.updateWorkOrder(id, patch); if(!updated) return res.status(404).json({ success:false, error:"Work order not found." }); res.json({ success:true, workOrder:updated });
});

app.get("/api/invoices", authenticateOptional, async (req,res)=>{
  const customerId=req.query.customerId as string|undefined; res.json({ success:true, invoices: await serverDb.getInvoices(customerId) });
});

app.patch("/api/invoices/:id", authenticateToken, requireAdmin, async (req,res)=>{
  const { id }=req.params; const updated=await serverDb.updateInvoice(id, req.body); if(!updated) return res.status(404).json({ success:false, error:"Invoice not found." }); res.json({ success:true, invoice:updated });
});

app.get("/api/customers", authenticateToken, requireAdmin, async (_req,res)=>{ res.json({ success:true, customers: await serverDb.getCustomers() }); });
app.get("/api/staff", async (_req,res)=>{ res.json({ success:true, staff: await serverDb.getStaff() }); });

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

app.post("/api/mpesa/stkpush", mpesaLimiter, async (req,res)=>{
  const v=validate(stkPushSchema, req.body); if(!v.success) return res.status(400).json({ success:false, error:v.error });
  const { phone, amount, bookingId, invoiceId, accountReference, transactionDesc }=v.data as any; const formattedPhone=toDarajaPhone(String(phone)); if(formattedPhone.length<10) return res.status(400).json({ success:false, error:"Invalid phone number." });
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

app.post("/api/mpesa/callback", async (req,res)=>{
  const body=req.body; logger.info({ body }, "[M-PESA WEBHOOK] callback"); const stkCallback=body?.Body?.stkCallback;
  if(stkCallback){
    const checkoutRequestId=stkCallback.CheckoutRequestID; const resultCode=stkCallback.ResultCode; const existing=await serverDb.getTransaction(checkoutRequestId);
    if(existing){
      if(resultCode===0){ let receiptNumber=existing.receiptNumber; const items=stkCallback?.CallbackMetadata?.Item||[]; for(const item of items) if(item.Name==="MpesaReceiptNumber") receiptNumber=item.Value;
        await serverDb.updateTransaction(checkoutRequestId, { status:"SUCCESS", receiptNumber });
        if(existing.bookingId) await serverDb.updateBooking(existing.bookingId, { paymentStatus:"deposit_paid", mpesaReceiptNo:receiptNumber, status:"confirmed" });
        if(existing.invoiceId){ const inv=await serverDb.getInvoice(existing.invoiceId); if(inv){ const newPaid=(inv.depositPaid||0)+existing.amount; await serverDb.updateInvoice(existing.invoiceId, { depositPaid:newPaid, balanceDue:Math.max(0, inv.total-newPaid), paymentStatus: newPaid>=inv.total?"Paid":"Deposit Paid", mpesaRef: receiptNumber||inv.mpesaRef }); } }
      } else { await serverDb.updateTransaction(checkoutRequestId, { status:"FAILED", failureReason: stkCallback.ResultDesc||"User cancelled or failed STK transaction" }); }
    }
  }
  return res.json({ ResultCode:0, ResultDesc:"Callback received successfully" });
});

app.get("/api/mpesa/query/:checkoutRequestId", async (req,res)=>{
  const { checkoutRequestId }=req.params; let tx=await serverDb.getTransaction(checkoutRequestId); if(!tx) return res.status(404).json({ success:false, error:"Transaction not found." });
  if(tx.status==="PENDING"){
    const liveStatus=await queryDarajaStatus(checkoutRequestId);
    if(liveStatus.status==="SUCCESS"){ const receiptNumber=liveStatus.receiptNumber||tx.receiptNumber||`SDA${Date.now().toString(36).toUpperCase()}`; tx=await serverDb.updateTransaction(checkoutRequestId, { status:"SUCCESS", receiptNumber })||tx;
      if(tx.bookingId) await serverDb.updateBooking(tx.bookingId, { paymentStatus:"deposit_paid", mpesaReceiptNo:receiptNumber, status:"confirmed" });
      if(tx.invoiceId){ const inv=await serverDb.getInvoice(tx.invoiceId); if(inv){ const newPaid=(inv.depositPaid||0)+tx.amount; await serverDb.updateInvoice(tx.invoiceId, { depositPaid:newPaid, balanceDue:Math.max(0, inv.total-newPaid), paymentStatus: newPaid>=inv.total?"Paid":"Deposit Paid", mpesaRef: receiptNumber||inv.mpesaRef }); } }
    } else if(liveStatus.status==="FAILED"){ tx=await serverDb.updateTransaction(checkoutRequestId, { status:"FAILED", failureReason:liveStatus.failureReason })||tx; }
  }
  return res.json({ success:true, transaction:tx });
});

app.get("/api/mpesa/transactions", authenticateToken, requireAdmin, async (_req,res)=>{ res.json({ success:true, transactions: await serverDb.getTransactions() }); });
app.get("/api/health", async (_req,res)=>{
  try{ await prisma.$queryRaw`SELECT 1`; res.json({ status:"ok", service:"Rolling Razors Customs API", timestamp:new Date().toISOString(), uptime:process.uptime(), env:env.NODE_ENV, db:"connected" }); }catch(e){ res.status(503).json({ status:"degraded", db:"disconnected", error:String(e).slice(0,200) }); }
});
app.use("/api", (_req,res)=>res.status(404).json({ success:false, error:"API endpoint not found." }));
app.use((err:any,_req:express.Request,res:express.Response,_next:express.NextFunction)=>{ logger.error({ err }, "Unhandled error"); res.status(err.status||500).json({ success:false, error: env.NODE_ENV==="production"?"Internal server error.":err.message||"Internal error" }); });

async function startServer(){
  if(env.NODE_ENV!=="production"){
    const vite=await createViteServer({ server:{ middlewareMode:true }, appType:"spa" }); app.use(vite.middlewares);
  } else { const distPath=path.join(process.cwd(),"dist"); app.use(express.static(distPath)); app.get("*", (_req,res)=>{ res.sendFile(path.join(distPath,"index.html")); }); }
  const server=app.listen(PORT,"0.0.0.0",()=>{ logger.info(`Rolling Razors Customs Full-Stack Server running on port ${PORT} [${env.NODE_ENV}] with Postgres`); });
  const shutdown=async()=>{ logger.info("Shutting down..."); await prisma.$disconnect().catch(()=>{}); server.close(()=>process.exit(0)); };
  process.on("SIGTERM", shutdown); process.on("SIGINT", shutdown);
}
startServer();
