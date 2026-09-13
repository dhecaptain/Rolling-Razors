-- Add canonical booking slot start timestamp. Backfilled from the existing
-- appointmentDate/appointmentTime string columns, deduped (earliest keeps the
-- slot), then locked with a unique index so the same slot cannot be
-- double-booked at the database level.

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "slotStart" TIMESTAMP(3);

-- Backfill slotStart from appointmentDate (YYYY-MM-DD) + appointmentTime,
-- which is either 12h ("8:05 AM" / "10:00 AM - 12:00 PM") or 24h ("14:30").
UPDATE "Booking"
SET "slotStart" = (
  SELECT
    CASE
      WHEN lower(trim("appointmentTime")) ~ '^\d{1,2}:\d{2}\s*[ap]m$' THEN
        (to_timestamp("appointmentDate" || ' ' || upper(trim("appointmentTime")), 'YYYY-MM-DD FMHH:MI AM') AT TIME ZONE 'UTC')
      WHEN trim("appointmentTime") ~ '^\d{1,2}:\d{2}$' THEN
        (to_timestamp("appointmentDate" || ' ' || trim("appointmentTime"), 'YYYY-MM-DD HH24:MI') AT TIME ZONE 'UTC')
      ELSE NULL
    END
)
WHERE "slotStart" IS NULL AND "appointmentDate" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$';

-- Dedupe: keep only the earliest booked row per slot, release the rest.
UPDATE "Booking" AS dup
SET "slotStart" = NULL
FROM "Booking" AS keep
WHERE dup."slotStart" IS NOT NULL
  AND dup."slotStart" = keep."slotStart"
  AND (dup."createdAt" > keep."createdAt" OR (dup."createdAt" = keep."createdAt" AND dup.id > keep.id));

-- CreateIndex
CREATE UNIQUE INDEX "Booking_slotStart_key" ON "Booking"("slotStart");