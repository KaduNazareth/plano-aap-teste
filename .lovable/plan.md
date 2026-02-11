

## Corrigir Permissoes do Administrador na Matriz de Acoes

### Problema
Na matriz de permissoes, o tipo de acao "Formulario de Avaliacao (Participante)" (`avaliacao_formacao_participante`) esta configurado com `NONE` para o Administrador (N1). Isso significa que o admin nao pode visualizar, criar, editar ou excluir esse tipo de acao, o que contradiz a regra de que o Administrador tem acesso total a tudo.

### Solucao

Atualizar uma unica linha em `src/config/acaoPermissions.ts` (linha 194):

**De:**
```
NONE, NONE, NONE, NONE, NONE, NONE, CR_OWN, CR_OWN, CR_PRG
```

**Para:**
```
CRUD_ALL, NONE, NONE, NONE, NONE, NONE, CR_OWN, CR_OWN, CR_PRG
```

Isso dara ao Administrador permissao completa (criar, editar, excluir, visualizar todos) no formulario de avaliacao do participante, mantendo as permissoes dos demais perfis inalteradas.

### Impacto
- O admin passara a ver os icones de Visualizar, Criar, Editar e Excluir na coluna N1 para "Formulario de Avaliacao (Participante)" na pagina Matriz de Acoes
- O admin podera criar, editar e excluir esse tipo de registro nas demais telas do sistema
- Nenhuma outra permissao e afetada

