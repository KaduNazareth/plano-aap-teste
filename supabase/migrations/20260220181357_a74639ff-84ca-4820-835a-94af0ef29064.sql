
-- SECURITY: Consolidate professores RLS policies
-- Remove ambiguous/redundant restrictive policies and replace with
-- a clean anon-targeted block. All permissive N1-N8 policies remain intact.

-- Step 1: Remove the two conflicting/redundant restrictive policies
DROP POLICY IF EXISTS "Block anonymous access to professores" ON public.professores;
DROP POLICY IF EXISTS "Require authentication for professores" ON public.professores;

-- Step 2: Create a single, unambiguous RESTRICTIVE policy targeting only anon role
CREATE POLICY "Block anon access to professores"
ON public.professores
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Step 3: Ensure table grants are correct (anon has no privileges)
REVOKE ALL PRIVILEGES ON TABLE public.professores FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.professores FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.professores TO authenticated;
