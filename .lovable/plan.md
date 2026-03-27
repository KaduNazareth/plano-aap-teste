

# Adicionar campo "Turma de Formação" multi-select nos formulários REDES

## Situação atual

- **Encontro Professor**: já tem `turma_formacao` como select simples (single). Coluna no banco é `text`.
- **Encontro ET/EG**: não tem campo de turma. Tabela `relatorios_eteg_redes` não tem coluna `turma_formacao`.

## Plano

### 1. Migration: adicionar coluna e converter tipo

- Adicionar `turma_formacao text[]` na tabela `relatorios_eteg_redes`
- Converter `turma_formacao` de `text` para `text[]` na tabela `relatorios_professor_redes` (preservando dados existentes)

### 2. Componente multi-select com checkboxes

Em ambos os formulários, substituir o Select simples por um dropdown com checkboxes (usando Popover + Command ou Popover + Checkbox list) que permite selecionar múltiplas turmas. As turmas selecionadas são exibidas como badges/chips.

### 3. Atualizar `EncontroETEGRedesForm.tsx`

- Adicionar campo `turma_formacao` (array de strings) ao schema zod
- Buscar turmas disponíveis da tabela `professores` (mesmo padrão do Professor)
- Renderizar o componente multi-select na seção Identificação
- Salvar como `text[]` no insert

### 4. Atualizar `EncontroProfessorRedesForm.tsx`

- Alterar `turma_formacao` no schema de `z.string().optional()` para `z.array(z.string()).optional()`
- Substituir o Select simples pelo componente multi-select
- Salvar como `text[]` no insert

## Arquivos impactados

| Arquivo | Alteração |
|---|---|
| `supabase/migrations/*` | Adicionar coluna `turma_formacao text[]` no ETEG; converter `text` → `text[]` no Professor |
| `src/components/formularios/EncontroETEGRedesForm.tsx` | Adicionar campo turma_formacao multi-select |
| `src/components/formularios/EncontroProfessorRedesForm.tsx` | Converter turma_formacao para multi-select |

