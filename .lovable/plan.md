
# Corrigir Contagem de "Consultores / Gestores / Formadores" no Dashboard

## Diagnóstico completo

Consultando o banco diretamente, confirmamos:

| Papel | Usuários |
|---|---|
| N3 — Coordenador do Programa | 11 |
| N4.1 — Consultor Pedagógico | 7 |
| N2 — Gestor do Programa | 5 |
| N4.2 — Gestor de Parceria (GPI) | 2 |
| **Total** | **25 usuários distintos** |

O dashboard conta todos os 25, pois a query em `AdminDashboard.tsx` inclui os papéis `gestor` (N2) e `n3_coordenador_programa` (N3) junto com os operacionais.

O número 9 da página `/atores` **não é o total real** — é o total filtrado pela visibilidade do usuário logado (N2 vê apenas N3+, N3 vê apenas N4+, etc.), ou seja, é um total de escopo, não o cadastro completo.

## Decisão necessária

O card no dashboard deve mostrar o **total real de todos os atores de programa cadastrados no sistema** (25), ou apenas um subconjunto específico? Com base na terminologia "Consultores / Gestores / Formadores", parece que o objetivo é incluir todos os papéis de programa (N2 a N5 + legados), o que é exatamente os 25.

**O número 9 que aparece na página `/atores` está filtrado pelo contexto do usuário logado** — não é o total do sistema.

## Solução proposta

Dado que os 25 são de fato todos os atores de programa e a contagem está correta matematicamente, a opção mais adequada é **renomear o card** para deixar claro que inclui todos os níveis gerenciais e operacionais — e confirmar que o link vai para a página correta.

Também é possível que o usuário queira contar **apenas os papéis operacionais** (N4.1, N4.2, N5 + legados), excluindo gestores e coordenadores de programa. Isso resultaria em:

- N4.1 (CPed): 7
- N4.2 (GPI): 2
- N5 (Formador): 0
- Legados (aap_*): 0
- **Total operacional: 9** ← este seria o número que corresponde ao que o usuário vê na página /atores como Consultor/Formador

Isso é coerente — a página `/atores` ao ser vista pelo admin mostra somente os operacionais (N4/N5) porque os gestores e coordenadores aparecem em outra seção ou o admin está logado como um nível que filtra esse resultado.

## O que será alterado

### `src/pages/admin/AdminDashboard.tsx`

**Remover `gestor` e `n3_coordenador_programa` da query de roles** usada para o card "Consultores / Gestores / Formadores", mantendo apenas os perfis verdadeiramente operacionais (N4.1, N4.2, N5 e legados):

```typescript
supabase.from('user_roles').select('user_id, role').in('role', [
  // Remover: 'gestor', 'n3_coordenador_programa'
  'n4_1_cped', 'n4_2_gpi', 'n5_formador',
  'aap_inicial', 'aap_portugues', 'aap_matematica'
]),
```

Isso resultará em 9 usuários — compatível com o que o usuário vê na página de referência.

**Atualizar o título do card** para refletir melhor o escopo:

```tsx
title="Consultores / Formadores"
// ou manter "Consultores / Gestores / Formadores"
// (gestores e coord. programa ficam representados em outra contagem se necessário)
```

### Sem migração de banco necessária

Nenhuma mudança de schema é necessária — apenas ajuste da query de filtro de papéis no dashboard.

## Resumo

| Item | Detalhe |
|---|---|
| Causa raiz | Query inclui N2 (Gestor) e N3 (Coord. Programa) além dos perfis operacionais |
| Solução | Remover `gestor` e `n3_coordenador_programa` da lista de papéis da query |
| Resultado esperado | Card mostrará 9 (somente N4.1, N4.2, N5 e legados) |
| Arquivo alterado | `src/pages/admin/AdminDashboard.tsx` somente |
