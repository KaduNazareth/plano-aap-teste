

# Implementacao dos Instrumentos Pedagogicos (Formularios por Evento/Acao)

## Resumo

Implementar 10 formularios pedagogicos estruturados conforme o documento "Instrumentos Pedagogicos", cada um com seus proprios campos, escalas e dimensoes. O sistema atual suporta apenas Observacao de Aula (com 5 dimensoes hardcoded). A solucao proposta cria uma arquitetura generica e data-driven para todos os tipos de formulario.

## Arquitetura Proposta

A abordagem central e uma **tabela de definicao de instrumentos** (`instrument_fields`) que descreve todos os campos de cada formulario, incluindo escalas, rubricas e agrupamento por dimensoes. O frontend le essa tabela e renderiza dinamicamente o formulario correto para cada tipo de acao.

### Modelo de Dados

**Nova tabela: `instrument_fields`** (definicao dos campos de cada instrumento)

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid PK | |
| form_type | text | Tipo de acao (ex: `observacao_aula`, `devolutiva_pedagogica`) |
| field_key | text | Identificador unico do campo dentro do form_type |
| label | text | Titulo/pergunta exibida |
| description | text (nullable) | Texto de foco/contexto abaixo do titulo |
| field_type | text | `rating`, `text`, `select_one` |
| scale_min | int | Valor minimo da escala (ex: 0 ou 1) |
| scale_max | int | Valor maximo da escala (ex: 3, 4 ou 5) |
| scale_labels | jsonb | Labels da escala: `[{"value":1,"label":"Inicial","description":"..."}, ...]` |
| dimension | text (nullable) | Agrupamento visual (ex: "Antes da ATPC", "Durante a ATPC") |
| sort_order | int | Ordem de exibicao |
| is_required | boolean | Se e obrigatorio por padrao |
| metadata | jsonb (nullable) | Dados extras (ex: opcoes de selecao multipla) |

**Nova tabela: `instrument_responses`** (respostas dos formularios)

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid PK | |
| registro_acao_id | uuid FK | Vinculo ao registro_acao |
| professor_id | uuid FK (nullable) | Quando aplicavel (Obs. Aula, Devolutiva) |
| escola_id | uuid | |
| aap_id | uuid | Quem preencheu |
| form_type | text | Tipo do instrumento |
| responses | jsonb | `{"field_key": value, ...}` com todos os campos preenchidos |
| questoes_selecionadas | jsonb (nullable) | Pre-selecao (para Obs. Aula) |
| created_at | timestamptz | |

**Manter `avaliacoes_aula`** para retrocompatibilidade com dados existentes. Novos registros de Observacao de Aula tambem gravam em `instrument_responses`.

### RLS para novas tabelas

- `instrument_fields`: SELECT para autenticados (todos precisam ler a definicao)
- `instrument_responses`: mesmas regras de `avaliacoes_aula` — admin ALL, gestor/N3 via programa, N4/N5 via entidade/proprio, N6/N7 via entidade, N8 via programa

## Formularios Extraidos do Documento

### 1. Observacao de Aula (`observacao_aula`)
- **Escala**: 1-4 (Elementar, Basico, Atingiu, Superou) — 12 perguntas com rubricas descritivas longas
- **Campos extras**: Material Didatico (selecao), Qtd Alunos M/F (numero), Observador (texto)
- **Textos**: Pontos Fortes, Aspectos a Fortalecer, Estrategias Sugeridas, Combinacao Futura
- **Comportamento especial**: Pre-selecao de questoes (ja implementado parcialmente)
- **Perguntas com `*`**: obrigatorias

### 2. Devolutiva Pedagogica (`devolutiva_pedagogica`)
- **Escala**: 1-4 (Inicial, Em desenvolvimento, Consolidado, Avancado)
- **Criterios** (7): Retomada do objetivo, Reconhecimento pontos fortes, Analise dificuldades, Definicao focos, Sugestao estrategias, Combinacao proximos passos, Principais avancos

### 3. Qualidade das ATPCs (`qualidade_atpcs`)
- **Escala**: 1-4 (Inicial, Em desenvolvimento, Consolidado, Avancado)
- **Criterios** (5): Planejamento objetivos, Conteudo formativo, Metodologia participativa, Uso pedagogico dados, Encaminhamentos praticos
- **Texto**: Observacoes

### 4. Observacao Uso Pedagogico de Dados (`obs_uso_dados`)
- **Escala**: 1-4 por criterio
- **Dimensoes**: Antes da ATPC (3 criterios), Durante a ATPC (3 criterios), Apos a ATPC (3 criterios)
- Total: 9 criterios agrupados em 3 dimensoes

