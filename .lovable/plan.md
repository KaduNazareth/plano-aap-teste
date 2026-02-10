

# Pendencias e Notificacoes de Atraso para N3 (Coordenador do Programa)

## Resumo

Consolidar o sistema de pendencias para que o perfil N3 (Coordenador do Programa) visualize acoes atrasadas dentro dos seus Programas, com badge no menu, tela dedicada de Pendencias e notificacoes por email via a Edge Function existente.

## Mapeamento de Campos

A tabela `registros_acao` ja possui os campos necessarios, sem necessidade de colunas novas:

| Campo solicitado | Campo existente | Observacao |
|------------------|-----------------|------------|
| `data_prevista` | `data` (ou `reagendada_para` se reagendada) | Ja usado na logica atual |
| `data_conclusao` | Inferido por `status = 'realizada'` + `updated_at` | Nao precisa coluna separada |
| `responsavel_user_id` | `aap_id` | Usuario responsavel pela acao |
| `program_id` | `programa` (array text[]) | Vinculo com programa(s) |
| `escola_id` | `escola_id` | Ja existe |
| `status` | `status` ('agendada', 'reagendada', 'realizada', 'cancelada') | Ja existe |

Regra de atraso (mantida): `status IN ('agendada','reagendada') AND data relevante < hoje - 2 dias`

## Etapas de Implementacao

### 1. Hook de Pendencias -- `usePendencias`

Criar `src/hooks/usePendencias.ts`:
- Busca `registros_acao` com status `agendada` ou `reagendada`
- Filtra no cliente os que estao atrasados (data > 2 dias)
- Para N3: filtra por `programa` que intersecta com `profile.programas`
- Para N1/N2: mostra todos (ou por programa se gestor)
- Retorna `{ pendencias, count, isLoading }`
- Aceita filtros opcionais: programa, escola_id, tipo

### 2. Badge de Pendencias no Sidebar

Atualizar `src/components/layout/Sidebar.tsx`:
- Para perfis N2 e N3 (manager tier): adicionar item "Pendencias" com icone `AlertTriangle` ou `Bell`
- Mostrar badge vermelho com contador ao lado do item de menu
- Badge visivel tambem para N1 (admin)
- Usar o hook `usePendencias` para obter o contador

### 3. Pagina de Pendencias

Criar `src/pages/admin/PendenciasPage.tsx`:
- Acessivel por N1, N2 e N3
- Header com contador total de pendencias
- Filtros: Programa, Entidade (escola), Tipo de Acao
- Tabela com colunas: Tipo | Escola | Responsavel (AAP) | Data Prevista | Dias de Atraso | Acoes
- Cada linha com badge de severidade (amarelo < 5 dias, vermelho >= 5 dias)
- Botao para abrir o registro no detalhe (redireciona para /registros com filtro)
- Dados filtrados pelo escopo do usuario (N3 ve somente seus Programas via RLS)

### 4. Rota e Navegacao

- Nova rota: `/pendencias` em `App.tsx`
- Adicionar em `ALLOWED_ROUTES` do AppLayout para `admin` e `manager`
- Adicionar no `managerMenuItems` do Sidebar com icone `AlertTriangle` e badge

### 5. Atualizar Edge Function `send-pending-notifications`

Modificar `supabase/functions/send-pending-notifications/index.ts`:
- Alem de notificar os AAPs responsaveis (comportamento atual mantido), tambem notificar os N3 responsaveis pelo programa
- Logica adicional:
  1. Agrupar registros atrasados por `programa`
  2. Para cada programa, buscar usuarios com role `n3_coordenador_programa` vinculados via `user_programas`
  3. Enviar email consolidado ao N3 com lista de acoes atrasadas do(s) programa(s) que coordena
  4. Respeitar escopo: N3 so recebe notificacao dos programas em `user_programas`
- Template de email especifico para N3 com visao por programa (agrupando acoes)

### 6. Autorizacao da Edge Function para N3

Atualizar a verificacao de autorizacao na edge function:
- Alem de `admin`, permitir que `n3_coordenador_programa` e `gestor` disparem a funcao via JWT
- Manter a autenticacao por secret key para cron jobs

## Detalhes Tecnicos

### Hook usePendencias

```typescript
export function usePendencias(filters?: { programa?: string; escolaId?: string; tipo?: string }) {
  const { user, profile, isAdmin, roleTier } = useAuth();

  return useQuery({
    queryKey: ['pendencias', user?.id, filters],
    queryFn: async () => {
      const { data } = await supabase
        .from('registros_acao')
        .select('id, data, tipo, escola_id, aap_id, status, reagendada_para, programa')
        .in('status', ['agendada', 'reagendada']);

      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      return (data || []).filter(r => {
        const relevantDate = r.status === 'reagendada' && r.reagendada_para
          ? new Date(r.reagendada_para)
          : new Date(r.data);
        return relevantDate <= twoDaysAgo;
      });
    },
  });
}
```

Nota: A filtragem por programa para N3 ja e feita automaticamente pela RLS existente (policy "N2N3 Managers view registros" que valida `user_programas`).

### Badge no Sidebar

O badge sera um componente inline no item de menu:

```typescript
// Dentro do map de menuItems
{item.path === '/pendencias' && pendenciasCount > 0 && (
  <span className="ml-auto bg-error text-white text-xs rounded-full px-2 py-0.5">
    {pendenciasCount}
  </span>
)}
```

### Edge Function -- Notificacao N3

Apos o loop existente de notificacao dos AAPs, adicionar:

1. Buscar todos os programas com acoes atrasadas
2. Buscar N3s via `user_roles` (role = 'n3_coordenador_programa') + `user_programas`
3. Para cada N3, filtrar acoes atrasadas que pertencem aos seus programas
4. Enviar email com template agrupado por programa

### Nenhuma migracao de banco necessaria

A tabela `registros_acao` ja possui todos os campos necessarios. As RLS existentes para N2/N3 ja filtram por programa. Nenhuma coluna nova precisa ser criada.
