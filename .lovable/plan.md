

# Correção da Integração Notion - Mapeamento de Campos

## Problema Identificado

A Edge Function `notion-sync` está com mapeamentos incorretos de tipos de campo:

| Campo Notion | Tipo Real | Tipo na Funcao Atual | Correção |
|---|---|---|---|
| Projeto | relation | select | Ler como relation e buscar titulo via API |
| Etiquetas | select | multi_select | Ler como select |

Alem disso, o projeto padrao "Acompanhamento Pedagogico" precisa ser incluido no mapeamento.

---

## Alterações

### Arquivo: `supabase/functions/notion-sync/index.ts`

1. **Adicionar funcao para resolver relation do Projeto**
   - Criar funcao `resolveRelationTitle()` que recebe o ID da pagina relacionada e busca seu titulo via API do Notion (`/v1/pages/{id}`)
   - Cachear resultados para evitar chamadas repetidas durante a mesma execucao

2. **Corrigir leitura do campo Etiquetas**
   - Mudar de `extractMultiSelectFromProperty` para `extractSelectFromProperty`
   - Ajustar o mapeamento de tipo de acao para funcionar com valor unico (select) em vez de array (multi_select)

3. **Atualizar mapeamento de programa**
   - Adicionar "Acompanhamento Pedagogico" mapeado para `'escolas'` na tabela `programaMapping`

4. **Corrigir o fluxo de mapeamento de tipo**
   - Como Etiquetas e um select (valor unico), verificar diretamente no `tipoMapping` em vez de iterar array

---

## Detalhes Tecnicos

### Nova funcao para resolver relacoes

```text
async function resolveRelationTitle(notionApiKey, pageId, cache):
  - Se pageId ja esta no cache, retornar valor cacheado
  - Fazer GET para /v1/pages/{pageId} com headers de autorizacao
  - Extrair titulo da resposta
  - Salvar no cache e retornar
```

### Mapeamento atualizado de programa

| Nome do Projeto no Notion | Valor no Sistema |
|---|---|
| Acompanhamento Pedagogico | escolas |
| Escolas | escolas |
| Regionais | regionais |
| Redes Municipais | redes_municipais |

### Fluxo corrigido de sincronizacao

```text
1. Ler campo Projeto (relation) -> resolver ID para titulo via API
2. Ler campo Etiquetas (select) -> valor unico
3. Mapear titulo do Projeto para programa do sistema
4. Mapear valor de Etiquetas para tipo de acao
5. Continuar fluxo existente
```

---

## Arquivos Modificados

| Arquivo | Acao |
|---|---|
| `supabase/functions/notion-sync/index.ts` | MODIFICAR |

