

# Adicionar "Turma de Formação" nos Atores Educacionais e no Agendamento do Encontro Professor REDES

## Resumo

Criar o campo `turma_formacao` na tabela `professores` (Atores Educacionais) e usá-lo como filtro de participantes no agendamento do `encontro_professor_redes`. Quando o responsável agendar essa ação e informar a Turma de Formação, a lista de presença será pré-filtrada pelos atores que pertencem àquela turma.

## Alterações

### 1. Migration SQL

```sql
ALTER TABLE public.professores ADD COLUMN turma_formacao text;
ALTER TABLE public.programacoes ADD COLUMN turma_formacao text;
```

- `professores.turma_formacao`: texto livre, nullable -- identifica a turma de formação do ator
- `programacoes.turma_formacao`: texto livre, nullable -- armazena a turma selecionada ao agendar o encontro professor REDES, usada para filtrar presença

### 2. `src/pages/admin/ProfessoresPage.tsx` (Cadastro de Atores)

- Adicionar `turma_formacao` ao `formData` state (default: `''`)
- Adicionar campo `<input>` "Turma de Formação" no formulário (após Programas, antes de Usuário do Sistema)
- Incluir no `handleSubmit` (insert/update)
- Incluir na importação Excel (coluna "TurmaFormacao") e no template de exportação
- Adicionar `turma_formacao` à interface local `Professor`
- Incluir no `handleOpenDialog` (carregar valor ao editar)

### 3. `src/pages/admin/ProgramacaoPage.tsx` (Agendamento)

- No formulário de criação de programação: quando o tipo for `encontro_professor_redes`, exibir campo "Turma de Formação" (texto livre)
- Salvar `turma_formacao` na inserção/atualização da `programacoes`
- No formulário de edição, carregar e exibir o campo

### 4. `src/pages/aap/AAPRegistrarAcaoPage.tsx` (Registro / Lista de Presença)

- Ao montar `availableProfessors` para `encontro_professor_redes`: se a programação tiver `turma_formacao` preenchida, filtrar professores que tenham o mesmo `turma_formacao`
- Incluir `turma_formacao` no select de professores (`select('id, nome, ..., turma_formacao')`)

## Arquivos impactados

| Arquivo | Alteração |
|---|---|
| Migration SQL | ADD COLUMN em `professores` e `programacoes` |
| `src/pages/admin/ProfessoresPage.tsx` | Campo no formulário + import/export |
| `src/pages/admin/ProgramacaoPage.tsx` | Campo condicional no wizard de agendamento |
| `src/pages/aap/AAPRegistrarAcaoPage.tsx` | Filtro de presença por turma_formacao |

## Fluxo esperado

1. Admin cadastra atores educacionais com "Turma de Formação" (ex: "Turma A", "Turma B")
2. Ao agendar um "Encontro Formativo Professor – REDES", o responsável preenche "Turma de Formação" = "Turma A"
3. Na hora de registrar a ação e marcar presença, a lista mostra apenas os atores cuja `turma_formacao` = "Turma A"
4. Se o campo não for preenchido na programação, a lista de presença segue o comportamento atual (sem filtro adicional)

