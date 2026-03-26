
-- 1. Drop and recreate CHECK constraints with new types
ALTER TABLE public.programacoes DROP CONSTRAINT programacoes_tipo_check;
ALTER TABLE public.programacoes ADD CONSTRAINT programacoes_tipo_check CHECK (
  tipo = ANY (ARRAY[
    'formacao'::text, 'visita'::text, 'acompanhamento_aula'::text, 'acompanhamento_formacoes'::text,
    'agenda_gestao'::text, 'autoavaliacao'::text, 'devolutiva_pedagogica'::text,
    'obs_engajamento_solidez'::text, 'obs_implantacao_programa'::text, 'observacao_aula'::text,
    'obs_uso_dados'::text, 'participa_formacoes'::text, 'qualidade_acomp_aula'::text,
    'qualidade_implementacao'::text, 'qualidade_atpcs'::text, 'sustentabilidade_programa'::text,
    'avaliacao_formacao_participante'::text, 'lista_presenca'::text,
    'observacao_aula_redes'::text, 'encontro_eteg_redes'::text, 'encontro_professor_redes'::text,
    'lideranca_gestores_pei'::text, 'monitoramento_gestao'::text,
    'acomp_professor_tutor'::text, 'pec_qualidade_aula'::text, 'visita_voar'::text
  ])
);

ALTER TABLE public.registros_acao DROP CONSTRAINT registros_acao_tipo_check;
ALTER TABLE public.registros_acao ADD CONSTRAINT registros_acao_tipo_check CHECK (
  tipo = ANY (ARRAY[
    'acompanhamento_formacoes'::text, 'agenda_gestao'::text, 'autoavaliacao'::text,
    'devolutiva_pedagogica'::text, 'formacao'::text, 'obs_engajamento_solidez'::text,
    'obs_implantacao_programa'::text, 'observacao_aula'::text, 'obs_uso_dados'::text,
    'participa_formacoes'::text, 'qualidade_acomp_aula'::text, 'qualidade_implementacao'::text,
    'qualidade_atpcs'::text, 'sustentabilidade_programa'::text, 'avaliacao_formacao_participante'::text,
    'lista_presenca'::text, 'visita'::text, 'acompanhamento_aula'::text,
    'observacao_aula_redes'::text, 'encontro_eteg_redes'::text, 'encontro_professor_redes'::text,
    'lideranca_gestores_pei'::text, 'monitoramento_gestao'::text,
    'acomp_professor_tutor'::text, 'pec_qualidade_aula'::text, 'visita_voar'::text
  ])
);

-- 2. Create relatorios_monitoramento_gestao table
CREATE TABLE public.relatorios_monitoramento_gestao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registro_acao_id uuid REFERENCES public.registros_acao(id) ON DELETE CASCADE NOT NULL,
  publico text[] NOT NULL DEFAULT '{}',
  frente_trabalho text NOT NULL,
  observacao text,
  pdca_temas text,
  pdca_pontos_atencao text,
  pdca_encaminhamentos text,
  pdca_material text,
  pdca_aprendizados text,
  status text NOT NULL DEFAULT 'rascunho',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.relatorios_monitoramento_gestao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage relatorios_monitoramento_gestao"
  ON public.relatorios_monitoramento_gestao
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
