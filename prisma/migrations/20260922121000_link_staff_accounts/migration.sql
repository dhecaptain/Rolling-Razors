-- Link Staff directory rows to User accounts and evolve roles.
-- Enum VALUES used here were created in add_staff_role_enums (previous
-- migration, separate transaction).

-- 1) Add the new User/Staff columns first (the backfills below reference them).
ALTER TABLE "User" ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Staff" ADD COLUMN     "email" TEXT;
ALTER TABLE "Staff" ADD COLUMN     "status" "StaffStatus" NOT NULL DEFAULT 'invited';
ALTER TABLE "Staff" ADD COLUMN     "clerkId" TEXT;
ALTER TABLE "Staff" ADD COLUMN     "userId" TEXT;

-- 2) Backfill existing admin users to the granular owner role.
UPDATE "User" SET "role" = 'owner' WHERE "role" = 'admin';

-- 3) Backfill legacy display strings on Staff to StaffRole enum labels before
--    the column type changes.
UPDATE "Staff"
SET "role" = CASE "role"
  WHEN 'Owner' THEN 'owner'
  WHEN 'Manager' THEN 'manager'
  WHEN 'Craftsman' THEN 'craftsman'
  WHEN 'Receptionist' THEN 'receptionist'
  ELSE 'craftsman'
END
WHERE "role" IN ('Owner', 'Manager', 'Craftsman', 'Receptionist');

-- 4) Pre-existing directory rows are the active team; new registrations start
--    as 'invited' until first login (also a StaffStatus value, safe here).
UPDATE "Staff" SET "status" = 'active';

-- 5) Convert the Staff role column to the StaffRole enum.
ALTER TABLE "Staff" ALTER COLUMN "role" TYPE "StaffRole" USING "role"::text::"StaffRole";

-- 6) Foreign key + unique constraints for the account linkage columns.
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "Staff_email_key" ON "Staff"("email");
CREATE UNIQUE INDEX "Staff_clerkId_key" ON "Staff"("clerkId");
CREATE UNIQUE INDEX "Staff_userId_key" ON "Staff"("userId");