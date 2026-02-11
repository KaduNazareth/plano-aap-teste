
## Renomear "AAPs / Formadores" para "Consultor / Gestor / Formador"

Alteracao de nomenclatura em todos os pontos da aplicacao onde "AAP / Formador" ou "AAPs / Formadores" aparece como label visivel ao usuario.

### Arquivos e alteracoes

#### 1. Sidebar (`src/components/layout/Sidebar.tsx`)
- Linha 31: `'AAPs / Formadores'` → `'Consultor / Gestor / Formador'`
- Linha 51: `'AAPs / Formadores'` → `'Consultor / Gestor / Formador'`

#### 2. Pagina AAPsPage (`src/pages/admin/AAPsPage.tsx`)

| Linha | De | Para |
|-------|-----|------|
| 39 | `'AAP / Formador Anos Iniciais'` | `'Consultor / Gestor / Formador Anos Iniciais'` |
| 40 | `'AAP / Formador Lingua Portuguesa'` | `'Consultor / Gestor / Formador Lingua Portuguesa'` |
| 41 | `'AAP / Formador Matematica'` | `'Consultor / Gestor / Formador Matematica'` |
| 260 | header: `'AAP / Formador'` | `'Consultor / Gestor / Formador'` |
| 346 | titulo h1: `'AAPs / Formadores'` | `'Consultores / Gestores / Formadores'` |
| 347 | subtitulo: `'Gerencie os AAPs / Formadores do programa'` | `'Gerencie os Consultores / Gestores / Formadores do programa'` |
| 354 | botao: `'Novo AAP / Formador'` | `'Novo Consultor / Gestor / Formador'` |
| 360 | dialog: `'Editar AAP / Formador'` / `'Novo AAP / Formador'` | `'Editar Consultor / Gestor / Formador'` / `'Novo Consultor / Gestor / Formador'` |
| 510 | placeholder: `'Buscar AAPs / Formadores...'` | `'Buscar Consultores / Gestores / Formadores...'` |
| 520 | empty: `'Nenhum AAP / Formador cadastrado'` | `'Nenhum Consultor / Gestor / Formador cadastrado'` |
| Toasts (linhas 112, 119, 183, 187, 208, 212, 219, 236, 240, 244) | mensagens com "AAP" | Substituir por "Consultor / Gestor / Formador" ou forma abreviada adequada |
| 226 | confirm: `'...excluir este AAP?...'` | `'...excluir este consultor/gestor/formador?...'` |

#### 3. Dashboard (`src/pages/admin/AdminDashboard.tsx`)
- Linha 533: `'AAPs / Formadores'` → `'Consultores / Gestores / Formadores'`

#### 4. Manual do Usuario (`src/pages/admin/ManualUsuarioPage.tsx`)
- Linha 71: `'8. AAPs / Formadores'` → `'8. Consultores / Gestores / Formadores'`
- Linha 72-73: Atualizar descricao para usar nova nomenclatura

#### 5. Registros (`src/pages/admin/RegistrosPage.tsx`)
- Linha 850: header: `'AAP / Formador'` → `'Consultor / Gestor / Formador'`

#### 6. Relatorios (`src/pages/admin/RelatoriosPage.tsx`)
- Linhas 701, 768: `'Relatorio de Acompanhamento - AAPs/Formadores'` → `'Relatorio de Acompanhamento - Consultores/Gestores/Formadores'`

#### 7. Upload de Programacao (`src/components/forms/ProgramacaoUploadDialog.tsx`)
- Linha 165: erro: `'AAP/Formador nao encontrado'` → `'Consultor/Gestor/Formador nao encontrado'`
- Linha 161: comentario (opcional)

#### 8. Upload de Usuarios (`src/components/users/BatchUserUploadDialog.tsx`)
- Linha 190: erro: `'AAP / Formador ... deve ter um programa'` → `'Consultor / Gestor / Formador ... deve ter um programa'`

### Nota
- Variaveis internas, nomes de funcoes, tipos e chamadas de API (ex: `manage-aap-user`, `fetchAAPs`) permanecem inalterados para nao quebrar logica existente.
- A edge function `send-monthly-report` tambem contem "AAPs/Formadores" no template de email -- sera atualizada tambem.

### Resumo
- **8 arquivos frontend** + **1 edge function** editados
- Apenas labels/textos visiveis ao usuario sao alterados
- Nenhuma migracao de banco necessaria
