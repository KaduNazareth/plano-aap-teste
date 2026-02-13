ALTER TABLE public.form_config_settings
  ADD COLUMN programas programa_type[] NOT NULL DEFAULT ARRAY['escolas','regionais','redes_municipais']::programa_type[];