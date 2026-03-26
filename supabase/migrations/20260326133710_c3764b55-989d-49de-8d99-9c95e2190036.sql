CREATE TABLE public.entidades_filho (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id uuid NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
  codesc_filho text NOT NULL,
  nome text NOT NULL,
  ativa boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.entidades_filho ENABLE ROW LEVEL SECURITY;

CREATE POLICY "N1 Admins manage entidades_filho"
  ON public.entidades_filho FOR ALL TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Authenticated users can view entidades_filho"
  ON public.entidades_filho FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);