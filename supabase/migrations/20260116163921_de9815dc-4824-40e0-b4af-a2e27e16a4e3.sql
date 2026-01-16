-- Harden access to the sensitive profiles table.
-- Goal: ensure unauthenticated (anon) requests cannot read ANY profile rows,
-- and add defense-in-depth by revoking table privileges from anon.

-- Ensure RLS is enabled and cannot be bypassed by table owner.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

-- Defense-in-depth: remove any accidental table-level grants to anon/public.
-- (RLS should already protect rows, but explicit revokes prevent misconfig / tooling bypass.)
REVOKE ALL PRIVILEGES ON TABLE public.profiles FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.profiles FROM PUBLIC;

-- Keep authenticated app access working (policies still decide WHICH rows).
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated;

-- Replace the current PERMISSIVE anon policy (false doesn't "deny") with a RESTRICTIVE policy.
DROP POLICY IF EXISTS "Block anonymous access to profiles" ON public.profiles;

CREATE POLICY "Block anonymous access to profiles"
ON public.profiles
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);
