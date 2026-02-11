
-- Recreate all 11 RLS policies on programacoes with TO authenticated

-- 1. N1 Admins manage programacoes
DROP POLICY "N1 Admins manage programacoes" ON public.programacoes;
CREATE POLICY "N1 Admins manage programacoes" ON public.programacoes
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- 2. N2N3 Managers view programacoes
DROP POLICY "N2N3 Managers view programacoes" ON public.programacoes;
CREATE POLICY "N2N3 Managers view programacoes" ON public.programacoes
  FOR SELECT TO authenticated
  USING ((is_gestor(auth.uid()) OR has_role(auth.uid(), 'n3_coordenador_programa'::app_role)) AND programa IS NOT NULL AND EXISTS (SELECT 1 FROM user_programas up WHERE up.user_id = auth.uid() AND up.programa::text = ANY(programacoes.programa)));

-- 3. N2N3 Managers insert programacoes
DROP POLICY "N2N3 Managers insert programacoes" ON public.programacoes;
CREATE POLICY "N2N3 Managers insert programacoes" ON public.programacoes
  FOR INSERT TO authenticated
  WITH CHECK ((is_gestor(auth.uid()) OR has_role(auth.uid(), 'n3_coordenador_programa'::app_role)) AND programa IS NOT NULL AND EXISTS (SELECT 1 FROM user_programas up WHERE up.user_id = auth.uid() AND up.programa::text = ANY(programacoes.programa)));

-- 4. N2N3 Managers update programacoes
DROP POLICY "N2N3 Managers update programacoes" ON public.programacoes;
CREATE POLICY "N2N3 Managers update programacoes" ON public.programacoes
  FOR UPDATE TO authenticated
  USING ((is_gestor(auth.uid()) OR has_role(auth.uid(), 'n3_coordenador_programa'::app_role)) AND programa IS NOT NULL AND EXISTS (SELECT 1 FROM user_programas up WHERE up.user_id = auth.uid() AND up.programa::text = ANY(programacoes.programa)));

-- 5. N2N3 Managers delete programacoes
DROP POLICY "N2N3 Managers delete programacoes" ON public.programacoes;
CREATE POLICY "N2N3 Managers delete programacoes" ON public.programacoes
  FOR DELETE TO authenticated
  USING ((is_gestor(auth.uid()) OR has_role(auth.uid(), 'n3_coordenador_programa'::app_role)) AND programa IS NOT NULL AND EXISTS (SELECT 1 FROM user_programas up WHERE up.user_id = auth.uid() AND up.programa::text = ANY(programacoes.programa)));

-- 6. N4N5 Operational view programacoes
DROP POLICY "N4N5 Operational view programacoes" ON public.programacoes;
CREATE POLICY "N4N5 Operational view programacoes" ON public.programacoes
  FOR SELECT TO authenticated
  USING (is_operational(auth.uid()) AND (aap_id = auth.uid() OR user_has_full_data_access(auth.uid(), escola_id, programa)));

-- 7. N4N5 Operational insert programacoes
DROP POLICY "N4N5 Operational insert programacoes" ON public.programacoes;
CREATE POLICY "N4N5 Operational insert programacoes" ON public.programacoes
  FOR INSERT TO authenticated
  WITH CHECK (is_operational(auth.uid()) AND aap_id = auth.uid());

-- 8. N4N5 Operational update programacoes
DROP POLICY "N4N5 Operational update programacoes" ON public.programacoes;
CREATE POLICY "N4N5 Operational update programacoes" ON public.programacoes
  FOR UPDATE TO authenticated
  USING (is_operational(auth.uid()) AND aap_id = auth.uid());

-- 9. N4N5 Operational delete programacoes
DROP POLICY "N4N5 Operational delete programacoes" ON public.programacoes;
CREATE POLICY "N4N5 Operational delete programacoes" ON public.programacoes
  FOR DELETE TO authenticated
  USING (is_operational(auth.uid()) AND aap_id = auth.uid());

-- 10. N6N7 Local view programacoes
DROP POLICY "N6N7 Local view programacoes" ON public.programacoes;
CREATE POLICY "N6N7 Local view programacoes" ON public.programacoes
  FOR SELECT TO authenticated
  USING (is_local_user(auth.uid()) AND user_has_entidade(auth.uid(), escola_id));

-- 11. N8 Observer view programacoes
DROP POLICY "N8 Observer view programacoes" ON public.programacoes;
CREATE POLICY "N8 Observer view programacoes" ON public.programacoes
  FOR SELECT TO authenticated
  USING (is_observer(auth.uid()) AND programa IS NOT NULL AND EXISTS (SELECT 1 FROM user_programas up WHERE up.user_id = auth.uid() AND up.programa::text = ANY(programacoes.programa)));
