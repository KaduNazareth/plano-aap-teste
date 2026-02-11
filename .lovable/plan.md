

## Renomear "Professores / Coordenadores" para "Atores Educacionais" e adicionar novos cargos

### Alteracoes

#### 1. Sidebar (`src/components/layout/Sidebar.tsx`)

Renomear todas as 4 ocorrencias de `Professores / Coordenadores` para `Atores Educacionais` (linhas 30, 50, 69, 90).

#### 2. Tipo TypeScript (`src/types/index.ts`)

Expandir o tipo `CargoProfessor` para incluir os novos cargos:

```text
De:  'professor' | 'coordenador'
Para: 'professor' | 'coordenador' | 'vice_diretor' | 'diretor' | 'equipe_tecnica_sme'
```

#### 3. Pagina de Atores (`src/pages/admin/ProfessoresPage.tsx`)

| Local | De | Para |
|-------|-----|------|
| `cargoLabels` (linha 71-73) | 2 entradas | Adicionar: `vice_diretor: 'Vice-Diretor'`, `diretor: 'Diretor'`, `equipe_tecnica_sme: 'Equipe Tecnica (SME)'` |
| `cargoMap` (linha 338-340) | 2 entradas | Adicionar mapeamentos para importacao: `'vice-diretor'`, `'diretor'`, `'equipe tecnica'`, `'equipe_tecnica_sme'` |
| Titulo do dialogo de importacao (linha 719) | `Importar Professores / Coordenadores` | `Importar Atores Educacionais` |
| Template de exportacao (linha 502) | Cargo: `'professor'` | Sem alteracao (template mostra apenas exemplo) |

#### 4. Manual do Usuario (`src/pages/admin/ManualUsuarioPage.tsx`)

Renomear `7. Professores / Coordenadores` para `7. Atores Educacionais` (linha 64).

### Nota sobre o banco de dados

A coluna `cargo` na tabela `professores` e do tipo `text` (sem restricao de enum). Os novos valores serao aceitos sem necessidade de migracao.

### Resumo

- **5 arquivos** editados
- **0 migracoes** necessarias
- Novos cargos ficam disponiveis imediatamente no seletor do formulario e na importacao em lote
