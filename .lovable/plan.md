

# Implementar 5 Novos Instrumentos de Ação (Regionais)

A migration de banco (CHECK constraints + tabela `relatorios_monitoramento_gestao`) já foi executada. Agora falta o código frontend e o seed dos dados dos instrumentos dinâmicos.

## Etapas

### 1. Seed dos instrument_fields (4 formulários dinâmicos)

Inserir via migration os campos de cada instrumento na tabela `instrument_fields`, com rubricas no `scale_labels` (JSONB):

| Formulário | Dimensões | Escala |
|---|---|---|
| `lideranca_gestores_pei` | I. Liderança Pedagógica para Engajamento, II. Gestão de Resultados para Excelência, III. Implementação do Plano de Ação, IV. Monitoramento do Plano de Ação | 1-4 (Inicial/Básico/Adequado/Avançado) |
| `acomp_professor_tutor` | I. Acolhimento e Construção de Vínculo, II. Diferenciação e Agrupamento, III. Domínio Material Horizonte, IV. Mediação Individualizada, V. Promoção Autoeficácia, VI. Registro e Tarefa SP, VII. Utilização dos Resultados | 1-4 |
| `pec_qualidade_aula` | 1. Planejamento/Organização/Registro, 2. Uso de Dados, 3. Observação de Aula e Feedback, 4. Intervenção Pedagógica, 5. Articulação Interfuncional | 1-4 (Inicial/Básico/Adequado/Avançado) |
| `visita_voar` | I. Implementação de política pública, II. Uso pedagógico de dados, III. Engajamento equidade, IV. Planejamento mudança práticas, V. Ciclo Monitoramento Sustentabilidade | 1-4 |

Para `visita_voar`, incluir 2 campos extras:
- `tipo_visita` (field_type: `select`, metadata com opções PEI/Parcial)
- `entrevistados` (field_type: `multi_select`, metadata com opções Direção/Coordenação)

### 2. `src/config/acaoPermissions.ts`

- Adicionar 5 novos tipos ao `AcaoTipo`, `ACAO_TIPOS`, `ACAO_TYPE_INFO`
- Adicionar ao `ACAO_PERMISSION_MATRIX` com padrão REDES: `buildRolePerms(CRUD_ALL, CRUD_PRG, CRUD_PRG, CRUD_ENT, CRUD_ENT, CRUD_ENT, NONE, NONE, NONE)`
- Adicionar ao `ACAO_FORM_CONFIG` (sem segmento/componente/anoSerie, isCreatable: true)

### 3. `src/hooks/useInstrumentFields.ts`

Adicionar 4 novos form_types ao `INSTRUMENT_FORM_TYPES`:
- `lideranca_gestores_pei` → "Liderança Pedagógica – Gestores PEI"
- `acomp_professor_tutor` → "Acompanhamento Professor Tutor"
- `pec_qualidade_aula` → "PEC Qualidade de Aula"
- `visita_voar` → "Instrumento de Visita – Projeto VOAR"

### 4. Novo componente: `src/components/formularios/MonitoramentoGestaoForm.tsx`

Formulário hardcoded seguindo o padrão de `ObservacaoAulaRedesForm`:
- Props: `entidades`, `data`, `horarioInicio`, `onSuccess`
- Campos: URE (entidade selecionada), Data/Horário (auto-preenchidos)
- **Público do Encontro**: checkboxes multi-select (7 opções: Líder Regional, Dirigente, CEC, Supervisor, PEC, Gestão Escolar, Professor)
- **Frente de Trabalho**: radio group (6 opções: Semanal Gestão, Governança, Mentoria Dirigente, PDCA, Alinhamento CEC, Imersão em Dados)
- **Observação**: textarea
- **Condicional PDCA**: quando "PDCA" selecionado, exibe 5 textareas (Temas, Pontos de Atenção, Encaminhamentos, Material Utilizado, Aprendizados)
- Salva em `relatorios_monitoramento_gestao` vinculado ao `registro_acao_id`

### 5. `src/pages/aap/AAPRegistrarAcaoPage.tsx`

- Adicionar `monitoramento_gestao` ao conjunto de tipos com formulário dedicado (similar a `REDES_TYPES`), criando `REGIONAIS_HARDCODED_TYPES = new Set(['monitoramento_gestao'])`
- Na lógica de determinação de tipo (variáveis `isRedesType`, `isInstrumentType`), excluir `monitoramento_gestao` do `INSTRUMENT_TYPE_SET` (ele tem tabela própria)
- Adicionar novo Dialog para `monitoramento_gestao` (padrão do REDES Dialog) que renderiza `MonitoramentoGestaoForm`
- No submit do `MonitoramentoGestaoForm`, criar o `registro_acao` e salvar no `relatorios_monitoramento_gestao`
- Os 4 dinâmicos (`lideranca_gestores_pei`, `acomp_professor_tutor`, `pec_qualidade_aula`, `visita_voar`) já são tratados automaticamente pelo fluxo `isInstrumentType` existente

### 6. Integração entidade_filho (cascata)

- Para os tipos que pedem URE + Escola (`lideranca_gestores_pei`, `acomp_professor_tutor`, `visita_voar`, `monitoramento_gestao`): adicionar um select cascata opcional de `entidades_filho` filtrado pela `escola_id` (entidade pai) da programação
- No `InstrumentForm.tsx` ou no Dialog de registro: detectar se o `form_type` requer entidade_filho (via metadata ou lista hardcoded) e exibir o campo

## Arquivos impactados

| Arquivo | Ação |
|---|---|
| Migration SQL (seed) | INSERT instrument_fields para 4 formulários |
| `src/config/acaoPermissions.ts` | 5 novos tipos + permissões + form config |
| `src/hooks/useInstrumentFields.ts` | 4 novos form_types |
| `src/components/formularios/MonitoramentoGestaoForm.tsx` | **Novo** |
| `src/pages/aap/AAPRegistrarAcaoPage.tsx` | Integrar MonitoramentoGestaoForm + tipos |

