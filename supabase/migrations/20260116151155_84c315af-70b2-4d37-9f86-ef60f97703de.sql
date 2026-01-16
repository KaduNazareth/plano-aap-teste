-- Add RLS policies to protect the profiles table from anonymous access
-- This ensures that unauthenticated users cannot access user contact information

-- Deny anonymous SELECT on profiles
CREATE POLICY "Deny anonymous select on profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- Deny anonymous INSERT on profiles
CREATE POLICY "Deny anonymous insert on profiles"
ON public.profiles
FOR INSERT
TO anon
WITH CHECK (false);

-- Deny anonymous UPDATE on profiles
CREATE POLICY "Deny anonymous update on profiles"
ON public.profiles
FOR UPDATE
TO anon
USING (false);

-- Deny anonymous DELETE on profiles
CREATE POLICY "Deny anonymous delete on profiles"
ON public.profiles
FOR DELETE
TO anon
USING (false);