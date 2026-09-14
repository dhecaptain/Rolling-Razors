import { z } from "zod";

export const phoneSchema = z.string().min(9).max(20).transform(v => v.trim());

export const vehicleDetailsSchema = z.object({
  type: z.enum(["Car", "SUV", "Van", "Truck", "Matatu", "Other"]),
  make: z.string().min(1).max(50),
  model: z.string().min(1).max(50),
  year: z.number().int().min(1980).max(2030),
  registrationNo: z.string().min(3).max(20),
  photoUrl: z.string().url().optional().or(z.literal("")),
});

export const bookingCreateSchema = z.object({
  customerId: z.string().optional(),
  serviceId: z.string().min(1),
  vehicleDetails: vehicleDetailsSchema,
  requirementsDesc: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
  customOptions: z.object({ material: z.string().optional(), color: z.string().optional(), pattern: z.string().optional() }).optional(),
  referencePhotos: z.array(z.string()).optional(),
  selectedMaterial: z.string().optional(),
  stitchingStyle: z.string().optional(),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  appointmentTime: z.string().min(1),
  locationType: z.enum(["workshop", "customer_location"]),
  customerLocation: z.string().optional(),
  customerLocationAddress: z.string().optional(),
  privacyAccepted: z.literal(true),
  termsAccepted: z.literal(true),
});

export const vehicleCreateSchema = z.object({
  id: z.string().optional(),
  customerId: z.string().min(1),
  type: z.enum(["Car", "SUV", "Van", "Truck", "Matatu", "Other"]),
  make: z.string().min(1).max(50),
  model: z.string().min(1).max(50),
  year: z.number().int().min(1980).max(2030),
  registrationNo: z.string().min(2).max(20),
  color: z.string().max(30).optional(),
  image: z.string().url().optional().or(z.literal("")),
  previousServicesCount: z.number().int().min(0).optional(),
  notes: z.string().max(1000).optional(),
}).passthrough();

export const adminLoginSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(1),
});

export const customerLoginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1).max(200),
});

export const customerRegisterSchema = z.object({
  name: z.string().min(2).max(100),
  phone: phoneSchema,
  email: z.string().email().optional().or(z.literal("")),
  password: z.string().min(8).max(200),
});

export const stkPushSchema = z.object({
  phone: phoneSchema,
  amount: z.number().min(1).max(1000000),
  bookingId: z.string().optional(),
  invoiceId: z.string().optional(),
  accountReference: z.string().optional(),
  transactionDesc: z.string().optional(),
});

export const paystackInitSchema = z.object({
  amount: z.number().min(3).max(150000),
  email: z.string().email("A valid email is required for card checkout.").optional(),
  bookingId: z.string().optional(),
  invoiceId: z.string().optional(),
});

export const buildDraftSchema = z.object({
  material: z.string().min(1).max(100),
  color: z.string().min(1).max(100),
  pattern: z.string().min(1).max(100),
});

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; error?: string } {
  const r = schema.safeParse(data);
  if (r.success) return { success: true, data: r.data };
  return { success: false, error: r.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ") };
}
