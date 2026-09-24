-- Add granular staff role enums. New enum VALUES must be created in their own
-- migration: PostgreSQL forbids *using* a freshly added enum value in the same
-- transaction that created it. The backfills live in link_staff_accounts.

CREATE TYPE "StaffRole" AS ENUM ('owner', 'manager', 'craftsman', 'receptionist');

CREATE TYPE "StaffStatus" AS ENUM ('invited', 'active', 'deactivated');

ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'owner';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'craftsman';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'receptionist';