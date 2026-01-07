-- Create table for gestor programs (similar to aap_programas)
CREATE TABLE public.gestor_programas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gestor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  programa public.programa_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(gestor_user_id, programa)
);

-- Enable RLS
ALTER TABLE public.gestor_programas ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage gestor_programas"
ON public.gestor_programas
FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Gestores can view their own programas"
ON public.gestor_programas
FOR SELECT
USING (auth.uid() = gestor_user_id);

-- Index for performance
CREATE INDEX idx_gestor_programas_user_id ON public.gestor_programas(gestor_user_id);