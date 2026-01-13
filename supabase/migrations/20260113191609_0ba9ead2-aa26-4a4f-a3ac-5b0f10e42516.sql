-- Add status and rescheduling fields to registros_acao
ALTER TABLE public.registros_acao 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'prevista',
ADD COLUMN IF NOT EXISTS reagendada_para DATE,
ADD COLUMN IF NOT EXISTS is_reagendada BOOLEAN DEFAULT FALSE;

-- Create registros_acao from existing programacoes with status 'realizada'
INSERT INTO public.registros_acao (
  aap_id,
  ano_serie,
  componente,
  data,
  escola_id,
  programa,
  programacao_id,
  segmento,
  tipo,
  status
)
SELECT 
  p.aap_id,
  p.ano_serie,
  p.componente,
  p.data,
  p.escola_id,
  p.programa,
  p.id,
  p.segmento,
  p.tipo,
  'realizada'
FROM public.programacoes p
WHERE p.status = 'realizada'
AND NOT EXISTS (
  SELECT 1 FROM public.registros_acao r WHERE r.programacao_id = p.id
);

-- Create registros_acao from existing programacoes with status 'cancelada'
INSERT INTO public.registros_acao (
  aap_id,
  ano_serie,
  componente,
  data,
  escola_id,
  programa,
  programacao_id,
  segmento,
  tipo,
  status
)
SELECT 
  p.aap_id,
  p.ano_serie,
  p.componente,
  p.data,
  p.escola_id,
  p.programa,
  p.id,
  p.segmento,
  p.tipo,
  'cancelada'
FROM public.programacoes p
WHERE p.status = 'cancelada'
AND NOT EXISTS (
  SELECT 1 FROM public.registros_acao r WHERE r.programacao_id = p.id
);

-- Create registros_acao from existing programacoes with status 'reagendada'
INSERT INTO public.registros_acao (
  aap_id,
  ano_serie,
  componente,
  data,
  escola_id,
  programa,
  programacao_id,
  segmento,
  tipo,
  status,
  is_reagendada
)
SELECT 
  p.aap_id,
  p.ano_serie,
  p.componente,
  p.data,
  p.escola_id,
  p.programa,
  p.id,
  p.segmento,
  p.tipo,
  'reagendada',
  true
FROM public.programacoes p
WHERE p.status = 'reagendada'
AND NOT EXISTS (
  SELECT 1 FROM public.registros_acao r WHERE r.programacao_id = p.id
);