

# Sincronizar exclusão entre Registros de Ação e Calendário

## Problema

Ao excluir registros de ação na página "Registros de Ação", as programações vinculadas no Calendário continuam aparecendo. O sistema não mantém sincronização bidirecional entre as duas tabelas.

Atualmente:
- **Excluir registro**: apaga `registros_acao` + dependências, mas NÃO toca na `programacoes` vinculada
- **Excluir programação**: desvincula o registro (`programacao_id = null`) mas NÃO apaga o `registros_acao`

## Solução

Quando um `registro_acao` for excluído, verificar se há uma `programacao` vinculada (via `programacao_id`) e excluí-la também. Isso garante que o calendário reflita a exclusão.

### Arquivo: `src/pages/admin/RegistrosPage.tsx`

**Exclusão individual (`handleDeleteRegistro`)**:
- Após deletar dependências e antes/após deletar o registro, verificar se `registroToDelete.programacao_id` existe
- Se sim, deletar a programação correspondente da tabela `programacoes`

**Exclusão em lote (`handleBatchDelete`)**:
- Para cada registro sendo excluído, buscar o `programacao_id` do registro
- Se existir, deletar a programação vinculada

### Detalhes técnicos

```text
Fluxo atual:
  Delete presencas → Delete avaliacoes → Delete alteracoes → Delete registro

Fluxo novo:
  Delete presencas → Delete avaliacoes → Delete alteracoes → Delete registro
  → Se programacao_id existir → Delete programacao vinculada
```

Os dados de `programacao_id` já estão disponíveis no objeto `registroToDelete` (exclusão individual) e podem ser buscados antes da exclusão no batch.

Após exclusão, invalidar também a query de programações para refletir no calendário.

## Arquivo impactado

| Arquivo | Alteração |
|---|---|
| `src/pages/admin/RegistrosPage.tsx` | Adicionar exclusão da programação vinculada em `handleDeleteRegistro` e `handleBatchDelete` |

