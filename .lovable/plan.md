

# Adicionar campo "Tags" sincronizado com "Tag do Projeto" do Notion

## Resumo

Adicionar um campo `tags` (array de texto) nas tabelas `programacoes` e `registros_acao`, exibi-lo nos formularios de criacao/edicao de acoes, e sincronizar com o campo "Tag do Projeto" do Notion em ambas as direcoes.

---

## 1. Migracao SQL

Adicionar coluna `tags` em ambas as tabelas:

- `programacoes`: coluna `tags` tipo `text[]`, nullable, default `NULL`
- `registros_acao`: coluna `tags` tipo `text[]`, nullable, default `NULL`

## 2. Sincronizacao Notion para Lovable

### Arquivo: `supabase/functions/notion-sync/index.ts`

- Extrair o campo "Tag do Projeto" da pagina do Notion (provavelmente `select` ou `multi_select`)
- Se for `select`: extrair o valor unico como array de 1 elemento
- Se for `multi_select`: extrair todos os valores como array
- Incluir o valor no `commonData` como `tags`
- O campo sera salvo tanto em `programacoes` quanto em `registros_acao`

Trecho a adicionar na extracao de propriedades:
```text
const tagDoProjetoNotion = props['Tag do Projeto'];
let tags: string[] = [];
if (tagDoProjetoNotion?.type === 'multi_select') {
  tags = tagDoProjetoNotion.multi_select?.map(t => t.name) || [];
} else if (tagDoProjetoNotion?.type === 'select' && tagDoProjetoNotion.select) {
  tags = [tagDoProjetoNotion.select.name];
}
```

Incluir `tags` no objeto `commonData`.

## 3. Sincronizacao Lovable para Notion

### Arquivo: `supabase/functions/notion-create-page/index.ts` (nova funcao, do plano anterior)

Ao criar a pagina no Notion, mapear o campo `tags` do sistema para a propriedade "Tag do Projeto" no Notion:
- Se o campo "Tag do Projeto" for `multi_select`: enviar todos os valores
- Se for `select`: enviar o primeiro valor do array

## 4. Frontend - Formulario de criacao

### Arquivo: `src/pages/admin/ProgramacaoPage.tsx`

- Adicionar campo `tags` ao estado `formData` (tipo `string[]`, default `[]`)
- Adicionar input no formulario de criacao para inserir tags (campo de texto com separacao por virgula, ou input de chips)
- Incluir `tags` no insert do banco ao criar programacao
- Exibir tags na visualizacao da programacao (badges/chips)

### Arquivo: `src/pages/aap/AAPRegistrarAcaoPage.tsx`

- Propagar as tags da programacao para o registro de acao ao registrar
- Exibir tags na visualizacao

## 5. Interfaces TypeScript

### Arquivo: `src/types/index.ts`

- Adicionar `tags?: string[]` na interface `Programacao`
- Adicionar `tags?: string[]` na interface `RegistroAcao`

### Interfaces locais em `ProgramacaoPage.tsx` e `AAPRegistrarAcaoPage.tsx`

- Adicionar `tags: string[] | null` no `ProgramacaoDB`

---

## Arquivos modificados

| Arquivo | Acao |
|---|---|
| Migracao SQL | Adicionar coluna `tags` em `programacoes` e `registros_acao` |
| `supabase/functions/notion-sync/index.ts` | Extrair "Tag do Projeto" e incluir em `commonData.tags` |
| `supabase/functions/notion-create-page/index.ts` | Mapear `tags` para "Tag do Projeto" no Notion (parte do plano anterior) |
| `src/pages/admin/ProgramacaoPage.tsx` | Adicionar campo tags no formulario e na visualizacao |
| `src/pages/aap/AAPRegistrarAcaoPage.tsx` | Exibir tags e propagar para registro |
| `src/types/index.ts` | Adicionar campo `tags` nas interfaces |
