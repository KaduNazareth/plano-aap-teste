

# Pontos Observados - Acesso N1 a N4.2 com filtros por escopo

## Resumo

Tornar a pagina `/pontos-observados` acessivel para os niveis N1 ate N4.2 (excluindo N5 em diante), aplicando filtros de programa, entidade e acao de acordo com o escopo de cada perfil.

## 1. Adicionar rota ao ALLOWED_ROUTES (AppLayout.tsx)

Adicionar `/pontos-observados` nas listas de rotas permitidas para os tiers `manager` e `operational`:

- **manager** (N2, N3): adicionar `/pontos-observados`
- **operational** (N4.1, N4.2, N5): adicionar `/pontos-observados` — o controle fino (excluir N5) sera feito na pagina e no menu

## 2. Adicionar ao menu do operational com filtro de role (Sidebar.tsx)

O `operationalMenuItems` e estatico e atende N4.1, N4.2 e N5. Para exibir "Pontos Observados" apenas para N4.1 e N4.2:

- Alterar `getMenuItems` para receber o role do usuario
- Quando tier for `operational`, filtrar o item "Pontos Observados" se o role for `n5_formador`

Alternativa mais simples: adicionar o item ao array `operationalMenuItems` e filtrar dinamicamente em `SidebarContent` com base no `profile.role`, removendo o item para N5.

## 3. Aplicar escopo de dados na PontosObservadosPage.tsx

Atualmente a pagina carrega **todas** as formacoes realizadas sem restricao. Precisa aplicar:

### N1 (admin)
- Sem restricao — ve tudo

### N2 / N3 (manager)
- Filtrar por `user_programas` do usuario logado
- As formacoes retornadas devem ter `programa` intersectando com os programas do usuario
- O filtro de Programa no UI deve mostrar apenas os programas vinculados

### N4.1 / N4.2 (operational)
- Filtrar por `user_entidades` e `user_programas` do usuario logado
- As formacoes retornadas devem pertencer as entidades (escolas) vinculadas ao usuario
- Filtro de Programa mostra apenas os programas vinculados
- Filtro de Formador pode ser restringido ou nao (manter aberto dentro do escopo de entidades)

### Bloqueio N5
- Se o role for `n5_formador`, redirecionar para a rota padrao ou exibir mensagem de acesso negado

### Implementacao

No `useEffect` de carga inicial:
1. Buscar `user_programas` e `user_entidades` do usuario logado (se nao for admin)
2. Filtrar as `programacoes` retornadas com base nos programas e/ou escola_ids do usuario
3. Restringir opcoes do filtro de Programa aos programas vinculados

## Detalhes tecnicos

| Arquivo | Alteracao |
|---|---|
| `src/components/layout/AppLayout.tsx` | Adicionar `/pontos-observados` aos arrays de `manager` e `operational` |
| `src/components/layout/Sidebar.tsx` | Adicionar item ao `operationalMenuItems` e filtrar N5 dinamicamente em `SidebarContent` |
| `src/pages/admin/PontosObservadosPage.tsx` | Adicionar logica de escopo: buscar `user_programas`/`user_entidades`, filtrar formacoes, restringir filtro de Programa. Bloquear N5. |

### Logica de escopo (pseudocodigo)

```text
if admin:
  load all
elif manager (N2/N3):
  userPrograms = fetch user_programas where user_id = profile.id
  filter programacoes where programa intersects userPrograms
elif operational (N4.1/N4.2):
  userPrograms = fetch user_programas where user_id = profile.id
  userEntidades = fetch user_entidades where user_id = profile.id
  filter programacoes where escola_id in userEntidades AND programa intersects userPrograms
elif n5_formador:
  redirect / block access
```

Nenhuma migracao de banco necessaria.

