-- Add column to track if user must change password on first login
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;

-- Add comment explaining the column
COMMENT ON COLUMN public.profiles.must_change_password IS 'Flag indicating if user must change password on first login';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_must_change_password ON public.profiles(must_change_password) WHERE must_change_password = true;