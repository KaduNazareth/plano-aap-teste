-- Remove the redundant authentication policy as existing RESTRICTIVE policies already ensure proper access control
-- The existing policies (Admins, Gestores, Users own profile) already require authentication implicitly
DROP POLICY IF EXISTS "Require authentication for profiles select" ON public.profiles;