

# Ações Previstas x Realizadas por Tipo - Considerar todos os tipos

## Problema atual

O gráfico "Ações Previstas x Realizadas - Por Tipo" no dashboard está hardcoded com apenas 3 tipos:
- Formação
- Visita
- Acompanhamento

O sistema suporta 16+ tipos de ações (definidos em `acaoPermissions.ts`). O gráfico deveria considerar **todos** os tipos possíveis, mas só exibir aqueles que têm pelo menos 1 ação programada.

## Solução

Alterar o cálculo de `acoesPorTipo` em `src/pages/admin/AdminDashboard.tsx` (linhas 390-406).

### Antes

```typescript
const acoesPorTipo = [
  { name: 'Formação', Previstas: ..., Realizadas: ... },
  { name: 'Visita', Previstas: ..., Realizadas: ... },
  { name: 'Acompanhamento', Previstas: ..., Realizadas: ... }
];
```

### Depois

```typescript
import { ACAO_TIPOS, ACAO_TYPE_INFO } from '@/config/acaoPermissions';

const acoesPorTipo = ACAO_TIPOS
  .map(tipo => {
    const previstas = filteredProgramacoes.filter(p => p.tipo === tipo).length;
    const realizadas = filteredProgramacoes.filter(p => p.tipo === tipo && p.status === 'realizada').length;
    return {
      name: ACAO_TYPE_INFO[tipo].label,
      Previstas: previstas,
      Realizadas: realizadas
    };
  })
  .filter(item => item.Previstas > 0);
```

A lógica:
1. Itera sobre **todos** os tipos de ação conhecidos (`ACAO_TIPOS`)
2. Calcula previstas e realizadas para cada tipo usando `filteredProgramacoes` (que já respeita os filtros de programa, escola e componente)
3. Filtra para exibir apenas tipos com pelo menos 1 ação prevista (`Previstas > 0`)
4. Usa os labels amigáveis de `ACAO_TYPE_INFO` para os nomes no gráfico

## Detalhes técnicos

| Item | Detalhe |
|---|---|
| Arquivo | `src/pages/admin/AdminDashboard.tsx` |
| Linhas afetadas | ~390-406 (bloco `acoesPorTipo`) |
| Import adicional | `ACAO_TIPOS`, `ACAO_TYPE_INFO` de `@/config/acaoPermissions` |
| Migração | Não necessária |

Os filtros de programa e usuário já estão aplicados via `filteredProgramacoes`, que filtra por `programaFilter`, `escolaFilter` e `componenteFilter`. Nenhuma mudança nos filtros é necessária.

