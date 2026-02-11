
## Restaurar "Formação" como tipo de ação independente

Atualmente, o tipo `formacao` foi mapeado para `acompanhamento_formacoes` na função `normalizeAcaoTipo`, fazendo com que ele desapareça como opção. Dados existentes no banco já usam `formacao`. Precisamos restaurá-lo como tipo separado.

### Alterações

#### 1. Registrar `formacao` como tipo de ação (`src/config/acaoPermissions.ts`)

- Adicionar `'formacao'` ao union type `AcaoTipo`
- Adicionar `'formacao'` ao array `ACAO_TIPOS`
- Adicionar entrada em `ACAO_TYPE_INFO` com label `'Formação'` e ícone `GraduationCap`
- Adicionar entrada em `ACAO_PERMISSION_MATRIX` com as mesmas permissões que `lista_presenca` (Admin, Gerente, Coord Prog, CPed, GPI, Formador)
- **Remover** a linha `if (tipo === 'formacao') return 'acompanhamento_formacoes'` de `normalizeAcaoTipo` para que `formacao` não seja mais convertido

#### 2. Tratar "Formação" como tipo de formação no formulário (`src/pages/admin/ProgramacaoPage.tsx`)

- Nas verificações `isFormacao` (linhas 433, 574, 1341), adicionar `'formacao'` à lista de tipos que permitem "Todos" em segmento/ano_serie e que abrem o diálogo de presença

#### 3. Sem migração de banco necessária

A coluna `tipo` em `programacoes` e `registros_acao` é `text`, sem restrição de enum. O valor `'formacao'` já existe no banco de dados.

### Resumo

- **1 arquivo principal** editado (`acaoPermissions.ts`) para registrar o tipo
- **1 arquivo** ajustado (`ProgramacaoPage.tsx`) para incluir `formacao` nas verificações de tipo formação
- O tipo "Formação" volta a aparecer no seletor de criação de ações para os perfis autorizados
