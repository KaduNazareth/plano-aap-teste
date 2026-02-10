

## Fase 1 -- Banco de Dados: Novos Roles e Tabela Unificada de Vinculos

Esta fase foca exclusivamente nas alteracoes de banco de dados, sem tocar no frontend ou edge functions.

---

### 1.1 Expandir o enum `app_role`

Adicionar os novos valores ao enum existente, mantendo os antigos para compatibilidade temporaria:

| Valor atual | Novo valor (adicionar) | Descricao |
|---|---|---|
| `admin` | (manter) | N1 Administrador |
| `gestor` | (manter) | N2 Gerente do Programa |
| -- | `n3_coordenador_programa` | N3 Coordenador do Programa |
| -- | `n4_1_cped` | N4.1 Consultor Pedagogico |
| -- | `n4_2_gpi` | N4.2 Gestor de Parceria e Implementacao |
| `aap_inicial` | (manter) | N5 Formador (migrar depois) |
| `aap_portugues` | (manter) | N5 Formador (migrar depois) |
| `aap_matematica` | (manter) | N5 Formador (migrar depois) |
| -- | `n5_formador` | N5 Formador (novo valor unificado) |
| -- | `n6_coord_pedagogico` | N6 Coordenador Pedagogico |
| -- | `n7_professor` | N7 Professor/Vice/Diretor |
| -- | `n8_equipe_tecnica` | N8 Equipe Tecnica SME |

Os valores antigos (`aap_inicial`, `aap_portugues`, `aap_matematica`) serao mantidos nesta fase para nao quebrar o sistema em producao.

---

### 1.2 Criar tabela unificada `user_programas`

Substituir as tabelas separadas `gestor_programas` e `aap_programas` por uma unica tabela:

```text
user_programas
  id          uuid PK
  user_id     uuid NOT NULL
  programa    programa_type NOT NULL
  created_at  timestamptz DEFAULT now()
  UNIQUE(user_id, programa)
```

Migrar dados existentes:
- Copiar `gestor_programas.gestor_user_id` -> `user_programas.user_id`
- Copiar `aap_programas.aap_user_id` -> `user_programas.user_id`

---

### 1.3 Criar tabela unificada `user_entidades`

Renomear conceitualmente `aap_escolas` para uma tabela generica que qualquer role pode usar:

```text
user_entidades
  id          uuid PK
  user_id     uuid NOT NULL
  escola_id   uuid NOT NULL REFERENCES escolas(id)
  created_at  timestamptz DEFAULT now()
  UNIQUE(user_id, escola_id)
```

Migrar dados de `aap_escolas` para `user_entidades`.

---

### 1.4 Novas funcoes helper (security definer)

Criar funcoes auxiliares para os novos roles, evitando recursao no RLS:

- `get_user_role(_user_id uuid) RETURNS app_role` -- ja existe, funciona para novos valores
- `user_has_programa(_user_id uuid, _programa programa_type) RETURNS boolean` -- consulta `user_programas`
- `user_can_view_escola(_user_id uuid, _escola_id uuid) RETURNS boolean` -- consulta `user_entidades` OU admin
- `is_n1_admin` -- alias para `is_admin`
- `is_manager(_user_id uuid) RETURNS boolean` -- retorna true se role IN ('admin', 'gestor', 'n3_coordenador_programa')
- `user_has_escola_access(_user_id uuid, _escola_id uuid) RETURNS boolean` -- verifica via `user_entidades` + `user_programas` + `escolas.programa`

---

### 1.5 Atualizar RLS policies das tabelas principais

Todas as policies que hoje referenciam `gestor_programas`, `aap_programas` ou `aap_escolas` serao atualizadas para usar as novas tabelas e funcoes:

**Tabelas afetadas:**
- `escolas` (3 policies)
- `professores` (12 policies)
- `programacoes` (10 policies)
- `registros_acao` (10 policies)
- `presencas` (8 policies)
- `avaliacoes_aula` (8 policies)
- `user_programas` (nova -- admin ALL, users SELECT own)
- `user_entidades` (nova -- admin/gestor ALL, users SELECT own)

Padrao de policy para cada tabela de dados:
1. Admin (N1): ALL sem restricao
2. Manager (N2/N3): CRUD filtrado por programa via `user_programas`
3. Operacional (N4/N5): CRUD filtrado por programa + entidade via `user_entidades`
4. Local (N6/N7): SELECT e INSERT limitado a propria entidade
5. Observador (N8): SELECT filtrado por programa

---

### 1.6 Manter tabelas antigas como views (compatibilidade)

Para nao quebrar o frontend e edge functions existentes durante a fase de transicao:
- Criar views `gestor_programas_v` e `aap_programas_v` e `aap_escolas_v` que apontam para as novas tabelas
- OU manter as tabelas antigas com triggers de sincronizacao bidirecional

A abordagem recomendada e manter as tabelas antigas intactas nesta fase e usar as novas em paralelo, migrando o frontend na Fase 2.

---

### Resumo de objetos criados nesta fase

| Tipo | Nome | Acao |
|---|---|---|
| Enum | `app_role` | ADD VALUES (5 novos) |
| Tabela | `user_programas` | CREATE + migrar dados |
| Tabela | `user_entidades` | CREATE + migrar dados |
| Funcao | `user_has_programa` | CREATE |
| Funcao | `user_can_view_escola` | CREATE |
| Funcao | `is_manager` | CREATE |
| Funcao | `user_has_escola_access` | CREATE |
| Policies | ~50 policies | DROP + CREATE |

---

### Detalhes tecnicos -- SQL da migracao

A migracao sera um unico arquivo SQL contendo:

1. `ALTER TYPE app_role ADD VALUE` para cada novo role
2. `CREATE TABLE user_programas` com RLS
3. `CREATE TABLE user_entidades` com RLS
4. `INSERT INTO user_programas SELECT ... FROM gestor_programas UNION SELECT ... FROM aap_programas`
5. `INSERT INTO user_entidades SELECT ... FROM aap_escolas`
6. Funcoes helper com `SECURITY DEFINER`
7. DROP + CREATE de todas as policies afetadas usando as novas funcoes

---

### Riscos e mitigacao

- **Risco**: Queries existentes no frontend usam `gestor_programas`/`aap_programas` diretamente
  - **Mitigacao**: Tabelas antigas permanecem intactas; frontend sera atualizado na Fase 2
- **Risco**: Edge Functions referenciam roles antigos (`aap_inicial`, etc.)
  - **Mitigacao**: Enum antigo e mantido; funcoes serao atualizadas na Fase 3
- **Risco**: RLS policies novas podem bloquear acesso existente
  - **Mitigacao**: Policies usam OR para aceitar tanto roles antigos quanto novos

