
# Adicionar opção "Não se aplica" nos campos Segmento, Componente e Ano/Série

## Contexto

Os campos **Segmento**, **Componente** e **Ano/Série** são obrigatórios no formulário de cadastro de Atores Educacionais. Porém, para cargos como Diretor, Vice-Diretor e Equipe Técnica (SME), esses campos não fazem sentido — esses atores não pertencem a um segmento ou componente específico.

## Diagnóstico técnico

Existem três camadas a corrigir:

**1. Banco de dados — CHECK constraints**
A tabela `professores` tem restrições que limitam os valores aceitos:
- `professores_segmento_check`: aceita apenas `anos_iniciais`, `anos_finais`, `ensino_medio`
- `professores_componente_check`: aceita apenas `polivalente`, `lingua_portuguesa`, `matematica`
- `ano_serie`: campo texto livre, mas sem valor padrão para "não aplicável"

Nenhum desses aceita um valor neutro como `nao_se_aplica`.

**2. Frontend — Formulário (`ProfessoresPage.tsx`)**
- Todos os três campos têm `required` no `<select>`
- Segmento e Componente não oferecem opção vazia/nula
- O `formData` inicializa `segmento` com `'anos_iniciais'` e `componente` com `'polivalente'` (pré-selecionados, sem opção de limpar)

**3. Tipos TypeScript (`src/types/index.ts`)**
- `Segmento` não inclui `'nao_se_aplica'`
- `ComponenteCurricular` não inclui `'nao_se_aplica'`

## Solução

### Migração SQL

Adicionar `'nao_se_aplica'` às constraints existentes:

```sql
-- Adicionar 'nao_se_aplica' às constraints de segmento e componente
ALTER TABLE public.professores DROP CONSTRAINT IF EXISTS professores_segmento_check;
ALTER TABLE public.professores ADD CONSTRAINT professores_segmento_check
  CHECK (segmento = ANY (ARRAY[
    'anos_iniciais', 'anos_finais', 'ensino_medio', 'nao_se_aplica'
  ]));

ALTER TABLE public.professores DROP CONSTRAINT IF EXISTS professores_componente_check;
ALTER TABLE public.professores ADD CONSTRAINT professores_componente_check
  CHECK (componente = ANY (ARRAY[
    'polivalente', 'lingua_portuguesa', 'matematica', 'nao_se_aplica'
  ]));
```

### Alterações em `src/types/index.ts`

Expandir os tipos:
```typescript
export type Segmento = 'anos_iniciais' | 'anos_finais' | 'ensino_medio' | 'nao_se_aplica';
export type ComponenteCurricular = 'polivalente' | 'lingua_portuguesa' | 'matematica' | 'nao_se_aplica';
```

### Alterações em `src/pages/admin/ProfessoresPage.tsx`

**1. Labels:** Adicionar `nao_se_aplica` nos mapas de display:
```typescript
const segmentoLabels: Record<string, string> = {
  anos_iniciais: 'Anos Iniciais',
  anos_finais: 'Anos Finais',
  ensino_medio: 'Ensino Médio',
  nao_se_aplica: 'Não se aplica',
};

const componenteLabels: Record<string, string> = {
  polivalente: 'Polivalente',
  lingua_portuguesa: 'Língua Portuguesa',
  matematica: 'Matemática',
  nao_se_aplica: 'Não se aplica',
};
```

**2. Estado inicial:** Alterar o valor padrão para `'nao_se_aplica'` em ambos os campos, e `ano_serie` permanece vazio:
```typescript
segmento: 'nao_se_aplica' as Segmento,
componente: 'nao_se_aplica' as ComponenteCurricular,
ano_serie: '',
```

**3. Formulário:** Remover o `required` dos três selects e adicionar a opção "Não se aplica" no início de cada lista:

Para **Segmento** — adicionar `nao_se_aplica` como primeira opção, remover `required`:
```tsx
<select value={formData.segmento} onChange={...} className="input-field">
  <option value="nao_se_aplica">Não se aplica</option>
  <option value="anos_iniciais">Anos Iniciais</option>
  <option value="anos_finais">Anos Finais</option>
  <option value="ensino_medio">Ensino Médio</option>
</select>
```

Para **Componente** — idem:
```tsx
<select value={formData.componente} onChange={...} className="input-field">
  <option value="nao_se_aplica">Não se aplica</option>
  <option value="polivalente">Polivalente</option>
  ...
</select>
```

Para **Ano/Série** — adicionar opção "Não se aplica" e remover `required`. Quando segmento for `nao_se_aplica`, mostrar apenas essa opção:
```tsx
<select value={formData.ano_serie} onChange={...} className="input-field">
  <option value="">Não se aplica</option>
  {formData.segmento !== 'nao_se_aplica' && 
    anoSerieOptions[formData.segmento]?.map(ano => (
      <option key={ano} value={ano}>{ano}</option>
    ))
  }
</select>
```

**4. Quando segmento muda para `nao_se_aplica`:** Resetar componente e ano/série também:
```typescript
onChange={(e) => setFormData({ 
  ...formData, 
  segmento: e.target.value as Segmento,
  componente: e.target.value === 'nao_se_aplica' ? 'nao_se_aplica' : formData.componente,
  ano_serie: ''
})}
```

**5. Labels na tabela e no import:** Atualizar `segmentoMap` e `componenteMap` no parse do import para aceitar `nao_se_aplica`:
```typescript
const segmentoMap = {
  ...existing,
  'nao_se_aplica': 'nao_se_aplica',
  'nao se aplica': 'nao_se_aplica',
  'n/a': 'nao_se_aplica',
};
```

**6. Modelo Excel:** Adicionar `nao_se_aplica` na aba "Valores Válidos" do template.

## Fluxo após a mudança

- Ao abrir o formulário de **Novo Ator**, os três campos iniciam em "Não se aplica"
- O usuário pode escolher um segmento específico (Anos Iniciais, etc.) e o formulário habilita as opções de Ano/Série correspondentes
- Ao escolher "Não se aplica" no segmento, componente e ano/série também ficam em "Não se aplica"
- Diretor, Vice-Diretor e Equipe Técnica SME podem ser cadastrados sem informar segmento/componente

## Arquivos alterados

| Arquivo | Alteração |
|---|---|
| Nova migration SQL | Expandir constraints de segmento e componente |
| `src/types/index.ts` | Adicionar `nao_se_aplica` nos tipos |
| `src/pages/admin/ProfessoresPage.tsx` | Labels, estado inicial, formulário, import map, modelo Excel |
