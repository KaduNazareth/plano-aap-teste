

## Cadastrar Formularios: Agenda de Gestao e Acompanhamento Formacao

### Resumo
Cadastrar os campos dos formularios "Agenda de Gestao" e "Acompanhamento Formacoes" no banco de dados e ajustar o codigo para que o InstrumentForm seja exibido ao registrar essas acoes.

### O que sera feito

**1. Inserir campos no banco (migracao SQL)**

Criar registros na tabela `instrument_fields` para os dois formularios:

**Agenda de Gestao** (`agenda_gestao`) -- 6 campos texto:
- pontos_discutidos -- "Pontos Discutidos"
- ajustes_combinados -- "Ajustes e Combinados"
- direcionamentos_o_que_fazer -- "Direcionamentos - O que fazer"
- direcionamentos_responsavel -- "Direcionamentos - Responsavel"
- direcionamentos_prazo -- "Direcionamentos - Prazo"
- observacoes_adicionais -- "Observacoes Adicionais"

**Acompanhamento Formacoes** (`acompanhamento_formacoes`) -- 6 campos texto:
- objetivos_formacao -- "Objetivos da Formacao"
- metodologia_recursos -- "Metodologia e Recursos Utilizados"
- percepcao_engajamento -- "Percepcao de Engajamento"
- evidencias -- "Evidencias"
- pontos_atencao -- "Pontos de Atencao"
- proximos_passos -- "Proximos Passos"

Todos com `field_type = 'text'`, sem escala de avaliacao.

**2. Adicionar ao INSTRUMENT_FORM_TYPES** (`src/hooks/useInstrumentFields.ts`)

Incluir `agenda_gestao` e `acompanhamento_formacoes` na lista para que o sistema os reconheca como tipos com formulario associado.

**3. Ajustar logica de tipo no registro de acao** (`src/pages/aap/AAPRegistrarAcaoPage.tsx`)

Atualmente `acompanhamento_formacoes` esta no `PRESENCE_TYPES`, fazendo com que so mostre lista de presenca. Sera necessario ajustar para que esse tipo tambem exiba o InstrumentForm apos a lista de presenca (ou como formulario principal), mantendo a presenca se desejado.

### Detalhes tecnicos

- A migracao SQL insere 12 linhas em `instrument_fields` com `form_type`, `field_key`, `label`, `description`, `field_type = 'text'`, `sort_order` sequencial e `is_required = false`
- No `AAPRegistrarAcaoPage.tsx`, remover `acompanhamento_formacoes` de `PRESENCE_TYPES` ou adicionar logica hibrida que mostra presenca E instrumento para esse tipo
- Adicionar 2 entradas em `INSTRUMENT_FORM_TYPES`
- `agenda_gestao` tem campo "Responsavel" que poderia ser um select dos participantes, mas sera implementado como texto livre inicialmente (pode ser refinado depois)
