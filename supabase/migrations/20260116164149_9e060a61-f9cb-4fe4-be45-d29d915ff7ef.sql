-- SECURITY: tighten access to sensitive tables (profiles, professores)

-- ================================================================
-- PROFILES: remove Gestor broad visibility (PII exposure)
-- Only profile owner + admins should SELECT from public.profiles.
-- ================================================================
DROP POLICY IF EXISTS "Gestores can view AAP profiles from programs" ON public.profiles;

-- (Keep existing policies:
--  - Users can view own profile
--  - Admins can view all profiles
--  - Users/Admins update policies, etc.)

-- ================================================================
-- PROFESSORES: enforce RLS + remove any implicit public access
-- ================================================================
ALTER TABLE public.professores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professores FORCE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.professores FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.professores FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.professores TO authenticated;

-- Replace current PERMISSIVE anon policy (false doesn't deny) with RESTRICTIVE
DROP POLICY IF EXISTS "Block anonymous access to professores" ON public.professores;

CREATE POLICY "Block anonymous access to professores"
ON public.professores
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);