### 5. Autoavaliacao (`autoavaliacao`)
- **Escala**: 1-3 (Pouco consistente, Em consolidacao, Consistente)
- **Criterios** (5): Planejo ATPCs, Conducao discussoes, Acompanho estrategias, Articulo formacao, Sustento rotinas
- **Texto**: Comentarios

### 6. Qualidade da Implementacao (`qualidade_implementacao`)
- **Escala**: 1-4 (Inicial, Em desenvolvimento, Adequado, Consistente)
- **Criterios** (5): Acoes previstas, APFs frequencia, Coerencia desenho/pratica, Cronograma cumprido, Entregas cumpridas
- **Textos**: Evidencias observadas, Encaminhamentos

### 7. Engajamento e Solidez da Parceria (`obs_engajamento_solidez` — reuso do tipo existente)
- **Escala**: 1-4 (Fragil, Em construcao, Ativa, Consolidada)
- **Criterios** (5): Clareza papel PE, Clareza papel consultor, Participacao gestao, Abertura acompanhamento, Estabilidade parceria
- **Texto**: Evidencias

### 8. Observacao Engajamento e Solidez (`obs_engajamento_solidez` como subtipo ou tipo separado)
- **Escala**: 1-4 (Fragil, Em desenvolvimento, Adequada, Consistente) — 1 criterio "Situacao Geral da Implementacao"
- **Textos**: Fraquezas, Forcas, Principais Avancos, Principais Riscos, Recomendacoes Estrategicas

### 9. Sustentabilidade e Aprendizado do Programa (`sustentabilidade_programa`)
- **Escala**: 1-4 (Inicial, Em transicao, Sustentavel, Consolidado)
- **Criterios** (6): Autonomia escola, Reducao dependencia, Aprendizados sistematizados, Mudanca pratica docentes, Acompanhamento resultados, Melhoria aprendizagem
- **Texto**: Sintese Avaliativa

### 10. Qualidade do Acompanhamento de Aula — Coordenador (`qualidade_acomp_aula`)
- **Escala**: 0-4 (Nao Atende, Inicial, Em Desenvolvimento, Proficiente, Excelencia) — com rubricas longas
- **Criterios** (12): Planejamento/Organizacao, Comunicacao, Formacao Continuada, Analise Problemas, Colaboracao Lideranca, Materiais, Gestao Tempo, Abertura Aprendizagem, Uso Dados, Observacao Aula/Feedback, Articulacao Interfuncional, Intervencao Pedagogica

### 11. Formulario Avaliacao Participante (`avaliacao_formacao_participante`)
- **Escala**: 1-5 (Discordo Totalmente a Concordo Totalmente) — 4 perguntas
- **Selecao multipla**: Expectativa em relacao a tematica (5 opcoes)
- **Textos**: Pontos Positivos, Pontos de Melhoria, Comentarios/Sugestoes

## Etapas de Implementacao

### Fase 1 — Banco de Dados

1. Criar tabela `instrument_fields` com seed de todos os campos de todos os 11 formularios extraidos do documento
2. Criar tabela `instrument_responses` para armazenar respostas
3. Aplicar RLS em ambas as tabelas
4. Criar trigger de validacao em `instrument_responses` que verifica:
   - Campos obrigatorios preenchidos
   - Valores dentro da escala definida
   - Minimo de questoes opcionais (quando aplicavel, ex: observacao_aula)

### Fase 2 — Hooks e Componentes Genericos

1. **`useInstrumentFields(formType)`** — hook que busca a definicao dos campos do instrumento
2. **`useInstrumentResponses(registroAcaoId)`** — hook para ler/salvar respostas
3. **`InstrumentForm`** — componente generico que renderiza:
   - Agrupamento por `dimension` (blocos colapsaveis)
   - Campos de rating com escala dinamica e labels
   - Rubricas descritivas em accordion/tooltip colapsavel
   - Campos de texto livre
   - Campos de selecao (radio/checkbox)
4. **`RatingScale`** — componente de escala reutilizavel que exibe os botoes de nota com labels e suporta diferentes ranges (0-4, 1-3, 1-4, 1-5)

### Fase 3 — Integracao com AAPRegistrarAcaoPage

1. Atualizar `handleSelectProgramacao` para:
   - Para `observacao_aula`: manter fluxo existente de pre-selecao + formulario
   - Para todos os outros tipos com formulario: abrir o `InstrumentForm` generico
   - Para tipos sem formulario (formacao/lista_presenca): manter fluxo de presenca existente
2. No `handleSubmit`, salvar em `instrument_responses` ao inves de (ou alem de) `avaliacoes_aula`
3. Manter retrocompatibilidade: registros antigos em `avaliacoes_aula` continuam funcionando

### Fase 4 — Admin: Configuracao de Formularios

