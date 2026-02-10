

## Plano: Ajustar rotulo do modal de Escola para Entidade

### Escopo
Alteracao exclusivamente visual (labels/titulos) no arquivo `src/pages/admin/EscolasPage.tsx`. Nenhuma tabela, coluna, rota ou logica sera modificada.

### Alteracoes

**Arquivo: `src/pages/admin/EscolasPage.tsx`**

1. Botao de criacao: trocar "Nova Escola" para "Nova Entidade"
2. Titulo do dialog: trocar `'Editar Escola'` para `'Editar Entidade'` e `'Nova Escola'` para `'Nova Entidade'`

### Detalhes tecnicos

Linha ~346: `Nova Escola` -> `Nova Entidade`
Linha ~352: `{editingEscola ? 'Editar Escola' : 'Nova Escola'}` -> `{editingEscola ? 'Editar Entidade' : 'Nova Entidade'}`

Nenhuma outra alteracao necessaria. Variaveis internas (`editingEscola`, `handleOpenDialog`, etc.) permanecem inalteradas.
