

# Tornar "Monitoramento e Gestão" visível na Matriz de Ações e Configurar Formulários

## Diagnóstico

1. **Matriz de Ações**: O código já trata `monitoramento_gestao` via `REDES_FORM_TYPES` — o botão "Visualizar" deveria aparecer. Se não aparece, pode ser que a versão anterior do código não foi deployada corretamente. Verificarei se há algum problema residual.

2. **Configurar Formulários**: O dropdown de instrumentos em `FormFieldConfigPage.tsx` usa `INSTRUMENT_FORM_TYPES` de `useInstrumentFields.ts`. O `monitoramento_gestao` **não está nesta lista**, por isso não aparece no dropdown.

## Solução

### Arquivo: `src/hooks/useInstrumentFields.ts`
Adicionar `monitoramento_gestao` ao array `INSTRUMENT_FORM_TYPES`:
```typescript
{ value: 'monitoramento_gestao', label: 'Monitoramento e Gestão' },
```

Isso faz com que:
- Apareça no dropdown da página "Configurar Formulários"
- Também seja reconhecido pelo `INSTRUMENT_TYPE_SET` na Matriz de Ações (redundância segura com `REDES_FORM_TYPES`)

## Arquivos impactados

| Arquivo | Alteração |
|---|---|
| `src/hooks/useInstrumentFields.ts` | Adicionar `monitoramento_gestao` ao `INSTRUMENT_FORM_TYPES` |

