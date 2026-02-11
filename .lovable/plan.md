

## Revisao de Seguranca: Politicas RLS da Tabela `programacoes`

### Diagnostico

Apos analisar as 11 politicas RLS da tabela `programacoes`, identifiquei **1 problema critico** e **1 ponto de atencao**:

### Problema 1 (Critico): Politicas aplicam-se a `PUBLIC` em vez de `authenticated`

Todas as 11 politicas omitem a clausula `TO`, o que faz com que se apliquem ao role `PUBLIC` (inclui `anon`). Embora as funcoes de verificacao de role (`is_admin`, `is_gestor`, etc.) retornem `false` para usuarios anonimos (pois `auth.uid()` sera NULL), a pratica recomendada e restringir explicitamente a `authenticated` para:
- Eliminar chamadas desnecessarias as funcoes de verificacao para requisicoes anonimas
- Garantir defesa em profundidade caso alguma funcao tenha bug
- Seguir as melhores praticas de seguranca do Supabase

**Politicas afetadas (todas as 11):**
- N1 Admins manage programacoes
- N2N3 Managers (view/insert/update/delete) -- 4 politicas
- N4N5 Operational (view/insert/update/delete) -- 4 politicas
- N6N7 Local view programacoes
- N8 Observer view programacoes

### Problema 2 (Atencao): N6N7 Local nao filtra por programa

A politica `N6N7 Local view programacoes` verifica apenas `user_has_entidade(auth.uid(), escola_id)`, sem filtrar por programa. Isso significa que um usuario local (coordenador pedagogico ou professor) vinculado a uma entidade pode ver programacoes de **todos os programas** daquela entidade, mesmo que nao participe de todos. Isso pode ser intencional (visibilidade escolar completa) mas merece confirmacao.

### Solucao Proposta

Recriar todas as 11 politicas adicionando `TO authenticated`:

```text
Para cada politica:
1. DROP POLICY "nome_atual" ON public.programacoes;
2. CREATE POLICY "nome_atual" ON public.programacoes
   FOR [comando]
   TO authenticated        -- ADICIONAR ESTA LINHA
   USING (...);            -- manter expressao existente
```

A logica interna de cada politica permanece identica -- apenas se adiciona a restricao de role.

### Resumo das Alteracoes

| Alteracao | Impacto |
|-----------|---------|
| Adicionar `TO authenticated` nas 11 politicas | Bloqueia explicitamente acesso anonimo; sem impacto em usuarios logados |
| (Opcional) Adicionar filtro de programa em N6N7 | Restringiria visibilidade local por programa -- requer confirmacao de regra de negocio |

### Nota sobre dados existentes
Ha 54 registros na tabela (39 realizadas, 10 previstas, 3 reagendadas, 2 canceladas). Nenhum dado sera afetado -- apenas a camada de seguranca sera reforçada.

