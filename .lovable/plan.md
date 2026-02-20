
# Duas melhorias independentes

## Melhoria 1 — Novo segmento "Anos Finais/Ensino Médio" exclusivo para Atores de Programa

### Contexto

O segmento `anos_finais_ensino_medio` deve existir apenas nos formulários de cadastro/edição de atores de programa (N2–N5), não nos formulários de cadastro de professores/atores educacionais (onde os segmentos são distintos: `anos_finais` e `ensino_medio`).

### O que muda

**1. Migração SQL — atualizar a constraint em `profiles`**

A constraint `profiles_segmento_check` (se existir) precisa ser atualizada para permitir o novo valor. A migração:

```sql
-- Remover constraint antiga se existir
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_segmento_check;

-- Recriar com novo valor
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_segmento_check 
    CHECK (segmento IS NULL OR segmento = ANY (ARRAY[
      'anos_iniciais', 'anos_finais', 'ensino_medio', 
      'anos_finais_ensino_medio', 'nao_se_aplica'
    ]));
```

**2. `src/pages/admin/UsuariosPage.tsx` — adicionar option no renderSegmentoComponenteField**

O seletor de Segmento no formulário de criação/edição de usuários ganha a nova opção após "Anos Finais":

```tsx
<SelectItem value="anos_finais_ensino_medio">Anos Finais / Ensino Médio</SelectItem>
```

**3. `src/pages/admin/AtoresProgramaPage.tsx` — idem**

Mesmo SelectItem adicionado ao seletor de Segmento no dialog "Alterar papel".

**4. Label de exibição nas tabelas**

Ambas as tabelas já têm um mapa de labels para exibição das colunas Segmento. Adicionar a entrada:

```typescript
const segLabel: Record<string, string> = {
  anos_iniciais: 'Anos Iniciais',
  anos_finais: 'Anos Finais',
  ensino_medio: 'Ensino Médio',
  anos_finais_ensino_medio: 'Anos Finais/EM',  // ← novo
  nao_se_aplica: 'N/A',
};
```

O segmento **não aparece** em nenhum formulário de cadastro de professores/atores educacionais (tabela `professores`), pois esses formulários têm seus próprios selects independentes baseados em `segmentoLabels` do `mockData.ts`, que não precisam ser alterados.

---

## Melhoria 2 — Filtro de Tipo de Ator na lista de presença de Formação

### Contexto

Quando uma Formação é marcada como realizada, o sistema busca professores da escola filtrando por escola, componente, segmento e ano/série. O pedido é adicionar um filtro por cargo do ator participante: **Todos, Professor, Coordenador, Diretor, Vice-Diretor**.

O campo `cargo` já existe na tabela `professores` com os valores: `professor`, `coordenador`, `vice_diretor`, `diretor`, `equipe_tecnica_sme`.

### O que muda

**1. `src/pages/admin/ProgramacaoPage.tsx` — campo `tipoAtorPresenca` no formulário de criação**

Adicionar um novo campo ao `formData` chamado `tipoAtorPresenca` (default `'todos'`):

```typescript
tipoAtorPresenca: 'todos' as string,
```

E um novo seletor no formulário de criação de programação, visível apenas quando o tipo for `'formacao'`:

```tsx
{formData.tipo === 'formacao' && (
  <div>
    <label className="form-label">Tipo de Ator Participante</label>
    <select
      value={formData.tipoAtorPresenca}
      onChange={(e) => setFormData({ ...formData, tipoAtorPresenca: e.target.value })}
      className="input-field"
    >
      <option value="todos">Todos</option>
      <option value="professor">Professor</option>
      <option value="coordenador">Coordenador</option>
      <option value="diretor">Diretor</option>
      <option value="vice_diretor">Vice-Diretor</option>
    </select>
  </div>
)}
```

**2. Persistir `tipoAtorPresenca` na tabela `programacoes`**

A tabela `programacoes` já possui um campo `tags` (ARRAY). Para não precisar de migration, o `tipoAtorPresenca` será salvo como uma tag especial (ex: `cargo:professor`) no array `tags`. Alternativamente, adicionar uma coluna `tipo_ator_presenca text DEFAULT 'todos'` via migration.

**Decisão**: migration é mais limpa e explícita — adicionar coluna `tipo_ator_presenca text DEFAULT 'todos'` na tabela `programacoes`:

```sql
ALTER TABLE public.programacoes
  ADD COLUMN IF NOT EXISTS tipo_ator_presenca text DEFAULT 'todos';
```

E na interface `ProgramacaoDB`:

```typescript
tipo_ator_presenca: string | null;
```

**3. Salvar o campo ao criar/editar a programação**

No handler de criação da programação, incluir `tipo_ator_presenca: formData.tipoAtorPresenca || 'todos'` no objeto enviado ao Supabase.

**4. Usar o filtro ao buscar professores para a lista de presença**

Na lógica que carrega `professoresPresenca` (linha ~797–841 de `ProgramacaoPage.tsx`), após os filtros de escola/componente/segmento/ano_serie, adicionar:

```typescript
if (selectedProgramacao.tipo_ator_presenca && selectedProgramacao.tipo_ator_presenca !== 'todos') {
  query = query.eq('cargo', selectedProgramacao.tipo_ator_presenca);
}
```

**5. Aplicar o mesmo filtro em `AAPRegistrarAcaoPage.tsx`**

Esse arquivo tem lógica análoga de carregamento de professores para presença. Adicionar o mesmo filtro por `cargo` baseado em `selectedProgramacao.tipo_ator_presenca`.

---

## Resumo dos arquivos alterados

| Arquivo | Alteração |
|---|---|
| Nova migration SQL | Atualizar constraint `profiles_segmento_check` + coluna `tipo_ator_presenca` em `programacoes` |
| `src/pages/admin/UsuariosPage.tsx` | Adicionar opção "Anos Finais / Ensino Médio" e label no mapa de exibição |
| `src/pages/admin/AtoresProgramaPage.tsx` | Idem |
| `src/pages/admin/ProgramacaoPage.tsx` | Campo `tipoAtorPresenca` no form, seletor na UI de criação, filtro na query de presença |
| `src/pages/aap/AAPRegistrarAcaoPage.tsx` | Filtro por `cargo` na query de presença baseado em `tipo_ator_presenca` da programação |
