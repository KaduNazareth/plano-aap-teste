
# Adicionar Segmento e Componente opcionais para Atores de Programa

## Contexto

Os campos Segmento (Anos Iniciais, Anos Finais, Ensino Médio, Não se aplica) e Componente (Polivalente, Língua Portuguesa, Matemática, Não se aplica) já existem na tabela `professores` (atores educacionais locais). O pedido é torná-los disponíveis também para os usuários de programa — Consultores (N4), Gestores (N2/N3), Formadores (N5) etc.

Esses campos não existem na tabela `profiles` nem em nenhuma tabela de vínculos de usuários de programa, então são necessárias:
1. Uma migração para adicionar as colunas na tabela `profiles`
2. Atualização dos dois formulários de gestão

## Decisões de design

- **Opcionais**: campos nullable, sem validação obrigatória
- **Ambos os locais**: aparecem em `/usuarios` (Gestão de Usuários) e `/atores` (Atores dos Programas)
- **Mesmos valores** já usados no sistema: `anos_iniciais`, `anos_finais`, `ensino_medio`, `nao_se_aplica` para Segmento; `polivalente`, `lingua_portuguesa`, `matematica`, `nao_se_aplica` para Componente
- **Exibição na tabela**: colunas adicionais mostrando os valores ou "—" quando não preenchidos

## Migração SQL

Adicionar duas colunas opcionais na tabela `profiles`:

```sql
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS segmento text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS componente text DEFAULT NULL;

-- Constraint para valores válidos (com NULL permitido)
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_segmento_check 
    CHECK (segmento IS NULL OR segmento = ANY (ARRAY[
      'anos_iniciais', 'anos_finais', 'ensino_medio', 'nao_se_aplica'
    ]));

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_componente_check 
    CHECK (componente IS NULL OR componente = ANY (ARRAY[
      'polivalente', 'lingua_portuguesa', 'matematica', 'nao_se_aplica'
    ]));
```

## Alterações no frontend

### 1. `src/contexts/AuthContext.tsx`

Adicionar `segmento` e `componente` à interface `UserProfile`:

```typescript
export interface UserProfile {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  role: AppRole;
  programas?: ProgramaType[];
  entidadeIds?: string[];
  mustChangePassword?: boolean;
  segmento?: string | null;
  componente?: string | null;
}
```

E no `fetchProfile` incluir os campos no select e no objeto retornado.

### 2. `src/pages/admin/UsuariosPage.tsx`

**Interface `UserWithRole`** — adicionar:
```typescript
segmento: string | null;
componente: string | null;
```

**`formData`** — adicionar:
```typescript
segmento: '' as string,
componente: '' as string,
```

**`fetchUsers`** — o select de `profiles` já usa `'*'`, então os novos campos são retornados automaticamente. Mapear para o objeto.

**`resetForm`** — incluir `segmento: '', componente: ''`.

**`openDialog`** — popular os campos ao editar.

**`handleCreateUser` / `handleUpdateUser`** — passar `segmento` e `componente` para a edge function `manage-users`. A edge function precisará ser atualizada para aceitar e salvar esses campos.

**`renderSegmentoComponenteField()`** — novo bloco de UI para os dois selects:

```tsx
const renderSegmentoComponenteField = () => (
  <div className="grid grid-cols-2 gap-3">
    <div>
      <Label>Segmento</Label>
      <Select
        value={formData.segmento || 'nao_informado'}
        onValueChange={(v) => setFormData({ ...formData, segmento: v === 'nao_informado' ? '' : v })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Selecione..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="nao_informado">Não informado</SelectItem>
          <SelectItem value="anos_iniciais">Anos Iniciais</SelectItem>
          <SelectItem value="anos_finais">Anos Finais</SelectItem>
          <SelectItem value="ensino_medio">Ensino Médio</SelectItem>
          <SelectItem value="nao_se_aplica">Não se aplica</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div>
      <Label>Componente</Label>
      <Select
        value={formData.componente || 'nao_informado'}
        onValueChange={(v) => setFormData({ ...formData, componente: v === 'nao_informado' ? '' : v })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Selecione..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="nao_informado">Não informado</SelectItem>
          <SelectItem value="polivalente">Polivalente</SelectItem>
          <SelectItem value="lingua_portuguesa">Língua Portuguesa</SelectItem>
          <SelectItem value="matematica">Matemática</SelectItem>
          <SelectItem value="nao_se_aplica">Não se aplica</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
);
```

**Formulários de criação e edição** — adicionar `{renderSegmentoComponenteField()}` antes dos botões de ação.

**Colunas da tabela** — adicionar coluna "Segmento / Componente" exibindo os valores ou `—`.

### 3. `src/pages/admin/AtoresProgramaPage.tsx`

**Interface `ActorUser`** — adicionar:
```typescript
segmento: string | null;
componente: string | null;
```

**`formData`** — adicionar `segmento: '', componente: ''`.

**`fetchData`** — adicionar `segmento, componente` ao select de `profiles`.

**`openDialog`** — popular os campos ao editar.

**`handleSaveRole`** — salvar `segmento` e `componente` diretamente na tabela `profiles` via `supabase.from('profiles').update(...)`.

**UI do dialog "Alterar papel"** — adicionar `renderSegmentoComponenteField()` (componente compartilhado ou duplicado).

**Colunas da tabela** — adicionar coluna "Segmento / Componente".

### 4. `supabase/functions/manage-users/index.ts`

Adicionar `segmento` e `componente` aos parâmetros aceitos nas ações `create` e `update`, salvando-os no `profiles` via `supabase.from('profiles').update(...)` após criar/atualizar o usuário.

## Resumo dos arquivos alterados

| Arquivo | Alteração |
|---|---|
| Nova migration SQL | Adicionar `segmento` e `componente` nullable em `profiles` |
| `src/contexts/AuthContext.tsx` | Adicionar campos à interface `UserProfile` e ao fetch |
| `src/pages/admin/UsuariosPage.tsx` | Interface, formData, form UI, colunas, handlers create/update |
| `src/pages/admin/AtoresProgramaPage.tsx` | Interface, formData, form UI, colunas, handler save |
| `supabase/functions/manage-users/index.ts` | Suporte a `segmento` e `componente` nas ações create/update |
