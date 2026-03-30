

# Ajustar modelo de upload em lote para informar valores válidos de Papel e Programa

## Problema

O modelo CSV e as instruções do dialog de cadastro em lote mostram apenas 5 papéis antigos (admin, gestor, aap_inicial, aap_portugues, aap_matematica), ignorando os papéis N3-N8 que existem no sistema. O usuário não sabe quais valores usar.

## Solução

### Arquivo: `src/components/users/BatchUserUploadDialog.tsx`

1. **Expandir `roleMapping`** para incluir todos os papéis N1-N8:
   - `n3_coordenador_programa`, `n4_1_cped`, `n4_2_gpi`, `n5_formador`, `n6_coord_pedagogico`, `n7_professor`, `n8_equipe_tecnica`
   - Manter os mapeamentos legados existentes

2. **Expandir `roleLabels`** com os rótulos de todos os papéis

3. **Atualizar `AppRole` type** local para incluir todos os papéis

4. **Atualizar as instruções** na tela (seção `<ul>`) para listar claramente os valores aceitos em formato tabular ou lista:
   - Papel: `admin`, `gestor`, `n3_coordenador_programa`, `n4_1_cped`, `n4_2_gpi`, `n5_formador`, `n6_coord_pedagogico`, `n7_professor`, `n8_equipe_tecnica`
   - Programa: `escolas`, `regionais`, `redes_municipais`

5. **Atualizar o template CSV** (`downloadTemplate`) para incluir exemplos com os novos papéis e uma aba/comentário de referência com todos os valores possíveis

6. **Ajustar validação** de papéis que exigem programa (ROLES_WITH_PROGRAMAS) para usar a mesma lógica do roleConfig

## Resultado

O usuário baixa o modelo e vê claramente todos os valores válidos para Papel e Programa, tanto no arquivo quanto nas instruções da tela.

