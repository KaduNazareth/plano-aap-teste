

## Atribuir ator diferente ao Acompanhamento de Formacao

### Problema atual
Quando o acompanhamento e agendado no dialog de gerenciamento, o sistema usa o mesmo `aap_id` da formacao original. O correto e que o ator do acompanhamento seja diferente do ator da formacao, e deve ser selecionado no momento do agendamento.

### Alteracoes em `src/pages/admin/ProgramacaoPage.tsx`

#### 1. Novo estado para o ator do acompanhamento
- Adicionar estado `acompanhamentoAapId: string` para armazenar o ator selecionado
- Resetar esse estado junto com os demais no `handleManage`

#### 2. Buscar atores elegiveis quando o checkbox de acompanhamento e marcado
- Quando `agendarAcompanhamento` for ativado, buscar usuarios com roles N1-N5 (`admin`, `gestor`, `n3_coordenador_programa`, `n4_1_cped`, `n4_2_gpi`, `n5_formador`, `aap_inicial`, `aap_portugues`, `aap_matematica`) que:
  - Pertencem a pelo menos um dos programas da formacao (`user_programas` ou `aap_programas`)
  - Atuam na entidade da formacao (`user_entidades` ou `aap_escolas`)
  - **Nao sao** o ator da formacao original (`aap_id` diferente)
- Reutilizar os dados ja carregados em `aaps` (que contem AAPs com programas e escolas) e complementar com uma consulta adicional para users N1-N3 vinculados a entidade/programa

#### 3. Exibir seletor de ator no formulario de acompanhamento
- Dentro do bloco condicional `{agendarAcompanhamento && (...)}`, adicionar um `Select` com label "Ator Responsavel *" antes dos campos de data/horario
- As opcoes mostram nome e cargo do usuario
- O ator da formacao original e excluido da lista

#### 4. Validacao no submit
- Na validacao do `handleManageSubmit`, verificar que `acompanhamentoAapId` esta preenchido quando `agendarAcompanhamento` e `true`
- No insert de `programacoes` e `registros_acao` do acompanhamento, usar `acompanhamentoAapId` no lugar de `selectedProgramacao.aap_id`

### Detalhes tecnicos

**Novo estado:**
```text
acompanhamentoAapId: string  -- ID do ator selecionado para o acompanhamento
```

**Lista de atores elegiveis:**
- Consultar `user_roles` para roles: admin, gestor, n3_coordenador_programa, n4_1_cped, n4_2_gpi, n5_formador, aap_inicial, aap_portugues, aap_matematica
- Cruzar com `user_programas`/`aap_programas` para filtrar por programa
- Cruzar com `user_entidades`/`aap_escolas` para filtrar por entidade
- Excluir o `aap_id` da formacao original da lista
- Buscar nomes via `profiles`

**Campos alterados no insert:**
- `programacoes.aap_id` -> `acompanhamentoAapId`
- `registros_acao.aap_id` -> `acompanhamentoAapId`

**Arquivo modificado:**
- `src/pages/admin/ProgramacaoPage.tsx` - unico arquivo alterado

