

# Pontos Observados por Formacao - Nova Pagina com PDF

## Resumo

Criar uma nova pagina `/pontos-observados` que exibe e permite baixar um PDF com as notas dos instrumentos pedagogicos e textos descritivos (observacoes, avancos, dificuldades) agrupados por formacao. Tambem corrigir a proporcao do logo no cabecalho PDF existente da pagina de Relatorios.

## 1. Substituir a imagem do logo

Copiar a nova imagem `PE_Logo_Branco_horizontal-6.png` enviada pelo usuario para `src/assets/pe-logo-branco-horizontal.png`, substituindo a atual. Isso corrige a proporcao em ambos os PDFs (Relatorios existente e nova pagina).

## 2. Corrigir proporcao do logo no PDF de Relatorios

No arquivo `src/pages/admin/RelatoriosPage.tsx`, ajustar as dimensoes do logo no `drawHeader` para manter a proporcao correta da nova imagem (que e mais larga, ~5:1). Alterar:
- `logoW` de 36 para ~45mm
- `logoH` de 8 para ~9mm

## 3. Criar pagina `PontosObservadosPage`

**Arquivo**: `src/pages/admin/PontosObservadosPage.tsx`

### Filtros
- **Programa**: Select com opcoes (Escolas, Regionais, Redes Municipais, Todos)
- **Formador**: Select populado com profiles da tabela `profiles_directory` filtrados pelos AAPs que possuem registros de formacao
- **Formacao**: Select populado pelas programacoes do tipo `formacao` com status `realizada`, filtradas pelo programa e formador selecionados. Exibe titulo + data + escola

### Dados exibidos na tela (preview) e no PDF
Para a formacao selecionada, buscar:
1. O `registros_acao` vinculado a essa `programacao_id`
2. Os campos de texto do registro: `observacoes`, `avancos`, `dificuldades`
3. As `instrument_responses` vinculadas ao `registro_acao_id` com os respectivos `instrument_fields` para exibir labels e notas
4. As `avaliacoes_aula` vinculadas ao `registro_acao_id` com notas e observacoes

### Layout do conteudo
- Cabecalho com informacoes da formacao (titulo, data, escola, formador, segmento, componente)
- Secao "Notas dos Instrumentos" — tabela com dimensao, campo, nota para cada resposta
- Secao "Observacoes" — textos de observacoes, avancos e dificuldades do registro

### Geracao de PDF
Reutilizar o mesmo padrao ja existente:
- Cabecalho institucional identico ao da pagina de Relatorios (fundo #1a3a5c, logo horizontal, titulo, data)
- Titulo adaptado: "Pontos Observados por Formacao"
- Subtitulo com nome do programa, formador e formacao
- Captura das secoes via `html2canvas` + `jsPDF` com `data-pdf-section`

## 4. Registrar rota e menu

- **`src/App.tsx`**: Adicionar rota `/pontos-observados` apontando para `PontosObservadosPage`
- **`src/components/layout/Sidebar.tsx`**: Adicionar item de menu "Pontos Observados" com icone `Eye` nos menus de admin e manager (e opcionalmente AAP)

## Detalhes Tecnicos

### Queries ao banco
```typescript
// 1. Programacoes realizadas (para o filtro de Formacao)
supabase.from('programacoes')
  .select('id, titulo, data, escola_id, aap_id, segmento, componente, programa')
  .eq('tipo', 'formacao')
  .eq('status', 'realizada')

// 2. Registro de acao vinculado
supabase.from('registros_acao')
  .select('id, observacoes, avancos, dificuldades, ...')
  .eq('programacao_id', selectedProgramacaoId)

// 3. Instrument responses
supabase.from('instrument_responses')
  .select('*')
  .eq('registro_acao_id', registroId)

// 4. Instrument fields (para labels)
supabase.from('instrument_fields')
  .select('*')
  .in('form_type', [...formTypes])

// 5. Avaliacoes aula
supabase.from('avaliacoes_aula')
  .select('*')
  .eq('registro_acao_id', registroId)
```

### Proporcao do logo
A imagem enviada tem proporcao ~5:1. No jsPDF usar `logoW = 45, logoH = 9` para manter fidelidade visual.

### Estrutura de arquivos

| Acao | Arquivo |
|---|---|
| Criar | `src/pages/admin/PontosObservadosPage.tsx` |
| Editar | `src/App.tsx` (adicionar rota) |
| Editar | `src/components/layout/Sidebar.tsx` (adicionar menu) |
| Editar | `src/pages/admin/RelatoriosPage.tsx` (corrigir logo) |
| Substituir | `src/assets/pe-logo-branco-horizontal.png` (novo logo) |

### Nenhuma migracao necessaria
Todos os dados ja existem nas tabelas `registros_acao`, `instrument_responses`, `instrument_fields` e `avaliacoes_aula`. As RLS policies ja permitem leitura conforme o perfil do usuario.
