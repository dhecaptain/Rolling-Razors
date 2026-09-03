import { prisma } from "../server/prisma";
import { INITIAL_BOOKINGS, INITIAL_CUSTOMERS, INITIAL_INVOICES, INITIAL_STAFF, INITIAL_VEHICLES, INITIAL_WORK_ORDERS, INITIAL_SERVICES } from "../src/data/mockData";

async function main() {
  console.log("Seeding Rolling Razors Postgres...");

  const adminUser = { id: "staff-1", name: "James Kimani (Owner)", phone: "+254 712 345 678", email: "james@rollingrazors.co.ke", role: "admin" as const, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80", location: "Workshop HQ, Industrial Area, Nairobi" };
  const custUser = { id: "cust-1", name: "Brian Mwangi", phone: "+254 712 901 234", email: "brian.mwangi@gmail.com", role: "customer" as const, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80", location: "Kilimani, Nairobi" };
  const admin2 = { id: "staff-admin", name: "davidpolycarp7", phone: "+254723459826", email: "davidpolycarp7@gmail.com", role: "admin" as const, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80", location: "Workshop HQ, Industrial Area, Nairobi" };

  for (const u of [adminUser, custUser, admin2]) {
    await prisma.user.upsert({ where: { id: u.id }, update: u, create: u });
  }

  for (const s of INITIAL_STAFF) {
    await prisma.staff.upsert({
      where: { id: s.id },
      update: { name: s.name, role: s.role, phone: s.phone, specialization: s.specialization, specialty: s.specialty, activeJobs: s.activeJobs, completedJobs: s.completedJobs, avatar: s.avatar, rating: s.rating },
      create: { id: s.id, name: s.name, role: s.role, phone: s.phone, specialization: s.specialization, specialty: s.specialty, activeJobs: s.activeJobs, completedJobs: s.completedJobs, avatar: s.avatar, rating: s.rating },
    });
  }

  for (const srv of INITIAL_SERVICES) {
    await prisma.service.upsert({
      where: { id: srv.id },
      update: { name: srv.name, category: srv.category, shortDesc: srv.shortDesc, longDesc: srv.longDesc, startingPrice: srv.startingPrice, estimatedDuration: srv.estimatedDuration, image: srv.image, iconName: srv.iconName, isFeatured: srv.isFeatured || false, popular: srv.popular || false, includedFeatures: srv.includedFeatures as any, materialsAvailable: srv.materialsAvailable as any },
      create: { id: srv.id, name: srv.name, category: srv.category, shortDesc: srv.shortDesc, longDesc: srv.longDesc, startingPrice: srv.startingPrice, estimatedDuration: srv.estimatedDuration, image: srv.image, iconName: srv.iconName, isFeatured: srv.isFeatured || false, popular: srv.popular || false, includedFeatures: srv.includedFeatures as any, materialsAvailable: srv.materialsAvailable as any },
    });
  }

  for (const c of INITIAL_CUSTOMERS) {
    await prisma.customer.upsert({
      where: { id: c.id },
      update: { name: c.name, phone: c.phone, email: c.email, avatar: c.avatar, vehiclesCount: c.vehiclesCount, totalBookings: c.totalBookings, totalSpent: c.totalSpent, lastVisit: c.lastVisit, location: c.location, status: c.status as any, address: c.address, notes: c.notes, savedVehicles: (c.savedVehicles as any) || [] },
      create: { id: c.id, name: c.name, phone: c.phone, email: c.email, avatar: c.avatar, vehiclesCount: c.vehiclesCount, totalBookings: c.totalBookings, totalSpent: c.totalSpent, lastVisit: c.lastVisit, location: c.location, status: c.status as any, address: c.address, notes: c.notes, savedVehicles: (c.savedVehicles as any) || [] },
    });
  }

  for (const v of INITIAL_VEHICLES) {
    await prisma.vehicle.upsert({
      where: { registrationNo: v.registrationNo.toUpperCase() },
      update: { customerId: v.customerId, type: v.type, make: v.make, model: v.model, year: v.year, color: v.color, image: v.image, previousServicesCount: v.previousServicesCount || 0, upholsteryHistory: (v.upholsteryHistory as any) || [], notes: v.notes },
      create: { id: v.id, customerId: v.customerId, type: v.type, make: v.make, model: v.model, year: v.year, registrationNo: v.registrationNo.toUpperCase(), color: v.color, image: v.image, previousServicesCount: v.previousServicesCount || 0, upholsteryHistory: (v.upholsteryHistory as any) || [], notes: v.notes },
    });
  }

  for (const b of INITIAL_BOOKINGS) {
    await prisma.booking.upsert({
      where: { id: b.id },
      update: {
        customerId: b.customerId, customerName: b.customerName, customerPhone: b.customerPhone, customerEmail: b.customerEmail,
        serviceId: b.serviceId, serviceName: b.serviceName, vehicleDetails: b.vehicleDetails as any,
        requirementsDesc: b.requirementsDesc, notes: b.notes, customOptions: b.customOptions as any, referencePhotos: b.referencePhotos as any, selectedMaterial: b.selectedMaterial, stitchingStyle: b.stitchingStyle,
        appointmentDate: b.appointmentDate, appointmentTime: b.appointmentTime, locationType: b.locationType, customerLocation: b.customerLocation, customerLocationAddress: b.customerLocationAddress,
        estimatedPrice: b.estimatedPrice, depositAmount: b.depositAmount, balanceAmount: b.balanceAmount, depositPaid: b.depositPaid || false, paymentStatus: b.paymentStatus as any, paymentMethod: b.paymentMethod, mpesaReceiptNo: b.mpesaReceiptNo,
        status: b.status as any, assignedStaffId: b.assignedStaffId, assignedStaffName: b.assignedStaffName, workOrderId: b.workOrderId, timeline: b.timeline as any, internalNotes: b.internalNotes,
      },
      create: {
        id: b.id, customerId: b.customerId, customerName: b.customerName, customerPhone: b.customerPhone, customerEmail: b.customerEmail,
        serviceId: b.serviceId, serviceName: b.serviceName, vehicleDetails: b.vehicleDetails as any,
        requirementsDesc: b.requirementsDesc, notes: b.notes, customOptions: b.customOptions as any, referencePhotos: b.referencePhotos as any, selectedMaterial: b.selectedMaterial, stitchingStyle: b.stitchingStyle,
        appointmentDate: b.appointmentDate, appointmentTime: b.appointmentTime, locationType: b.locationType, customerLocation: b.customerLocation, customerLocationAddress: b.customerLocationAddress,
        estimatedPrice: b.estimatedPrice, depositAmount: b.depositAmount, balanceAmount: b.balanceAmount, depositPaid: b.depositPaid || false, paymentStatus: b.paymentStatus as any, paymentMethod: b.paymentMethod, mpesaReceiptNo: b.mpesaReceiptNo,
        status: b.status as any, assignedStaffId: b.assignedStaffId, assignedStaffName: b.assignedStaffName, workOrderId: b.workOrderId, timeline: b.timeline as any, internalNotes: b.internalNotes,
      },
    });
  }

  for (const w of INITIAL_WORK_ORDERS) {
    await prisma.workOrder.upsert({
      where: { id: w.id },
      update: {
        bookingId: w.bookingId, customerId: w.customerId, customerName: w.customerName, customerPhone: w.customerPhone, vehicleId: w.vehicleId, vehicleDisplayName: w.vehicleDisplayName, vehicleRegistration: w.vehicleRegistration, serviceName: w.serviceName, assignedStaffId: w.assignedStaffId, assignedStaffName: w.assignedStaffName, priority: w.priority as any, stage: w.stage as any, customerRequirements: w.customerRequirements, materialsRequired: w.materialsRequired as any, estimatedCost: w.estimatedCost, actualCost: w.actualCost, beforePhotos: w.beforePhotos as any, progressPhotos: w.progressPhotos as any, afterPhotos: w.afterPhotos as any, internalNotes: w.internalNotes, progressPercentage: w.progressPercentage, targetCompletionDate: w.targetCompletionDate,
      },
      create: {
        id: w.id, bookingId: w.bookingId, customerId: w.customerId, customerName: w.customerName, customerPhone: w.customerPhone, vehicleId: w.vehicleId, vehicleDisplayName: w.vehicleDisplayName, vehicleRegistration: w.vehicleRegistration, serviceName: w.serviceName, assignedStaffId: w.assignedStaffId, assignedStaffName: w.assignedStaffName, priority: w.priority as any, stage: w.stage as any, customerRequirements: w.customerRequirements, materialsRequired: w.materialsRequired as any, estimatedCost: w.estimatedCost, actualCost: w.actualCost, beforePhotos: w.beforePhotos as any, progressPhotos: w.progressPhotos as any, afterPhotos: w.afterPhotos as any, internalNotes: w.internalNotes, progressPercentage: w.progressPercentage, targetCompletionDate: w.targetCompletionDate,
      },
    });
  }

  for (const inv of INITIAL_INVOICES) {
    await prisma.invoice.upsert({
      where: { id: inv.id },
      update: { bookingId: inv.bookingId, workOrderId: inv.workOrderId, customerName: inv.customerName, customerPhone: inv.customerPhone, customerEmail: inv.customerEmail, vehicleInfo: inv.vehicleInfo, serviceName: inv.serviceName, items: inv.items as any, subtotal: inv.subtotal, depositPaid: inv.depositPaid, balanceDue: inv.balanceDue, total: inv.total, paymentMethod: inv.paymentMethod, paymentStatus: inv.paymentStatus, mpesaRef: inv.mpesaRef, issueDate: inv.issueDate, dueDate: inv.dueDate },
      create: { id: inv.id, bookingId: inv.bookingId, workOrderId: inv.workOrderId, customerName: inv.customerName, customerPhone: inv.customerPhone, customerEmail: inv.customerEmail, vehicleInfo: inv.vehicleInfo, serviceName: inv.serviceName, items: inv.items as any, subtotal: inv.subtotal, depositPaid: inv.depositPaid, balanceDue: inv.balanceDue, total: inv.total, paymentMethod: inv.paymentMethod, paymentStatus: inv.paymentStatus, mpesaRef: inv.mpesaRef, issueDate: inv.issueDate, dueDate: inv.dueDate },
    });
  }

  console.log("Seed complete.");
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
