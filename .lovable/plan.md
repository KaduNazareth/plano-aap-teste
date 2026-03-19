

# Ajustes nos Formulários REDES

## Resumo

Três mudanças principais: (1) remover a seção "Formulários REDES" do menu lateral, (2) integrar os formulários REDES ao fluxo normal de registro de ação, e (3) corrigir os campos Município/Data/Horário para usar dados da entidade e da programação.

---

## Detalhes técnicos

### 1. Remover "Formulários REDES" do menu lateral

**Arquivo:** `src/components/layout/Sidebar.tsx`
- Remover a constante `redesFormItems` (linhas 107-111)
- Remover a variável `visibleRedesForms` (linha 152)
- Remover o bloco JSX "Formulários REDES" (linhas 262-282)

**Arquivo:** `src/components/layout/AppLayout.tsx`
- Remover as rotas `/formularios/*` do `ALLOWED_ROUTES` de cada tier (já que serão acessadas pelo fluxo de ação)

**Arquivo:** `src/App.tsx`
- Remover as 3 rotas `<Route path="/formularios/...">` (linhas 73-96) e os imports correspondentes

### 2. Integrar os formulários REDES no fluxo de registro de ação

Quando o usuário seleciona uma programação de tipo REDES (`observacao_aula_redes`, `encontro_eteg_redes`, `encontro_professor_redes`), em vez de mostrar o `InstrumentForm` genérico, renderizar o formulário REDES específico inline.

**Arquivo:** `src/pages/aap/AAPRegistrarAcaoPage.tsx`
- Detectar quando `normalizedTipo` é um dos 3 tipos REDES
- Em vez de `<InstrumentForm>`, renderizar o componente REDES correspondente (refatorado como componentes embutíveis)
- O campo `municipio` será preenchido automaticamente com o nome da entidade (escola) da programação
- `data` e `horário` virão da programação selecionada (já disponíveis em `selectedProgramacao.data`, `horario_inicio`, `horario_fim`)
- Ao submeter, salvar na tabela REDES correspondente (`observacoes_aula_redes`, etc.) com os dados preenchidos

**Arquivo:** `src/pages/admin/ProgramacaoPage.tsx`
- Mesma lógica: ao gerenciar uma programação de tipo REDES, abrir o formulário REDES específico

### 3. Refatorar os 3 formulários REDES em componentes embutíveis

Transformar cada formulário standalone em um componente reutilizável que recebe props:

**Novos componentes (refatorados dos existentes):**
- `src/components/formularios/ObservacaoAulaRedesForm.tsx`
- `src/components/formularios/EncontroETEGRedesForm.tsx`
- `src/components/formularios/EncontroProfessorRedesForm.tsx`

Cada componente receberá:
```typescript
interface RedesFormProps {
  entidadeNome: string;      // nome da entidade (auto-preenchido)
  entidadeId?: string;       // para seleção se múltiplas
  entidades?: { id: string; nome: string }[];  // lista de entidades do ator
  data: string;              // data da programação
  horarioInicio: string;     // horário da programação
  horarioFim: string;
  onSubmit: (data: any) => Promise<void>;
  onSaveDraft?: (data: any) => Promise<void>;
}
```

**Lógica do campo "Entidade" (antigo Município):**
- Se o ator tem 1 entidade → campo preenchido e desabilitado
- Se o ator tem múltiplas → caixa de seleção (Select/dropdown)
- O valor vem das entidades do usuário (`user_entidades` → `escolas`)

**Lógica de Data e Horário:**
- Ambos preenchidos automaticamente a partir da programação
- Campos exibidos como somente-leitura (informação contextual)

### 4. Arquivos removidos
- `src/pages/formularios/ObservacaoAulaRedes.tsx` (lógica movida para componente embutível)
- `src/pages/formularios/EncontroETEGRedes.tsx`
- `src/pages/formularios/EncontroProfessorRedes.tsx`

Os arquivos `redesFormShared.tsx` permanecem pois contêm constantes e componentes visuais reutilizáveis (rubricas, escalas, etc.).

### Resumo de arquivos

| Arquivo | Alteração |
|---|---|
| `src/components/layout/Sidebar.tsx` | Remover seção "Formulários REDES" |
| `src/components/layout/AppLayout.tsx` | Remover rotas `/formularios/*` dos ALLOWED_ROUTES |
| `src/App.tsx` | Remover 3 rotas e imports REDES |
| `src/pages/aap/AAPRegistrarAcaoPage.tsx` | Renderizar formulário REDES inline para tipos REDES |
| `src/pages/admin/ProgramacaoPage.tsx` | Idem para gestão de programação |
| `src/components/formularios/ObservacaoAulaRedesForm.tsx` | Novo componente embutível |
| `src/components/formularios/EncontroETEGRedesForm.tsx` | Novo componente embutível |
| `src/components/formularios/EncontroProfessorRedesForm.tsx` | Novo componente embutível |
| Formulários standalone em `src/pages/formularios/` | Removidos (exceto `redesFormShared.tsx`) |

