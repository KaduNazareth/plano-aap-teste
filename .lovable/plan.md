
# Consolidar e Fortalecer as Políticas RLS da Tabela `professores`

## Diagnóstico da Situação Atual

A tabela `professores` contém dados pessoais sensíveis: e-mail e telefone de educadores. As políticas de RLS atuais apresentam dois problemas de clareza e uma possível brecha de segurança:

### Problema 1: Política "Block anonymous access" ambígua

A política `"Block anonymous access to professores"` com `USING (false)` é do tipo RESTRICTIVE. No PostgreSQL, políticas RESTRICTIVE se aplicam a **todas as consultas que passem pelas políticas permissivas**. Se esta política for FOR ALL sem especificar `TO anon`, ela bloqueia **todos os usuários**, inclusive os autenticados. O histórico de migrações mostra que foi criada com `TO anon` inicialmente, mas foi recriada de forma menos específica depois.

### Problema 2: "Require authentication" redundante e confuso

A política `"Require authentication for professores"` com `USING (auth.uid() IS NOT NULL)` é RESTRICTIVE FOR ALL TO authenticated. Embora não cause dano por si só (todo usuário autenticado passa nessa verificação), cria confusão junto com a política de "Block anonymous" e torna o modelo difícil de auditar.

### Problema 3: Lacuna nas políticas de INSERT/UPDATE/DELETE para N6/N7

As políticas N6N7 têm somente SELECT, mas os tipos de `registros_acao` permitidos para N6N7 já existem. Para `professores`, não há política de escrita para usuários locais — o que é intencional, mas precisa estar documentado e confirmado.

### Problema 4: Falta de política para N4N5 via `user_entidades`

A política atual para N4N5 usa `user_has_entidade(auth.uid(), escola_id)`. Isso está correto e seguro, mas ao contrário de `registros_acao` onde N4N5 também acessa via programa, aqui o acesso é estritamente pela entidade vinculada. Isso é seguro, pois professores pertencem a escolas específicas.

## Solução Proposta

Criar uma nova migração que:

1. **Remove as duas políticas confusas/redundantes**:
   - `"Block anonymous access to professores"` (RESTRICTIVE com USING false)
   - `"Require authentication for professores"` (RESTRICTIVE redundante)

2. **Substitui por uma única política RESTRICTIVE clara**, aplicada somente ao role `anon`, que bloqueie todo acesso anônimo:
   ```sql
   CREATE POLICY "Block anon access to professores"
   ON public.professores
   AS RESTRICTIVE
   FOR ALL
   TO anon
   USING (false)
   WITH CHECK (false);
   ```

3. **Mantém intactas todas as políticas permissivas N1–N8** existentes, pois elas já implementam corretamente a hierarquia organizacional:
   - N1 (Admin): acesso total
   - N2/N3 (Gestores/Coord): via `user_programas` → `professores.programa`
   - N4/N5 (Operacional): via `user_entidades` → `professores.escola_id`
   - N6/N7 (Local): somente SELECT via `user_entidades` → `professores.escola_id`
   - N8 (Observador): somente SELECT via `user_programas` → `professores.programa`

4. **Garante que `REVOKE` e `GRANT` de tabela estejam corretos** (apenas `authenticated`, não `anon` nem `public`).

## Por que essa abordagem é segura

```text
Usuário Anônimo
  → RESTRICTIVE "Block anon" (TO anon, USING false)
  → Bloqueado ✓

Usuário Autenticado sem papel
  → Passa na RESTRICTIVE (não é anon)
  → Nenhuma política PERMISSIVE o cobre
  → Bloqueado por ausência de política permissiva ✓

Admin (N1)
  → Passa na RESTRICTIVE
  → "N1 Admins manage professores" cobre → Acesso total ✓

Gestor/N3 (N2/N3)
  → Passa na RESTRICTIVE
  → "N2N3 Managers..." com verificação de programa → Acesso ao seu programa ✓

Operacional (N4/N5)
  → Passa na RESTRICTIVE
  → "N4N5 Operational..." com verificação de entidade → Somente escolas vinculadas ✓

Local (N6/N7)
  → Passa na RESTRICTIVE
  → "N6N7 Local view professores" SELECT apenas, com entidade → Somente leitura ✓

Observador (N8)
  → Passa na RESTRICTIVE
  → "N8 Observer view professores" SELECT apenas, com programa → Somente leitura ✓
```

## Detalhes Técnicos da Migração

### Arquivo: nova migração SQL

```sql
-- SECURITY: Consolidate professores RLS policies
-- Remove ambiguous/redundant restrictive policies and replace with
-- a clean anon-targeted block. All permissive N1-N8 policies remain intact.

-- Step 1: Remove the two conflicting/redundant restrictive policies
DROP POLICY IF EXISTS "Block anonymous access to professores" ON public.professores;
DROP POLICY IF EXISTS "Require authentication for professores" ON public.professores;

-- Step 2: Create a single, unambiguous RESTRICTIVE policy targeting only anon role
CREATE POLICY "Block anon access to professores"
ON public.professores
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Step 3: Ensure table grants are correct (anon has no privileges)
REVOKE ALL PRIVILEGES ON TABLE public.professores FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.professores FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.professores TO authenticated;
```

## O que NÃO muda

- Nenhuma política permissiva N1–N8 é removida ou alterada.
- Nenhum código frontend precisa ser alterado.
- O comportamento de acesso para todos os usuários autenticados permanece idêntico.
- Apenas a ambiguidade das políticas RESTRICTIVE é resolvida.

## Impacto

| Aspecto | Antes | Depois |
|---|---|---|
| "Block anonymous access" | RESTRICTIVE FOR ALL (TO quem?) — ambíguo | RESTRICTIVE FOR ALL TO anon — explícito |
| "Require authentication" | RESTRICTIVE redundante para authenticated | Removido — desnecessário pois anon já é bloqueado |
| Acesso anônimo | Potencialmente bloqueado por USING(false) ambíguo | Explicitamente bloqueado via TO anon |
| Acesso autenticado sem papel | Passa na RESTRICTIVE, mas sem política permissiva → bloqueado | Igual — sem mudança de comportamento |
| Auditabilidade | Confusa: 2 políticas contraditórias | Clara: 1 bloco anon + N1-N8 permissivas |
