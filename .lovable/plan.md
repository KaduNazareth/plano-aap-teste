
# Configurar Programas por Acao/Formulario

## Objetivo
Permitir que o Administrador defina para quais Programas (Escolas, Regionais, Redes Municipais) cada instrumento/formulario esta disponivel na pagina de Configuracao de Formularios.

## Solucao

### 1. Migracao de banco de dados

Adicionar uma coluna `programas` (array de `programa_type`) na tabela `form_config_settings` para armazenar quais programas estao habilitados para cada formulario:

```sql
ALTER TABLE public.form_config_settings
  ADD COLUMN programas programa_type[] NOT NULL DEFAULT ARRAY['escolas','regionais','redes_municipais']::programa_type[];
```

O valor padrao inclui todos os programas, mantendo compatibilidade com dados existentes.

### 2. Interface (FormFieldConfigPage.tsx)

Adicionar um bloco de checkboxes logo abaixo do seletor de instrumento, dentro do mesmo card ou em um card proprio:

```text
Programas habilitados:
[x] Escolas   [x] Regionais   [x] Redes Municipais
```

- Cada checkbox alterna a presenca do programa no array `programas`
- As alteracoes sao salvas junto com o botao "Salvar Alteracoes" existente
- O estado local acompanha o campo `programas` do `settingsData`

### 3. Hook (useFormFieldConfig.ts)

Atualizar o `useFormFieldConfig` (hook de leitura) para tambem retornar o campo `programas` do `form_config_settings`, permitindo que as paginas de registro filtrem instrumentos indisponiveis para o programa selecionado.

### 4. Logica de salvamento

No `saveSettingsMutation` existente, incluir o campo `programas` no upsert junto com `min_optional_questions`.

## Detalhes Tecnicos

### Arquivo: Migracao SQL
- `ALTER TABLE form_config_settings ADD COLUMN programas programa_type[]`

### Arquivo: `src/pages/admin/FormFieldConfigPage.tsx`
- Adicionar estado `programas` (array de strings) sincronizado com `settingsData`
- Renderizar 3 checkboxes (Escolas, Regionais, Redes Municipais) no card de configuracoes
- Incluir `programas` na mutacao de save

### Arquivo: `src/hooks/useFormFieldConfig.ts`
- Incluir `programas` no select do `useFormFieldConfig`
- Retornar `programas` para uso nas paginas de registro

### Validacao
- Pelo menos 1 programa deve estar selecionado (desabilitar o ultimo checkbox restante)
- Formularios sem registro em `form_config_settings` assumem todos os programas habilitados (default)
