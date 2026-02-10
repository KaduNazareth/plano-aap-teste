

# Configuracao Dinamica de Campos -- Observacao de Aula

## Resumo

Criar um sistema que permite ao Administrador (N1) ativar/desativar campos do formulario de Observacao de Aula por perfil (N1-N8). Campos desativados nao aparecem na UI, nao sao obrigatorios e sao rejeitados no backend.

## Modelo de Dados

Nova tabela `form_field_config`:

```text
+------------------+----------+----------+---------+----------+------------+------------+
| form_key (text)  | field_key| role     | enabled | required | updated_at | updated_by |
|                  | (text)   | (app_role)| (bool) | (bool)   | (timestampz)| (uuid)    |
+------------------+----------+----------+---------+----------+------------+------------+
| PK: (form_key, field_key, role)                                                       |
+------------------+----------+----------+---------+----------+------------+------------+
```

- `form_key`: sempre `'observacao_aula'` por enquanto (extensivel para outros formularios)
- `field_key`: identificador do campo, ex: `clareza_objetivos`, `dominio_conteudo`, `estrategias_didaticas`, `engajamento_turma`, `gestao_tempo`, `observacoes_professor`, `observacoes_gerais`, `avancos`, `dificuldades`, `turma`
- `role`: um dos valores de `app_role` (admin, gestor, n3_coordenador_programa, etc.)
- `enabled`: se o campo aparece para esse perfil (default: true)
- `required`: se o campo e obrigatorio para esse perfil (default: false)
- RLS: somente N1 pode INSERT/UPDATE/DELETE; todos autenticados podem SELECT

Migracao incluira seed com todos os campos habilitados para todos os perfis que tem acesso a Observacao de Aula.

## Campos do Formulario Observacao de Aula

| field_key | Label | Tipo |
|-----------|-------|------|
| clareza_objetivos | Intencionalidade Pedagogica | Rating 1-5 |
| dominio_conteudo | Estrategias Didaticas | Rating 1-5 |
| estrategias_didaticas | Mediacao Docente | Rating 1-5 |
| engajamento_turma | Engajamento dos Estudantes | Rating 1-5 |
| gestao_tempo | Avaliacao durante a Aula | Rating 1-5 |
| observacoes_professor | Observacoes (por professor) | Texto |
| observacoes_gerais | Observacoes Gerais da Visita | Texto |
| avancos | Avancos Identificados | Texto |
| dificuldades | Dificuldades Encontradas | Texto |
| turma | Turma | Texto |

## Etapas de Implementacao

### 1. Migracao de Banco de Dados

- Criar tabela `form_field_config` com PK composta (form_key, field_key, role)
- RLS: SELECT para todos autenticados; ALL para is_admin
- Seed inicial: inserir linhas para cada combinacao de field_key x role (somente roles com acesso a observacao_aula: admin, gestor, n3, n4_1, n4_2, n5, n6, n7, n8), todos com enabled=true, required=false

### 2. Hook de Dados -- `useFormFieldConfig`

Criar `src/hooks/useFormFieldConfig.ts`:
- Busca `form_field_config` filtrado por `form_key` e `role` do usuario logado
- Cache via React Query com chave `['form_field_config', formKey, role]`
- Exporta funcoes auxiliares: `isFieldEnabled(fieldKey)`, `isFieldRequired(fieldKey)`
- Retorna mapa `Record<string, { enabled: boolean; required: boolean }>`

### 3. Atualizar Formulario de Observacao de Aula

Em `AAPRegistrarAcaoPage.tsx`:
- Importar `useFormFieldConfig('observacao_aula')`
- Envolver cada campo com condicional `isFieldEnabled('field_key')`
- Nas dimensoes de avaliacao, filtrar `dimensoesAvaliacao` para mostrar somente as habilitadas
- No `handleSubmit`, antes de inserir em `avaliacoes_aula`, remover campos desabilitados do payload
- Campos desabilitados recebem valor default (3 para ratings, null para texto) para nao quebrar a estrutura da tabela `avaliacoes_aula`

### 4. Tela Admin -- Configurar Formulario

Criar `src/pages/admin/FormFieldConfigPage.tsx`:
- Somente acessivel por N1
- Tabela com linhas = campos, colunas = perfis (N1-N8)
- Cada celula: toggle de habilitado/desabilitado + badge de obrigatorio
- Ao alterar, faz upsert em `form_field_config`
- Preview rapido: dropdown para selecionar perfil e visualizar como o formulario ficaria
- Rota: `/admin/configurar-formulario`

### 5. Rota e Menu

- Adicionar rota `/admin/configurar-formulario` em `App.tsx`
- Adicionar item no Sidebar admin: "Configurar Formulario" com icone `Settings2` ou `SlidersHorizontal`
- Adicionar em `ALLOWED_ROUTES` do AppLayout somente para admin

### 6. Validacao Backend (Edge Function)

Nao sera necessaria uma edge function separada neste momento. A validacao ocorrera no frontend antes do insert, e os campos desabilitados serao substituidos por valores default antes de salvar. A tabela `avaliacoes_aula` exige todas as colunas de rating (NOT NULL com default 3), entao campos desabilitados serao salvos com o valor default. A RLS existente ja controla o acesso por perfil.

Para protecao extra futura, pode-se criar um trigger `BEFORE INSERT ON avaliacoes_aula` que verifica `form_field_config` e rejeita payloads com campos nao permitidos. Isso sera implementado como trigger SQL na migracao.

## Detalhes Tecnicos

### Estrutura do Hook

```typescript
export function useFormFieldConfig(formKey: string) {
  const { profile } = useAuth();
  const role = profile?.role;

  const { data, isLoading } = useQuery({
    queryKey: ['form_field_config', formKey, role],
    queryFn: async () => {
      const { data } = await supabase
        .from('form_field_config')
        .select('field_key, enabled, required')
        .eq('form_key', formKey)
        .eq('role', role);
      return data;
    },
    enabled: !!role,
  });

  const configMap = useMemo(() => {
    // defaults to enabled if no config found
    ...
  }, [data]);

  return {
    configMap,
    isFieldEnabled: (key: string) => configMap[key]?.enabled ?? true,
    isFieldRequired: (key: string) => configMap[key]?.required ?? false,
    isLoading,
  };
}
```

### Trigger de Validacao (SQL)

```sql
CREATE OR REPLACE FUNCTION validate_avaliacao_fields()
RETURNS TRIGGER AS $$
DECLARE
  user_role app_role;
  field_cfg RECORD;
BEGIN
  SELECT role INTO user_role FROM user_roles WHERE user_id = NEW.aap_id;

  FOR field_cfg IN
    SELECT field_key, enabled FROM form_field_config
    WHERE form_key = 'observacao_aula' AND role = user_role AND enabled = false
  LOOP
    -- Reset disabled fields to default
    IF field_cfg.field_key = 'clareza_objetivos' THEN NEW.clareza_objetivos := 3; END IF;
    IF field_cfg.field_key = 'dominio_conteudo' THEN NEW.dominio_conteudo := 3; END IF;
    -- ... etc for each field
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Tela de Configuracao (Layout)

A pagina tera:
1. Titulo e descricao
2. Tabela matricial: campos (linhas) x perfis (colunas)
3. Cada celula com Switch para enabled + indicador de required
4. Botao "Salvar Alteracoes" com batch upsert
5. Secao "Preview" com select de perfil mostrando quais campos aparecerao

