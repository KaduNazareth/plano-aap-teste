

## Correcao dos formularios trocados entre Formacao e Acompanhamento de Formacoes

### Problema identificado

Os dados no banco de dados estao com os `form_type` invertidos na tabela `instrument_fields`:

- **`formacao`** no banco tem 8 campos (Tema, Objetivos, Conteudos, Metodologia, Engajamento, Evidencias, Pontos de Atencao, Proximos Passos) -- mas esses campos pertencem ao **Acompanhamento de Formacoes**
- **`acompanhamento_formacoes`** no banco tem 6 campos (Objetivos, Metodologia, Engajamento, Evidencias, Pontos de Atencao, Proximos Passos) -- mas esses campos pertencem a **Formacao**

O codigo faz mapeamento direto (1:1) entre tipo de acao e tipo de formulario, entao o problema nao esta no codigo, mas sim nos dados. Ao corrigir os dados, tanto a pagina "Matriz de Acoes x Perfis" quanto o calendario passarao a exibir os formularios corretos.

### Solucao

Uma unica migracao SQL para trocar os valores de `form_type` na tabela `instrument_fields`:

1. Renomear temporariamente `formacao` para `_temp_formacao`
2. Renomear `acompanhamento_formacoes` para `formacao`
3. Renomear `_temp_formacao` para `acompanhamento_formacoes`

Tambem sera necessario fazer o mesmo swap para dados ja existentes na tabela `instrument_responses` (se houver respostas salvas) e `form_field_config` (se houver configuracoes de campo por perfil).

### Detalhes tecnicos

**Migracao SQL:**

```text
-- Swap form_type values in instrument_fields
UPDATE instrument_fields SET form_type = '_temp_formacao' WHERE form_type = 'formacao';
UPDATE instrument_fields SET form_type = 'formacao' WHERE form_type = 'acompanhamento_formacoes';
UPDATE instrument_fields SET form_type = 'acompanhamento_formacoes' WHERE form_type = '_temp_formacao';

-- Swap form_type values in instrument_responses (if any)
UPDATE instrument_responses SET form_type = '_temp_formacao' WHERE form_type = 'formacao';
UPDATE instrument_responses SET form_type = 'formacao' WHERE form_type = 'acompanhamento_formacoes';
UPDATE instrument_responses SET form_type = 'acompanhamento_formacoes' WHERE form_type = '_temp_formacao';

-- Swap form_type values in form_field_config (if any)
UPDATE form_field_config SET form_type = '_temp_formacao' WHERE form_type = 'formacao';
UPDATE form_field_config SET form_type = 'formacao' WHERE form_type = 'acompanhamento_formacoes';
UPDATE form_field_config SET form_type = 'acompanhamento_formacoes' WHERE form_type = '_temp_formacao';
```

**Nenhuma alteracao de codigo e necessaria** -- o mapeamento direto no `MatrizAcoesPage.tsx` e no `ProgramacaoPage.tsx` ja esta correto. O problema esta exclusivamente nos dados.

### Resultado esperado

- Na Matriz de Acoes: "Formacao" mostrara o formulario com 6 campos e "Acompanhamento Formacoes" mostrara o formulario com 8 campos
- No calendario: ao gerenciar uma acao de Formacao ou Acompanhamento, o formulario correto sera carregado
- Respostas ja salvas (se existirem) continuarao vinculadas ao tipo correto
