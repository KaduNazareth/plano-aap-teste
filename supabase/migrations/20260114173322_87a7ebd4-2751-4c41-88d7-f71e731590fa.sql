-- Drop existing overly permissive gestor policy on profiles
DROP POLICY IF EXISTS "Gestores can view all profiles" ON public.profiles;

-- Drop the generic "Require authentication" policy that gives access to all authenticated users
DROP POLICY IF EXISTS "Require authentication to access profiles" ON public.profiles;

-- Create new policy: Gestores can only view profiles of AAPs from their programs
CREATE POLICY "Gestores can view AAP profiles from their programs"
ON public.profiles
FOR SELECT
USING (
  is_gestor(auth.uid()) AND (
    EXISTS (
      SELECT 1
      FROM public.gestor_programas gp
      JOIN public.aap_programas ap ON gp.programa = ap.programa
      WHERE gp.gestor_user_id = auth.uid()
        AND ap.aap_user_id = profiles.id
    )
  )
);

-- Ensure users can update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);