

# Filtros adicionais na Programacao: Entidade, Formador, Consultor, Gestor de Parceria

## Resumo

Adicionar 4 novos filtros na pagina de Programacao (`/programacao`), com visibilidade condicionada ao nivel de permissao do usuario logado. Os filtros atuais (Programa e Tipo) serao mantidos.

## Novos filtros

| Filtro | Descricao | Quem ve |
|---|---|---|
| Entidade | Filtra por escola/entidade vinculada | N1 (todas), N2/N3 (entidades dos seus programas), N4.1/N4.2/N5 (suas entidades vinculadas) |
| Formador (N5) | Filtra acoes por responsavel com role `n5_formador` | N1, N2, N3, N4.1, N4.2 |
| Consultor (N4.1) | Filtra acoes por responsavel com role `n4_1_cped` | N1, N2, N3 |
| Gestor de Parceria (N4.2) | Filtra acoes por responsavel com role `n4_2_gpi` | N1, N2, N3 |

**Regra de visibilidade**: cada filtro aparece apenas para usuarios de nivel hierarquico superior ao do perfil filtrado. Ex: o filtro "Formador" nao aparece para o proprio N5, pois ele ja ve apenas suas acoes. O filtro "Consultor" nao aparece para N4.1/N4.2/N5, pois eles nao tem visao desses pares.

## Alteracoes

### Arquivo: `src/pages/admin/ProgramacaoPage.tsx`

#### 1. Novos estados de filtro (junto aos existentes ~linhas 125-126)

```typescript
const [entidadeFilter, setEntidadeFilter] = useState<string>('todos');
const [formadorFilter, setFormadorFilter] = useState<string>('todos');
const [consultorFilter, setConsultorFilter] = useState<string>('todos');
const [gpiFilter, setGpiFilter] = useState<string>('todos');
```

#### 2. Listas de opcoes para os novos filtros

Derivar dos dados ja carregados em `aaps` e `escolas`:

- **Entidades**: usar o array `escolas` ja carregado (ja filtrado por programa/entidade do usuario)
- **Formadores**: `aaps.filter(u => u.roles.includes('n5_formador'))`
- **Consultores**: `aaps.filter(u => u.roles.includes('n4_1_cped'))`
- **GPIs**: `aaps.filter(u => u.roles.includes('n4_2_gpi'))`

Para N2/N3, as listas de usuarios ja sao filtradas por programa na `fetchData`. Para N4/N5, a lista de formadores ja vem filtrada por entidade. Nao e necessario buscar dados adicionais.

#### 3. Aplicar filtros no `filteredProgramacoes` (useMemo ~linha 530)

Adicionar condicoes:

```typescript
// Filtro por entidade
if (entidadeFilter !== 'todos' && p.escola_id !== entidadeFilter) return false;

// Filtro por formador (N5)
if (formadorFilter !== 'todos' && p.aap_id !== formadorFilter) return false;

// Filtro por consultor (N4.1)
if (consultorFilter !== 'todos' && p.aap_id !== consultorFilter) return false;

// Filtro por GPI (N4.2)
if (gpiFilter !== 'todos' && p.aap_id !== gpiFilter) return false;
```

#### 4. Visibilidade dos filtros no JSX (~linha 2037)

Usar `profile?.role` e helpers de roleConfig para determinar visibilidade:

```text
const userLevel = getRoleLevel(profile?.role);

Entidade:      visivel para todos (N1-N5+) — ja escoped pelos dados carregados
Formador:      visivel se userLevel <= 4 (N1, N2, N3, N4.1, N4.2)
Consultor:     visivel se userLevel <= 3 (N1, N2, N3)
Gestor Parceria: visivel se userLevel <= 3 (N1, N2, N3)
```

#### 5. Renderizacao dos Selects

Adicionar apos o Select de "Tipo" existente:

- Select "Entidade" com `escolas` como opcoes (nome + codesc)
- Select "Formador" com usuarios N5 filtrados
- Select "Consultor" com usuarios N4.1 filtrados
- Select "Gestor de Parceria" com usuarios N4.2 filtrados

#### 6. Resetar filtros dependentes

Quando `programaFilter` mudar, resetar `entidadeFilter`, `formadorFilter`, `consultorFilter` e `gpiFilter` para `'todos'` — pois as opcoes podem mudar.

Adicionar ao `useEffect` existente de limpeza (~linha 401):

```typescript
useEffect(() => {
  setSelectedProgramacaoIds(new Set());
  setEntidadeFilter('todos');
  setFormadorFilter('todos');
  setConsultorFilter('todos');
  setGpiFilter('todos');
}, [programaFilter, tipoFilter, currentMonth]);
```

## Detalhes tecnicos

| Item | Detalhe |
|---|---|
| Arquivo | `src/pages/admin/ProgramacaoPage.tsx` |
| Import adicional | `getRoleLevel` de `@/config/roleConfig` |
| Migracao | Nenhuma |
| Novos dados | Nenhum — reutiliza `escolas` e `aaps` ja carregados |

Os filtros de Formador, Consultor e GPI filtram pelo campo `aap_id` da programacao, que corresponde ao responsavel pela acao. A filtragem de entidade usa `escola_id`.

