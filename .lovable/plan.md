

# Atualizar opções de Material Didático na Observação de Aula

## Alterações

### 1. Atualizar opções no campo `material_didatico` (tabela `instrument_fields`)

Migração SQL para atualizar o `metadata` do campo:

```sql
UPDATE instrument_fields
SET metadata = '{"options": ["Orientação de Estudos", "Professor Tutor", "MEN10", "VOAR", "Escopo Sequência", "Alfabetização MHB"]}'::jsonb
WHERE field_key = 'material_didatico' AND form_type = 'observacao_aula';
```

Mudanças:
- "São Paulo em Ação" → removido (substituído por "Orientação de Estudos" que já existe)
- "Orientação de Estudos" → mantido
- "Tutoria" → "Professor Tutor"
- Novos: "MEN10", "VOAR", "Escopo Sequência", "Alfabetização MHB"

### 2. Atualizar registros existentes (tabela `instrument_responses`)

```sql
-- "São Paulo em Ação" → "Orientação de Estudos"
UPDATE instrument_responses
SET responses = jsonb_set(responses, '{material_didatico}', '"Orientação de Estudos"')
WHERE form_type = 'observacao_aula'
  AND responses->>'material_didatico' = 'São Paulo em Ação';

-- "Tutoria" → "Professor Tutor"
UPDATE instrument_responses
SET responses = jsonb_set(responses, '{material_didatico}', '"Professor Tutor"')
WHERE form_type = 'observacao_aula'
  AND responses->>'material_didatico' = 'Tutoria';
```

| Item | Detalhe |
|---|---|
| Arquivos frontend | Nenhum — as opções vêm da tabela `instrument_fields` |
| Migração DB | 3 statements (1 update de opções + 2 updates de dados existentes) |
| Registros afetados | 1 registro com "São Paulo em Ação", 0 com "Tutoria" |
| Risco | Baixo |

