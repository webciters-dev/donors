-- Add optional name field to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "name" TEXT;