1. Expandir `FormFieldConfigPage` para permitir selecionar qual formulario configurar (dropdown de form_type)
2. A matriz de campos carrega dinamicamente de `instrument_fields` (nao mais hardcoded)
3. O admin pode ativar/desativar campos e marcar como obrigatorio por perfil via `form_field_config`
4. Manter a configuracao de `min_optional_questions` por form_type

### Fase 5 — Observacao de Aula: Migracao

1. Migrar a definicao hardcoded de `OBSERVACAO_AULA_FIELDS` e `dimensoesAvaliacao` para registros na tabela `instrument_fields`
2. Atualizar o `QuestionSelectionStep` para ler de `instrument_fields` em vez de constantes
3. O formulario de Observacao de Aula passa a usar o `InstrumentForm` generico, mantendo o comportamento especial de pre-selecao

## Detalhes Tecnicos

### Componente InstrumentForm (esboço)

```typescript
interface InstrumentFormProps {
  formType: string;
  responses: Record<string, any>;
  onResponseChange: (fieldKey: string, value: any) => void;
  selectedKeys?: string[]; // Para pre-selecao (Obs. Aula)
  readOnly?: boolean;
}
```

O componente:
- Busca `instrument_fields` filtrado por `formType`
- Agrupa por `dimension` (se existir)
- Renderiza cada campo conforme `field_type`:
  - `rating`: botoes numericos com labels; tooltip/accordion com rubricas descritivas de `scale_labels`
  - `text`: textarea
  - `select_one`: radio group
  - `select_multi`: checkbox group
- Se `selectedKeys` for passado, renderiza apenas esses campos

### Seed dos campos (exemplo parcial)

```sql
INSERT INTO instrument_fields (form_type, field_key, label, description, field_type, scale_min, scale_max, scale_labels, dimension, sort_order, is_required) VALUES
-- Observacao de Aula
('observacao_aula', 'conteudo_curriculo', 'O conteudo trabalhado estava alinhado ao curriculo', 'Foco: A aula aborda o que e essencial para o ano/ciclo...', 'rating', 1, 4, '[{"value":1,"label":"Elementar","description":"O conteudo trabalhado nao possui conexao clara..."},...]', 'Conhecimento pedagogico do conteudo', 1, true),
-- ... demais campos
-- Devolutiva Pedagogica
('devolutiva_pedagogica', 'retomada_objetivo', 'Retomada do objetivo da aula observada', null, 'rating', 1, 4, '[{"value":1,"label":"Inicial","description":"O objetivo nao e retomado..."},...]', null, 1, true),
-- ... etc para todos os 11 formularios
```

### Fluxo de decisao no registro

```text
Usuario seleciona programacao
    |
    v
Tipo da acao?
    |
    +--> observacao_aula --> Pre-selecao questoes --> InstrumentForm (filtrado)
    |
    +--> formacao / lista_presenca --> Lista de presenca (fluxo existente)
    |
    +--> qualquer outro tipo com instrument_fields --> InstrumentForm (completo)
    |
    +--> tipo sem instrument_fields --> Formulario basico (observacoes/avancos/dificuldades)
```

## Arquivos Impactados

| Arquivo | Acao |
|---------|------|
| Nova migracao SQL | Criar `instrument_fields`, `instrument_responses`, seed, RLS, trigger |
| `src/hooks/useInstrumentFields.ts` | **Novo** — fetch definicao de campos |
| `src/hooks/useInstrumentResponses.ts` | **Novo** — CRUD respostas |
| `src/components/instruments/InstrumentForm.tsx` | **Novo** — renderizador generico |
| `src/components/instruments/RatingScale.tsx` | **Novo** — componente de escala |
| `src/components/instruments/DimensionBlock.tsx` | **Novo** — agrupador por dimensao |
| `src/components/instruments/RubricAccordion.tsx` | **Novo** — exibicao de rubricas |
| `src/pages/aap/AAPRegistrarAcaoPage.tsx` | Atualizar para usar InstrumentForm |
| `src/hooks/useFormFieldConfig.ts` | Adaptar para ler de instrument_fields |
| `src/pages/admin/FormFieldConfigPage.tsx` | Expandir para multiplos formularios |
| `src/components/acompanhamento/QuestionSelectionStep.tsx` | Adaptar para dados dinamicos |

## Riscos e Mitigacoes

- **Volume de seed SQL**: Os 11 formularios somam ~80+ campos com rubricas longas. O seed sera extenso mas necessario para fidelidade ao documento.
- **Retrocompatibilidade**: Dados existentes em `avaliacoes_aula` permanecem intactos. O sistema le de ambas as tabelas conforme a data do registro.
- **Performance**: As rubricas descritivas (JSONBs grandes) sao carregadas sob demanda por form_type, nao todas de uma vez.

