

## Alterar "Professores" para "Atores Educacionais" e "+ Novo Professor" para "+ Novo Ator"

Alteracao em 3 pontos no arquivo `src/pages/admin/ProfessoresPage.tsx`:

### Alteracoes

**Arquivo: `src/pages/admin/ProfessoresPage.tsx`**

| Linha | De | Para |
|-------|-----|------|
| 701 | `Professores` (titulo h1) | `Atores Educacionais` |
| 703 | `{totalProfessores} professores e {totalCoordenadores} coordenadores ativos` | `{totalProfessores} professores e {totalCoordenadores} coordenadores ativos` (sem alteracao -- o subtitulo ja descreve corretamente os totais por cargo) |
| 766 | `Novo Professor` (botao) | `Novo Ator` |

Nenhuma outra alteracao necessaria -- variaveis internas, queries e dialogos permanecem inalterados.

