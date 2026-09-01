export type UserRole = 'customer' | 'admin';

export type ServiceCategory = 
  | 'automotive' 
  | 'cushions' 
  | 'leather' 
  | 'canvas' 
  | 'commercial';

export interface Service {
  id: string;
  name: string;
  category?: ServiceCategory;
  shortDesc: string;
  longDesc: string;
  startingPrice: number; // in KES
  estimatedDuration: string;
  image: string;
  iconName: string;
  isFeatured?: boolean;
  popular?: boolean;
  includedFeatures: string[];
  materialsAvailable: string[];
}

export type VehicleType = 'Car' | 'SUV' | 'Van' | 'Truck' | 'Matatu' | 'Other';

export interface Vehicle {
  id: string;
  customerId: string;
  type?: VehicleType;
  vehicleType?: VehicleType;
  make: string;
  model: string;
  year: number;
  registrationNo?: string;
  registrationNumber?: string;
  color?: string;
  image?: string;
  previousServicesCount?: number;
  upholsteryHistory?: string[];
  notes?: string;
}

export type BookingStatus = 
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'in_progress'
  | 'quality_check'
  | 'ready'
  | 'completed'
  | 'cancelled';

export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'deposit_paid'
  | 'paid'
  | 'failed'
  | 'refunded';

export interface BookingTimelineEvent {
  status: BookingStatus;
  timestamp: string;
  title: string;
  note: string;
  updatedBy: string;
}

export interface Booking {
  id: string; // e.g. RR-1048
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  serviceId: string;
  serviceName: string;
  
  // Flexible vehicle properties
  vehicleType?: VehicleType;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleRegistration?: string;
  vehicleDetails?: {
    type: VehicleType;
    make: string;
    model: string;
    year: number;
    registrationNo: string;
    photoUrl?: string;
  };

  requirementsDesc?: string;
  notes?: string;
  customOptions?: {
    material?: string;
    color?: string;
    pattern?: string;
  };
  referencePhotos?: string[];
  selectedMaterial?: string;
  stitchingStyle?: string;
  
  preferredDate?: string;
  preferredTime?: string;
  appointmentDate?: string; // YYYY-MM-DD
  appointmentTime?: string; // e.g. 10:00 AM
  
  locationType: 'workshop' | 'customer_location';
  customerLocation?: string;
  customerLocationAddress?: string;
  
  estimatedPrice: number;
  depositAmount: number;
  balanceAmount?: number;
  depositPaid?: boolean;
  paymentStatus?: PaymentStatus;
  paymentMethod?: string;
  mpesaReceiptNo?: string;
  
  status: BookingStatus;
  assignedStaffId?: string;
  assignedStaffName?: string;
  workOrderId?: string;
  timeline?: BookingTimelineEvent[];
  internalNotes?: string;
  createdAt: string;
}

export type WorkOrderStage = 
  | 'NEW'
  | 'CONFIRMED'
  | 'VEHICLE_RECEIVED'
  | 'MATERIALS_PREPARED'
  | 'IN_PROGRESS'
  | 'QUALITY_CHECK'
  | 'READY'
  | 'COMPLETED'
  | 'booked'
  | 'vehicle_received'
  | 'materials_prepared'
  | 'in_progress'
  | 'quality_check'
  | 'ready_for_pickup'
  | 'collected';

export interface WorkOrder {
  id: string; // e.g. RR-WO-2045
  bookingId: string;
  customerName: string;
  customerPhone: string;
  vehicleTitle?: string;
  vehicle?: string;
  registrationNo?: string;
  vehicleRegistration?: string;
  serviceName: string;
  assignedCraftsman?: string;
  assignedStaffName?: string;
  priority?: 'Low' | 'Normal' | 'High' | 'Urgent';
  stage: WorkOrderStage;
  customerRequirements?: string;
  materialsRequired?: string[];
  estimatedCost?: number;
  actualCost?: number;
  beforePhotos?: string[];
  progressPhotos?: string[];
  afterPhotos?: string[];
  internalNotes?: string;
  progressPercentage: number;
  createdAt: string;
  targetCompletionDate?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar?: string;
  vehiclesCount?: number;
  totalBookings?: number;
  totalSpent: number; // in KES
  lastVisit?: string;
  location?: string;
  status?: 'Active' | 'VIP' | 'New';
  address?: string;
  notes?: string;
  savedVehicles?: Vehicle[];
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  phone: string;
  specialization?: string;
  specialty?: string;
  activeJobs: number;
  completedJobs: number;
  avatar: string;
  rating: number;
}

export interface Invoice {
  id: string; // e.g. RR-INV-2045
  bookingId: string;
  workOrderId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  vehicleInfo: string;
  serviceName: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  subtotal: number;
  depositPaid: number;
  balanceDue: number;
  total: number;
  paymentMethod: 'M-Pesa' | 'Cash' | 'Bank' | 'Other';
  paymentStatus: 'Paid' | 'Deposit Paid' | 'Pending' | 'Overdue';
  mpesaRef?: string;
  issueDate: string;
  dueDate: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  category: 'All' | 'Car Interiors' | 'Seats' | 'Leather' | 'Cushions' | 'Canvas' | 'Before & After';
  service: string;
  location: string;
  vehicleModel: string;
  image: string;
  beforeImage?: string;
  afterImage?: string;
  description: string;
  tags: string[];
  isFeatured?: boolean;
}

export interface Review {
  id: string;
  customerName: string;
  location: string;
  rating: number;
  vehicle: string;
  service: string;
  comment: string;
  date: string;
  verified: boolean;
}

export interface AppNotification {
  id: string;
  recipientType: 'customer' | 'admin' | 'all';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: 'booking' | 'payment' | 'status' | 'reminder' | 'system';
  relatedBookingId?: string;
}

export interface MpesaPaymentRequest {
  phone: string;
  amount: number;
  accountReference: string;
  description: string;
  bookingId?: string;
}
