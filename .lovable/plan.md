
# Habilitar importação em lote de Atores Educacionais para N2 a N4

## Contexto

Atualmente, o botão "Importar" na página de Atores Educacionais (`/professores`) aparece apenas para **Admin (N1) e Gestor (N2)**, controlado pela condição `isAdminOrGestor`.

O pedido é estender essa permissão para incluir **N3 (Coordenador do Programa)** e **N4 (CPed e GPI)**.

## Solução

Alterar **apenas** `src/pages/admin/ProfessoresPage.tsx`:

### 1. Criar variável de permissão para importação

Usar o `useAuth()` para verificar se o usuário é N1-N4:

```typescript
const canBatchImport = isAdminOrGestor || 
  userProfile?.role === 'n3_coordenador_programa' || 
  userProfile?.role === 'n4_1_cped' || 
  userProfile?.role === 'n4_2_gpi';
```

### 2. Substituir a condição `isAdminOrGestor` no botão de importação

Na linha 984:
- **Antes**: `{isAdminOrGestor && (`
- **Depois**: `{canBatchImport && (`

### 3. Substituir a condição `isAdminOrGestor` no botão de exportação

Na linha 1041:
- **Antes**: `{isAdminOrGestor && (`
- **Depois**: `{canBatchImport && (`

## Segurança

As policies RLS da tabela `professores` ja permitem INSERT para perfis operacionais (N4/N5) vinculados a entidades e para managers (N2/N3) vinculados a programas. Portanto, **nenhuma alteracao de banco é necessária** — a permissão de escrita ja existe no backend.

## Resumo

| Item | Detalhe |
|---|---|
| Arquivo alterado | `src/pages/admin/ProfessoresPage.tsx` |
| Alteração | Criar `canBatchImport` e usar nos botões de importar/exportar |
| Migração | Não necessária |
| Impacto | N3 e N4 passam a ver e usar os botões de importação/exportação em lote |
