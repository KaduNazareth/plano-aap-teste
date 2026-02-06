
# Interface de Gerenciamento de Mapeamento Notion ↔ Sistema

## Resumo

Criar uma nova página administrativa para gerenciar o mapeamento entre usuários do Notion e usuários do sistema, permitindo configurar qual usuário do sistema corresponde a cada email do Notion e qual escola padrão associar às tarefas sincronizadas.

---

## Arquitetura da Interface

A interface seguirá o mesmo padrão visual e de código das outras páginas administrativas existentes (EscolasPage, UsuariosPage), utilizando:
- `DataTable` para exibição dos mapeamentos
- `Dialog` para formulário de criação/edição
- Filtros e busca
- Feedback via `toast` (sonner)

---

## Componentes a Implementar

### 1. Nova Página: `src/pages/admin/NotionSyncPage.tsx`

Funcionalidades:
- Listar todos os mapeamentos cadastrados em `notion_sync_config`
- Adicionar novo mapeamento (email Notion → usuário do sistema + escola padrão)
- Editar mapeamento existente
- Excluir mapeamento
- Ativar/desativar mapeamento
- Visualizar logs de sincronização recentes

---

## Campos do Formulário

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| Email do Notion | texto | Sim | Email usado no Notion pelo responsável |
| Usuário do Sistema | select | Sim | Dropdown com usuários do sistema (profiles) |
| Escola Padrão | select | Sim | Dropdown com escolas ativas |
| Ativo | switch | Não | Se o mapeamento está ativo |

---

## Visualização da Tabela

Colunas exibidas:
1. **Status** - Badge indicando se está ativo/inativo
2. **Email Notion** - Email configurado
3. **Usuário Sistema** - Nome do usuário vinculado
4. **Escola Padrão** - Nome da escola associada
5. **Última Sincronização** - Data do último log de sucesso
6. **Ações** - Editar, Excluir

---

## Integração com Menu

Adicionar item no menu administrativo em `Sidebar.tsx`:
- Ícone: `RefreshCw` ou `Link2`
- Label: "Integração Notion"
- Path: `/notion-sync`

---

## Seção de Logs

Incluir na página uma seção que mostra os últimos 10 logs de sincronização da tabela `notion_sync_log`, exibindo:
- Data/hora
- Status (sucesso, erro, ignorado)
- Tabela destino
- Mensagem de erro (se houver)

---

## Fluxo de Arquivos

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/pages/admin/NotionSyncPage.tsx` | **CRIAR** | Nova página de gerenciamento |
| `src/components/layout/Sidebar.tsx` | **MODIFICAR** | Adicionar item de menu |
| `src/App.tsx` | **MODIFICAR** | Adicionar rota `/notion-sync` |

---

## Detalhes Técnicos

### Estrutura de Dados Utilizada

```typescript
interface NotionSyncConfig {
  id: string;
  notion_user_email: string;
  notion_user_id: string | null;
  system_user_id: string;
  escola_padrao_id: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

interface NotionSyncLog {
  id: string;
  notion_page_id: string;
  notion_database_id: string | null;
  tabela_destino: string;
  registro_id: string | null;
  operacao: string;
  status: string;
  erro_mensagem: string | null;
  payload: Json | null;
  created_at: string;
}
```

### Queries Supabase

```typescript
// Buscar configurações com joins
const { data } = await supabase
  .from('notion_sync_config')
  .select(`
    *,
    profiles:system_user_id(nome, email),
    escolas:escola_padrao_id(nome)
  `)
  .order('created_at', { ascending: false });

// Buscar logs recentes
const { data: logs } = await supabase
  .from('notion_sync_log')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(10);
```

### Permissões

A página será acessível apenas para **administradores**, seguindo o mesmo padrão da página de Usuários:
- Verificação via `useAuth()` hook
- RLS já configurado nas tabelas notion_sync_config e notion_sync_log

---

## Mockup Visual

```text
┌─────────────────────────────────────────────────────────────────┐
│  Integração Notion                                              │
│  Configure o mapeamento entre usuários do Notion e do sistema  │
│                                                    [+ Novo]     │
├─────────────────────────────────────────────────────────────────┤
│ 🔍 Buscar por email...                                          │
├─────────────────────────────────────────────────────────────────┤
│ Status │ Email Notion │ Usuário Sistema │ Escola │ Ações       │
├────────┼──────────────┼─────────────────┼────────┼─────────────┤
│ ● Ativo│ user@notion  │ João Silva      │ E.E. X │ ✏️ 🗑️       │
│ ○ Inat │ old@notion   │ Maria Santos    │ E.E. Y │ ✏️ 🗑️       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Últimas Sincronizações                                         │
├─────────────────────────────────────────────────────────────────┤
│ Data/Hora        │ Status   │ Destino      │ Erro               │
├──────────────────┼──────────┼──────────────┼────────────────────┤
│ 06/02 17:30      │ ✓ sucesso│ programacoes │ -                  │
│ 06/02 17:29      │ ⚠ ignor. │ programacoes │ Usuário não mapeado│
└─────────────────────────────────────────────────────────────────┘
```

---

## Validações

- Email do Notion não pode ser duplicado
- Usuário do sistema é obrigatório
- Escola padrão é obrigatória para que as tarefas possam ser sincronizadas
- Feedback visual claro para cada estado (sucesso, erro, aguardando)

---

## Botão de Sincronização Manual

Adicionar um botão "Sincronizar Agora" que chama a Edge Function `notion-sync` para executar uma sincronização manual, permitindo testar a configuração após adicionar um novo mapeamento.
