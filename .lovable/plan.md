

# Criar Tabela Entidades Filho e Interface de Gestão (N1)

## Análise dos Campos

Os campos propostos fazem sentido. Uma sugestão: além dos 3 campos informados, adicionar `ativa` (boolean) para permitir desativar sem perder histórico, seguindo o mesmo padrão da tabela `escolas`.

O relacionamento via CODESC (texto) ao invés de FK por UUID é viável, mas tem um risco: se o CODESC do pai for alterado, o vínculo quebra. Sugiro usar uma FK para `escolas.id` internamente e exibir o CODESC apenas na interface como campo de busca/lookup. Assim o usuário digita o CODESC, o sistema resolve para o `escola_id` correto.

## Alterações

### 1. Migration SQL — nova tabela `entidades_filho`
```sql
CREATE TABLE public.entidades_filho (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id uuid NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
  codesc_filho text NOT NULL,
  nome text NOT NULL,
  ativa boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.entidades_filho ENABLE ROW LEVEL SECURITY;

-- Somente N1 (admin) gerencia
CREATE POLICY "N1 Admins manage entidades_filho"
  ON public.entidades_filho FOR ALL TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Leitura para autenticados (necessário para os relatórios futuros)
CREATE POLICY "Authenticated users can view entidades_filho"
  ON public.entidades_filho FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
```

### 2. Nova página `src/pages/admin/EntidadesFilhoPage.tsx`
- Tabela listando entidades filho com colunas: CODESC Pai, Nome Pai, CODESC Filho, Nome Filho, Status
- Filtro por busca (texto) e toggle mostrar inativos
- Dialog de criação/edição com campos:
  - **CODESC Pai**: input texto — ao digitar, busca na tabela `escolas` por codesc e exibe o nome como confirmação
  - **CODESC Filho**: input texto
  - **Nome da Entidade Filho**: input texto
  - **Ativa**: switch (default true)
- Botão de excluir com confirmação
- Acesso restrito a `isAdmin`

### 3. Rota em `src/App.tsx`
- Adicionar rota `/entidades-filho` apontando para `EntidadesFilhoPage`

### 4. Menu no `src/components/layout/Sidebar.tsx`
- Adicionar item "Entidades Filho" apenas no `adminMenuItems` (N1)

### 5. Rota protegida em `src/components/layout/AppLayout.tsx`
- Adicionar `/entidades-filho` nas rotas permitidas para o tier admin

## Resumo de arquivos
| Arquivo | Alteração |
|---|---|
| Migration SQL | Criar tabela `entidades_filho` com RLS |
| `src/pages/admin/EntidadesFilhoPage.tsx` | Nova página de gestão |
| `src/App.tsx` | Adicionar rota |
| `src/components/layout/Sidebar.tsx` | Adicionar item no menu admin |
| `src/components/layout/AppLayout.tsx` | Permitir rota para admin |

