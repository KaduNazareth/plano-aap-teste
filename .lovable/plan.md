

# Alternativa: Adicionar "todos" / "múltiplos" como opção de Segmento e Ano/Série

## Conceito

Em vez de converter os campos para arrays (alteração de alto impacto), adicionar valores especiais como opções nos selects existentes:

- **Segmento**: adicionar `"todos"` (professor atua em todos os segmentos)
- **Ano/Série**: adicionar `"todos"` (professor atua em todos os anos/séries)

## Impacto

**Muito baixo** — nenhuma alteração no banco de dados, apenas ajustes no frontend.

### O que muda

| Item | Detalhe |
|---|---|
| Migração DB | **Nenhuma** — os campos são `text`, aceitam qualquer valor |
| RLS | Nenhuma alteração |
| Arquivos | ~3-4 arquivos |

### Alterações necessárias

1. **`ProfessoresPage.tsx`** — Adicionar `"todos"` como opção nos `<Select>` de segmento e ano_serie no formulário de cadastro/edição

2. **`AAPRegistrarAcaoPage.tsx`** — Ajustar a filtragem de professores para considerar `"todos"`:
   ```
   // De:
   p.segmento === prog.segmento
   // Para:
   p.segmento === prog.segmento || p.segmento === 'todos'
   ```
   Mesma lógica para `ano_serie`.

3. **Demais páginas com filtro** (`ProgramacaoPage`, `AdminDashboard`, `RelatoriosPage`) — Incluir professores com valor `"todos"` nos filtros e contagens

4. **Importação em lote de professores** — Aceitar `"todos"` como valor válido

### Vantagem
- Zero risco de quebra — é apenas mais um valor de texto
- Sem migração de dados existentes
- Compatível com toda a lógica atual

### Limitação
- Não permite combinações parciais (ex: "1º Ano + 3º Ano" sem o 5º). Apenas "um específico" ou "todos". Se isso for suficiente para o caso de uso, é a solução ideal.

