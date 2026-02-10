-- RLS policies for N6/N7 creating registros_acao (observacao_aula, autoavaliacao, avaliacao_formacao_participante)
-- and N8 creating registros_acao (observacao_aula)

-- N6N7 Local INSERT registros_acao (limited types)
CREATE POLICY "N6N7 Local insert registros limited types"
ON public.registros_acao
FOR INSERT
WITH CHECK (
  is_local_user(auth.uid())
  AND user_has_entidade(auth.uid(), escola_id)
  AND aap_id = auth.uid()
  AND tipo IN ('observacao_aula', 'acompanhamento_aula', 'autoavaliacao', 'avaliacao_formacao_participante')
);

-- N6N7 Local UPDATE own registros (limited types)
CREATE POLICY "N6N7 Local update own registros limited types"
ON public.registros_acao
FOR UPDATE
USING (
  is_local_user(auth.uid())
  AND aap_id = auth.uid()
  AND tipo IN ('observacao_aula', 'acompanhamento_aula', 'autoavaliacao', 'avaliacao_formacao_participante')
);

-- N8 Observer INSERT registros_acao (observacao_aula only)
CREATE POLICY "N8 Observer insert registros observacao"
ON public.registros_acao
FOR INSERT
WITH CHECK (
  is_observer(auth.uid())
  AND aap_id = auth.uid()
  AND tipo IN ('observacao_aula', 'acompanhamento_aula')
  AND programa IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM user_programas up
    WHERE up.user_id = auth.uid() AND up.programa::text = ANY(registros_acao.programa)
  )
);

-- N6N7 Local INSERT avaliacoes_aula
CREATE POLICY "N6N7 Local insert avaliacoes"
ON public.avaliacoes_aula
FOR INSERT
WITH CHECK (
  is_local_user(auth.uid())
  AND aap_id = auth.uid()
  AND user_has_entidade(auth.uid(), escola_id)
);

-- N6N7 Local UPDATE own avaliacoes
CREATE POLICY "N6N7 Local update own avaliacoes"
ON public.avaliacoes_aula
FOR UPDATE
USING (
  is_local_user(auth.uid())
  AND aap_id = auth.uid()
);

-- N6N7 Local VIEW avaliacoes in their entity
CREATE POLICY "N6N7 Local view avaliacoes"
ON public.avaliacoes_aula
FOR SELECT
USING (
  is_local_user(auth.uid())
  AND user_has_entidade(auth.uid(), escola_id)
);

-- N8 Observer INSERT avaliacoes_aula
CREATE POLICY "N8 Observer insert avaliacoes"
ON public.avaliacoes_aula
FOR INSERT
WITH CHECK (
  is_observer(auth.uid())
  AND aap_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM registros_acao r
    JOIN user_programas up ON up.user_id = auth.uid()
    WHERE r.id = avaliacoes_aula.registro_acao_id
    AND r.programa IS NOT NULL
    AND up.programa::text = ANY(r.programa)
  )
);