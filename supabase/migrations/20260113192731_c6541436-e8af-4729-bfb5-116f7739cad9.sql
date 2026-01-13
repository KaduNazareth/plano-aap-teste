-- Drop the existing check constraint
ALTER TABLE public.programacoes DROP CONSTRAINT programacoes_status_check;

-- Add new check constraint with 'reagendada' status included
ALTER TABLE public.programacoes ADD CONSTRAINT programacoes_status_check 
CHECK (status = ANY (ARRAY['prevista'::text, 'realizada'::text, 'cancelada'::text, 'reagendada'::text]));