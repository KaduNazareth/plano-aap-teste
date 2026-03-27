

# Trocar campo "Turma de Formação" de texto livre para dropdown com opção "Todas"

## Resumo

Substituir os campos `<input type="text">` de Turma de Formação por `<Select>` dropdown em 3 locais, populado com as turmas distintas já cadastradas na tabela `professores`. Adicionar opção "Todas" no agendamento (ProgramacaoPage) e no formulário REDES.

## Alterações

### 1. `src/pages/admin/ProfessoresPage.tsx` (Cadastro de Atores)

- Buscar turmas distintas dos professores existentes: `SELECT DISTINCT turma_formacao FROM professores WHERE turma_formacao IS NOT NULL`
- Substituir o `<input>` (linha ~1223) por um `<Select>` com:
  - Opções vindas do banco (turmas existentes)
  - Opção "Outro" que permite digitar texto livre (ou manter `allowOther` via combo input)
  - **Alternativa mais simples**: usar um `<input>` com `<datalist>` para sugestões, mantendo a possibilidade de criar novas turmas
- Como este é o ponto de **criação** de turmas, manter a possibilidade de digitar valores novos (usar `<input>` + `<datalist>` ou combobox)

### 2. `src/pages/admin/ProgramacaoPage.tsx` (Agendamento)

- Buscar turmas distintas dos professores: query no `useEffect` ou `useMemo`
- Substituir o `<input>` (linha ~2046) por `<Select>` com:
  - Opção "Todas" (valor vazio ou `'todas'`) — não filtra presença
  - Lista de turmas existentes
- Ao salvar: se "Todas", gravar `null`; senão, gravar o valor selecionado

### 3. `src/components/formularios/EncontroProfessorRedesForm.tsx`

- Receber lista de turmas como prop ou buscar do banco
- Substituir o `<Input>` (linha ~134) por `<Select>` com as mesmas opções

### 4. `src/pages/aap/AAPRegistrarAcaoPage.tsx` (Filtro de presença)

- Ajustar lógica: se `turma_formacao` for `null` ou `'todas'`, não filtrar (já funciona assim com null)

## Arquivos impactados

| Arquivo | Alteração |
|---|---|
| `src/pages/admin/ProfessoresPage.tsx` | `<input>` → `<input>` + `<datalist>` (permite criar novas turmas) |
| `src/pages/admin/ProgramacaoPage.tsx` | `<input>` → `<Select>` com "Todas" + turmas do banco |
| `src/components/formularios/EncontroProfessorRedesForm.tsx` | `<Input>` → `<Select>` com turmas do banco |
| `src/pages/aap/AAPRegistrarAcaoPage.tsx` | Sem alteração (lógica já trata null como "sem filtro") |

