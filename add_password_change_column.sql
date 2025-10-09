-- Add needs_password_change column to existing public.users table
-- This column tracks whether admin-created users need to change their temporary password

ALTER TABLE public.users 
ADD COLUMN needs_password_change BOOLEAN NOT NULL DEFAULT false;

-- Add comment to document the column purpose
COMMENT ON COLUMN public.users.needs_password_change IS 'Indicates if user needs to change their password (true for admin-created accounts with temporary passwords)';

-- Optional: Create an index for better query performance when checking users who need password changes
CREATE INDEX IF NOT EXISTS idx_users_needs_password_change 
ON public.users(needs_password_change) 
WHERE needs_password_change = true;

-- Update existing admin-created users if needed (uncomment and modify date as needed)
-- UPDATE public.users 
-- SET needs_password_change = true 
-- WHERE created_at > '2025-10-01'::timestamp 
-- AND role IN ('admin', 'adviser');