

# Matriz de Acoes/Eventos por Perfil

## Resumo

Implementar um sistema centralizado de permissoes por tipo de acao e perfil (N1-N8), controlando quem pode criar, editar, excluir e visualizar cada tipo de acao. Inclui uma tela administrativa (N1) para visualizar a matriz carregada.

## Tipos de Acao (acao_tipo)

Os tipos de acao padronizados serao:
- `observacao_aula` (Observacao de Aula) -- substitui `acompanhamento_aula`
- `devolutiva_pedagogica` (Devolutiva Pedagogica) -- novo
- `autoavaliacao` (Autoavaliacao) -- novo
- `avaliacao_formacao_participante` (Avaliacao de Formacao - Participante) -- novo
- `qualidade_atpcs` (Qualidade de ATPCs) -- novo
- `formacao` (Formacao) -- existente
- `visita` (Visita) -- existente

## Matriz de Permissoes por Perfil

| Acao | N1 | N2/N3 | N4/N5 | N6 | N7 | N8 |
|------|-----|-------|-------|-----|-----|-----|
| Formacao | CRUD | CRUD(programa) | CRUD(entidade) | View(entidade) | - | View(programa) |
| Visita | CRUD | CRUD(programa) | CRUD(entidade) | View(entidade) | - | View(programa) |
| Observacao de Aula | CRUD | CRUD(programa) | CRUD(entidade) | View(entidade) | CR(entidade) | CR(programa) |
| Devolutiva Pedagogica | CRUD | CRUD(programa) | CRUD(entidade) | View(entidade) | - | View(programa) |
| Autoavaliacao | CRUD | CRUD(programa) | - | CR(proprio) | - | - |
| Aval. Formacao Participante | CRUD | CRUD(programa) | - | CR(proprio) | CR(proprio) | - |
| Qualidade ATPCs | CRUD | CRUD(programa) | CRUD(entidade) | View(entidade) | - | View(programa) |

## Etapas de Implementacao

### 1. Definicao da Matriz no Frontend (configuracao central)

Criar `src/config/acaoPermissions.ts` com:
- Constante `ACAO_TYPES` definindo todos os tipos de acao com label e icone
- Constante `ACAO_PERMISSION_MATRIX` mapeando cada role a cada acao_tipo com flags: `canCreate`, `canEdit`, `canDelete`, `canView`, e `viewScope` (proprio / entidade / programa / all)
- Funcoes auxiliares: `canUserCreateAcao(role, acaoTipo)`, `canUserViewAcao(role, acaoTipo)`, `getAcoesForRole(role)`, `getPermissionsForAcao(role, acaoTipo)`

### 2. Migracao de Banco de Dados

- Criar enum `acao_tipo` ou usar text com check constraint para padronizar os tipos
- Adicionar alias de compatibilidade: `acompanhamento_aula` mapeia para `observacao_aula`
- Nenhuma nova tabela e necessaria -- a matriz fica no frontend como configuracao estatica; o backend valida via RLS + edge function

### 3. Atualizacao da UI -- Menu e Telas de Criacao

- **Sidebar**: nenhuma mudanca estrutural, pois ja usa tier-based menus
- **AAPRegistrarAcaoPage**: filtrar `tipoAcaoLabels` usando `getAcoesForRole(profile.role)` para mostrar apenas tipos permitidos
- **RegistrosPage**: filtrar acoes visiveis e botoes de editar/excluir usando a matriz
- **ProgramacaoPage**: na criacao de programacao, filtrar tipos de acao disponiveis pelo perfil

### 4. Validacao no Backend

- Atualizar a edge function `manage-users` ou criar uma nova funcao `validate-acao-permission` que verifica a matriz antes de salvar
- Alternativamente, validar inline no frontend antes do insert e confiar nas RLS existentes para escopo (as RLS ja controlam programa/entidade)
- Para N6 e N7 criando registros (observacao_aula, autoavaliacao, avaliacao_formacao_participante), sera necessario adicionar RLS INSERT policies para `is_local_user` na tabela `registros_acao` e `avaliacoes_aula`, limitadas aos tipos permitidos

### 5. Tela Administrativa -- Matriz de Acoes x Perfis (somente N1)

- Criar `src/pages/admin/MatrizAcoesPage.tsx`
- Tabela visual mostrando todos os tipos de acao vs todos os perfis, com icones de permissao (check verde, X vermelho, olho para view-only)
- Rota `/matriz-acoes` adicionada ao `App.tsx` e ao menu admin no `Sidebar.tsx`
- Dados carregados da constante `ACAO_PERMISSION_MATRIX` (read-only, sem edicao)

### 6. Atualizacao de Labels e Compatibilidade

- Atualizar `tipoAcaoLabels` em `mockData.ts` com os novos tipos
- Manter compatibilidade com `acompanhamento_aula` mapeando para `observacao_aula` onde necessario

## Detalhes Tecnicos

### Estrutura do arquivo `acaoPermissions.ts`

```typescript
export type AcaoTipo = 
  | 'formacao' | 'visita' | 'observacao_aula' 
  | 'devolutiva_pedagogica' | 'autoavaliacao'
  | 'avaliacao_formacao_participante' | 'qualidade_atpcs';

export type ViewScope = 'proprio' | 'entidade' | 'programa' | 'all';

export interface AcaoPermission {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canView: boolean;
  viewScope: ViewScope;
}

// ACAO_PERMISSION_MATRIX: Record<AppRole, Record<AcaoTipo, AcaoPermission>>
```

### Novas RLS Policies necessarias

- `registros_acao`: INSERT policy para `is_local_user` com restricao de tipo (`observacao_aula`, `autoavaliacao`, `avaliacao_formacao_participante`)
- `avaliacoes_aula`: INSERT policy para `is_local_user` limitada a suas entidades
- `registros_acao`: INSERT policy para `is_observer` (N8) para `observacao_aula`

### Rota e Menu

- Nova rota: `/matriz-acoes` -> `MatrizAcoesPage`
- Sidebar admin: adicionar item "Matriz de Acoes" com icone `Grid3X3` ou `Table`
- AppLayout ALLOWED_ROUTES: adicionar `/matriz-acoes` apenas para admin

