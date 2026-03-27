
-- Add turma_formacao text[] to relatorios_eteg_redes
ALTER TABLE public.relatorios_eteg_redes ADD COLUMN turma_formacao text[] DEFAULT NULL;

-- Convert turma_formacao from text to text[] in relatorios_professor_redes
ALTER TABLE public.relatorios_professor_redes 
  ALTER COLUMN turma_formacao TYPE text[] 
  USING CASE WHEN turma_formacao IS NOT NULL THEN ARRAY[turma_formacao] ELSE NULL END;
