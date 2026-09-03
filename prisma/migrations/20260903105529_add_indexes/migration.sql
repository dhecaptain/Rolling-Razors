-- CreateIndex
CREATE INDEX "Booking_appointmentDate_idx" ON "Booking"("appointmentDate");

-- CreateIndex
CREATE INDEX "Booking_createdAt_idx" ON "Booking"("createdAt");

-- CreateIndex
CREATE INDEX "Booking_customerId_status_idx" ON "Booking"("customerId", "status");

-- CreateIndex
CREATE INDEX "MpesaTransaction_phone_idx" ON "MpesaTransaction"("phone");

-- CreateIndex
CREATE INDEX "MpesaTransaction_status_createdAt_idx" ON "MpesaTransaction"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Otp_expiresAt_idx" ON "Otp"("expiresAt");

-- CreateIndex
CREATE INDEX "Vehicle_registrationNo_idx" ON "Vehicle"("registrationNo");

-- CreateIndex
CREATE INDEX "Vehicle_customerId_registrationNo_idx" ON "Vehicle"("customerId", "registrationNo");
