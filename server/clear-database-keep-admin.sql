-- Clear Database Script - Keep Only Admin Account
-- This will remove all students, donors, sub-admins, and related data
-- while preserving the main admin account

-- Start transaction for safety
BEGIN;

-- 1. Delete all sponsorships first (foreign key constraints)
DELETE FROM "Sponsorship";

-- 2. Delete all applications
DELETE FROM "Application";

-- 3. Delete all progress updates
DELETE FROM "ProgressUpdate";

-- 4. Delete all messages/conversations
DELETE FROM "Message";

-- 5. Delete all students (this will cascade to related records)
DELETE FROM "Student";

-- 6. Delete all donors (this will cascade to related records)
DELETE FROM "Donor";

-- 7. Delete users that are NOT the main admin
-- Keep only the user with email 'admin@awake.com' and role 'ADMIN'
DELETE FROM "User" 
WHERE email != 'admin@awake.com' 
   OR role != 'ADMIN';

-- 8. Ensure the admin account has the correct credentials
-- Update the admin account to ensure correct email and reset password if needed
UPDATE "User" 
SET 
  email = 'admin@awake.com',
  role = 'ADMIN',
  isActive = true,
  emailVerified = true
WHERE email = 'admin@awake.com';

-- Commit the transaction
COMMIT;

-- Verify what's left
SELECT 
  id, 
  email, 
  role, 
  name,
  isActive,
  emailVerified,
  createdAt
FROM "User";