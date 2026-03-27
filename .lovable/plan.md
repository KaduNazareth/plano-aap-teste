

# Adicionar campo "Turma de Formação" no Encontro Formativo Professor – REDES

## Resumo
Incluir um campo de texto livre "Turma de Formação" no formulário `EncontroProfessorRedesForm`, na seção de Identificação. O campo será salvo na tabela `relatorios_professor_redes`.

## Alterações

### 1. Migration SQL
Adicionar coluna `turma_formacao` (text, nullable) na tabela `relatorios_professor_redes`.

```sql
ALTER TABLE public.relatorios_professor_redes ADD COLUMN turma_formacao text;
```

### 2. `src/components/formularios/EncontroProfessorRedesForm.tsx`
- Adicionar `turma_formacao` ao schema Zod (string, opcional ou obrigatório — presumo opcional)
- Adicionar default value no `useForm`
- Adicionar campo `<Input>` na seção "Identificação" (ao lado dos campos existentes como Formador e Turma/Ano)

## Arquivos impactados
| Arquivo | Alteração |
|---|---|
| Migration SQL | `ALTER TABLE relatorios_professor_redes ADD COLUMN turma_formacao text` |
| `src/components/formularios/EncontroProfessorRedesForm.tsx` | Novo campo no schema + formulário |

