
# Correção: Botões de importação não aparecem na simulação de perfil

## Diagnóstico

O `canBatchImport` foi implementado verificando `profile?.role`:

```typescript
const canBatchImport = isAdminOrGestor || 
  profile?.role === 'n3_coordenador_programa' || 
  profile?.role === 'n4_1_cped' || 
  profile?.role === 'n4_2_gpi';
```

O problema é que `profile?.role` sempre retorna o papel **real** do usuário (admin), ignorando a simulação. Já `isAdminOrGestor` usa o `effectiveRole` (que respeita a simulação), mas quando simulando N4, `isAdminOrGestor` é `false` e `profile?.role` continua sendo `admin` — nenhuma condição dos N3/N4 é satisfeita.

A solução correta é usar os helpers que já respeitam a simulação: `isAAP` (que inclui N4) e `isManager` (que inclui N3).

## Solução

Alterar **uma linha** em `src/pages/admin/ProfessoresPage.tsx`:

### Antes (linha ~114)

```typescript
const canBatchImport = isAdminOrGestor || 
  profile?.role === 'n3_coordenador_programa' || 
  profile?.role === 'n4_1_cped' || 
  profile?.role === 'n4_2_gpi';
```

### Depois

```typescript
const canBatchImport = isAdminOrGestor || isManager || isAAP;
```

Isso funciona porque:
- `isAdminOrGestor` cobre N1 e N2
- `isManager` cobre N3 (coordenador de programa)
- `isAAP` cobre N4 (CPed, GPI) e N5 (formador)

Todos esses helpers usam `effectiveRole`, respeitando corretamente a simulação de perfil.

**Nota:** Isso também habilita N5 (Formador) para importação em lote, o que é consistente com a permissão de gerenciamento (`canManageProfessores = isAdminOrGestor || isAAP`). Se quiser restringir apenas a N4, usamos uma verificação mais específica com `effectiveRole` em vez de `profile?.role`.

## Resumo

| Item | Detalhe |
|---|---|
| Causa raiz | `profile?.role` não reflete a simulação de perfil; apenas `effectiveRole` e os helpers derivados o fazem |
| Arquivo | `src/pages/admin/ProfessoresPage.tsx` |
| Alteração | Substituir checagens de `profile?.role` por helpers `isManager` e `isAAP` |
| Migração | Não necessária |
