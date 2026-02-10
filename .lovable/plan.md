

# Horas de Formacao, Historico de Presenca e Correcao do PDF

## Resumo

Quatro funcionalidades:
1. Contabilizar horas de formacao (diferenca entre horario_inicio e horario_fim)
2. Nova pagina "Historico de Presenca" com acumulado por formacao e por professor, mostrando % presenca e horas
3. Presenca do professor so conta no periodo em que ele estiver "ativo" (usando `created_at` e `data_desativacao`)
4. Correcao do PDF da lista de presenca com cabecalho repetido por pagina e contagem de paginas

---

## 1. Funcao de calculo de horas

Criar uma funcao utilitaria `calcularHorasFormacao(horario_inicio: string, horario_fim: string): number` que retorna a duracao em horas (decimal).

Exemplo: "08:00" a "11:30" = 3.5 horas.

Sera reutilizada em toda a aplicacao.

**Arquivo**: `src/lib/utils.ts` (adicionar funcao)

---

## 2. Nova pagina: Historico de Presenca

### Menu
Adicionar item "Historico Presenca" no menu lateral (Sidebar.tsx) para admin, gestor e AAP, utilizando um icone como `ClipboardCheck` ou `History`.

**Rota**: `/historico-presenca`

### Funcionalidade da pagina

A pagina tera duas abas (tabs):

**Aba 1 - Por Formacao:**
- Lista todas as formacoes realizadas (`programacoes` com `tipo='formacao'` e `status='realizada'`)
- Para cada formacao: titulo, data, escola, horas (calculadas), total participantes, presentes, % presenca
- Filtros: escola, periodo, componente, segmento

**Aba 2 - Por Professor (Ator):**
- Lista todos os professores
- Para cada professor: nome, escola, total de formacoes elegiveis (no periodo ativo), presencas, % presenca, total de horas acumuladas
- Filtros: escola, periodo, componente, segmento

### Logica de "periodo ativo"

A presenca de um professor so conta se a data da formacao estiver dentro do seu periodo ativo:
- Inicio: `professores.created_at`
- Fim: `professores.data_desativacao` (se null, professor esta ativo ate hoje)

```text
formacao.data >= professor.created_at
AND (professor.data_desativacao IS NULL OR formacao.data <= professor.data_desativacao)
```

Isso sera aplicado tanto na contagem de presenca quanto no calculo de formacoes elegiveis por professor.

### Dados necessarios (queries)

1. Buscar programacoes realizadas do tipo formacao
2. Buscar registros_acao correspondentes (via programacao_id)
3. Buscar presencas vinculadas aos registros
4. Buscar professores com `created_at` e `data_desativacao`
5. Cruzar: para cada professor, filtrar formacoes onde ele estava ativo, verificar presenca

**Arquivo novo**: `src/pages/admin/HistoricoPresencaPage.tsx`

---

## 3. Correcao do PDF da Lista de Presenca

### Problemas atuais
- Cabecalho nao repete em cada pagina
- Nao ha contagem de paginas
- Layout nao utiliza o cabecalho padrao da aplicacao

### Solucao

Reescrever `ListaPresencaPrint.tsx` utilizando CSS de impressao adequado:

**Cabecalho repetido em cada pagina:**
- Usar `<thead>` da tabela com `display: table-header-group` (CSS nativo para repeticao de cabecalho em impressao)
- Mover as informacoes da formacao (titulo, data, hora, programa, formador, escola) para dentro do `<thead>` como linhas de cabecalho

**Contagem de paginas:**
- Usar CSS `@page` com `counter` para paginas:
```text
@page {
  @bottom-right {
    content: "Pagina " counter(page) " de " counter(pages);
  }
}
```
- Como fallback (nem todos os navegadores suportam), adicionar via CSS `position: fixed` no rodape

**Conteudo do cabecalho:**
- Nome da formacao
- Programa
- Data e horario
- Escola
- Formador
- Segmento e componente

**Layout A4:**
- Manter `@page { size: A4; margin: 15mm; }`
- Tabela com bordas pretas, linhas com altura minima de 10mm para assinaturas

**Arquivo**: `src/components/presenca/ListaPresencaPrint.tsx` (reescrever)

---

## 4. Roteamento

Adicionar rota `/historico-presenca` no `App.tsx`.

---

## Arquivos modificados

| Arquivo | Acao |
|---|---|
| `src/lib/utils.ts` | Adicionar `calcularHorasFormacao()` |
| `src/pages/admin/HistoricoPresencaPage.tsx` | CRIAR - nova pagina |
| `src/components/layout/Sidebar.tsx` | Adicionar menu "Historico Presenca" |
| `src/App.tsx` | Adicionar rota `/historico-presenca` |
| `src/components/presenca/ListaPresencaPrint.tsx` | Reescrever com cabecalho repetido e paginacao |

Nenhuma migracao SQL necessaria - todos os dados ja existem nas tabelas (`programacoes`, `registros_acao`, `presencas`, `professores`).

---

## Detalhes tecnicos

### Calculo de horas
```text
function calcularHorasFormacao(inicio: string, fim: string): number {
  const [hi, mi] = inicio.split(':').map(Number);
  const [hf, mf] = fim.split(':').map(Number);
  return (hf * 60 + mf - hi * 60 - mi) / 60;
}
```

### Filtro de periodo ativo do professor
```text
const professorAtivoNaFormacao = (professor, formacaoData) => {
  const dataFormacao = new Date(formacaoData);
  const createdAt = new Date(professor.created_at);
  if (dataFormacao < createdAt) return false;
  if (professor.data_desativacao) {
    const desativacao = new Date(professor.data_desativacao);
    if (dataFormacao > desativacao) return false;
  }
  return true;
};
```

### Estrutura da aba "Por Professor"
Cada linha exibe:
- Nome do professor
- Escola
- Status (ativo/inativo)
- Formacoes elegiveis (quantidade no periodo ativo)
- Presencas registradas
- % presenca (presencas / elegiveis * 100)
- Horas acumuladas (soma das horas das formacoes em que esteve presente)

### CSS de impressao para paginacao
O cabecalho da formacao sera incluido como parte do `<thead>` da tabela principal, garantindo repeticao automatica pelo navegador em cada pagina. O rodape com numero de pagina sera via `@page` CSS ou `position: fixed` como fallback.

