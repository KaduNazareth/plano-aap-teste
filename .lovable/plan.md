

## Novo fluxo de criacao de acao em duas etapas

### Situacao atual
O botao "Nova Acao" abre um unico dialog grande com todos os tipos de acao como botoes no topo e todos os campos do formulario abaixo. Isso torna a interface confusa, especialmente porque campos como Segmento, Componente e Ano/Serie mudam de comportamento dependendo do tipo selecionado.

### Novo fluxo proposto

**Etapa 1 - Selecao do tipo de acao:**
- Ao clicar em "Nova Acao", abre um dialog limpo mostrando apenas os tipos de acao disponiveis para o perfil do usuario
- Cada tipo e apresentado como um card/botao com icone, nome e uma breve descricao
- O usuario clica no tipo desejado

**Etapa 2 - Formulario especifico:**
- Apos selecionar o tipo, abre um segundo dialog (substituindo o primeiro) com os campos relevantes para aquele tipo de acao
- Campos condicionais (Segmento, Componente, Ano/Serie) ja aparecem configurados conforme o tipo selecionado
- O titulo do dialog mostra o tipo selecionado (ex: "Programar Formacao", "Programar Observacao de Aula")

### Detalhes tecnicos

#### Arquivo modificado: `src/pages/admin/ProgramacaoPage.tsx`

**1. Novo estado para controlar as etapas:**
```text
const [isTypeSelectionOpen, setIsTypeSelectionOpen] = useState(false);
```
O `isDialogOpen` existente continua controlando o dialog do formulario (etapa 2).

**2. Etapa 1 - Dialog de selecao de tipo:**
- Um novo `Dialog` controlado por `isTypeSelectionOpen`
- Renderiza os `creatableAcoes` (excluindo `acompanhamento_formacoes`) como cards em grid
- Cada card mostra: icone (`ACAO_TYPE_INFO[tipo].icon`), label (`ACAO_TYPE_INFO[tipo].label`)
- Ao clicar em um card:
  - Define `formData.tipo` com o tipo selecionado
  - Fecha o dialog de selecao (`setIsTypeSelectionOpen(false)`)
  - Abre o dialog do formulario (`setIsDialogOpen(true)`)

**3. Etapa 2 - Dialog do formulario (refatorado):**
- Remove o bloco de botoes de selecao de tipo (linhas 1379-1404) que hoje aparece dentro do form
- Adiciona um indicador visual no topo do dialog mostrando o tipo selecionado (icone + label) com opcao de voltar
- Mantem todos os campos existentes com a logica condicional atual (`isFormacaoType`, etc.)
- O titulo do dialog muda para incluir o tipo: ex: "Programar {tipoLabel}"

**4. Atualizar o botao "Nova Acao":**
- O botao `DialogTrigger` passa a abrir `isTypeSelectionOpen` ao inves de `isDialogOpen`
- O duplo-clique no calendario tambem abre `isTypeSelectionOpen` (com a data pre-preenchida)

**5. Botao "Voltar" no formulario:**
- No dialog do formulario (etapa 2), adicionar um botao "Voltar" que fecha o formulario e reabre a selecao de tipo
- Permite ao usuario trocar o tipo sem perder os dados ja preenchidos (exceto o tipo)

### Resultado esperado
- Fluxo mais intuitivo: primeiro escolhe O QUE fazer, depois preenche os detalhes
- Dialog de selecao limpo e visual com cards grandes e icones
- Formulario da etapa 2 mais focado, sem a lista de tipos no topo
- Contexto claro do tipo selecionado no cabecalho do formulario
