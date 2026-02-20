
# Atualizar Modelo de Importação em Lote de Atores Educacionais

## Problema

O modelo Excel atual (`modelo_professores.xlsx`) não documenta os valores aceitos para os campos **Segmento**, **Componente** e **Ano/Série**. Quem tenta importar não sabe quais valores digitar, causando erros de validação no upload.

Além disso, o dialog de importação não exibe uma lista dos valores válidos para orientar o usuário antes de montar o arquivo.

## Alterações

### Arquivo: `src/pages/admin/ProfessoresPage.tsx`

#### 1. Enriquecer o modelo Excel com aba de referência (`handleExportTemplate`)

O arquivo baixado passará a ter **duas abas**:

**Aba 1 — "Atores"** (dados a preencher): igual ao atual, com uma linha de exemplo.

```
Nome | Email | Telefone | Escola | Segmento | Componente | Ano/Série | Cargo | Programa
Maria Silva | maria@escola.edu.br | (11) 99999-9999 | Nome da Escola | anos_iniciais | polivalente | 1º Ano | professor | escolas
```

**Aba 2 — "Valores Válidos"** (guia de referência): tabela com colunas explicando todos os valores aceitos por campo.

| Campo | Valor | Descrição |
|---|---|---|
| Segmento | anos_iniciais | Anos Iniciais |
| Segmento | anos_finais | Anos Finais |
| Segmento | ensino_medio | Ensino Médio |
| Componente | polivalente | Polivalente |
| Componente | lingua_portuguesa | Língua Portuguesa |
| Componente | matematica | Matemática |
| Ano/Série | 1º Ano | Anos Iniciais |
| Ano/Série | 2º Ano | Anos Iniciais |
| ... | ... | ... |
| Cargo | professor | Professor |
| Cargo | coordenador | Coordenador |
| Cargo | vice_diretor | Vice-Diretor |
| Cargo | diretor | Diretor |
| Cargo | equipe_tecnica_sme | Equipe Técnica (SME) |
| Programa | escolas | Programa de Escolas |
| Programa | regionais | Programa de Regionais de Ensino |
| Programa | redes_municipais | Programa de Redes Municipais |

#### 2. Atualizar instruções no dialog de importação

Substituir o texto genérico `"Faça upload de um arquivo Excel (.xlsx) com os dados dos professores."` por uma lista clara dos campos esperados e seus valores válidos, semelhante ao que já existe no `EscolaUploadDialog`:

```
Formato do arquivo:
- Nome: Nome completo do ator educacional (obrigatório)
- Email: Email (opcional)
- Telefone: Telefone (opcional)
- Escola: Nome ou CODESC da escola (obrigatório)
- Segmento: anos_iniciais | anos_finais | ensino_medio
- Componente: polivalente | lingua_portuguesa | matematica
- Ano/Série: 1º Ano, 2º Ano ... 9º Ano, 1ª Série ...
- Cargo: professor | coordenador | vice_diretor | diretor | equipe_tecnica_sme
- Programa: escolas | regionais | redes_municipais

Baixe o modelo para ver os valores válidos na aba "Valores Válidos".
```

### Resumo

| Aspecto | Antes | Depois |
|---|---|---|
| Modelo Excel | 1 aba, 1 linha de exemplo sem guia | 2 abas: dados + aba "Valores Válidos" |
| Dialog instrucional | Texto genérico | Lista detalhada de campos e valores aceitos |
| Experiência de importação | Usuário precisa adivinhar os valores | Usuário tem referência clara no próprio arquivo |
