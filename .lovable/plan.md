
# Correção: "Gerenciar Presenças" na RegistrosPage não exibe atores administrativos

## Diagnóstico

O modal "Gerenciar Presenças" é aberto via `handleOpenManage` que chama `getAvailableProfessors` (linhas 428–453 de `RegistrosPage.tsx`).

O problema está na função `getAvailableProfessors`, bloco de formação (linhas 431–443):

```typescript
return professores.filter(p => {
  if (p.escola_id !== registro.escola_id) return false;
  if (p.componente !== registro.componente) return false;  // ← PROBLEMA AQUI
  if (registro.segmento !== 'todos' && p.segmento !== registro.segmento) return false;
  if (registro.ano_serie !== 'todos' && p.ano_serie !== registro.ano_serie) return false;
  // filtro por cargo já existe (correto)
  const programacao = programacoes.find(prog => prog.id === registro.programacao_id);
  const tipoAtor = programacao?.tipo_ator_presenca;
  if (tipoAtor && tipoAtor !== 'todos') {
    if (p.cargo !== tipoAtor) return false;
  }
  return true;
});
```

A linha `if (p.componente !== registro.componente) return false` **sempre filtra por componente**, antes mesmo de verificar o `tipo_ator_presenca`. Coordenadores e diretores têm `componente = 'nao_se_aplica'`, então são eliminados imediatamente — o filtro por cargo nunca chega a ser avaliado para eles.

A mesma lógica condicional aplicada em `ListaPresencaPage.tsx` precisa ser aplicada aqui.

## Solução

Alterar **apenas** a função `getAvailableProfessors` em `src/pages/admin/RegistrosPage.tsx` (linhas 428–453):

### Antes

```typescript
if (registro.tipo === 'formacao') {
  return professores.filter(p => {
    if (p.escola_id !== registro.escola_id) return false;
    if (p.componente !== registro.componente) return false;   // ← sem condição
    if (registro.segmento !== 'todos' && p.segmento !== registro.segmento) return false;
    if (registro.ano_serie !== 'todos' && p.ano_serie !== registro.ano_serie) return false;
    const programacao = programacoes.find(prog => prog.id === registro.programacao_id);
    const tipoAtor = programacao?.tipo_ator_presenca;
    if (tipoAtor && tipoAtor !== 'todos') {
      if (p.cargo !== tipoAtor) return false;
    }
    return true;
  });
}
```

### Depois

```typescript
if (registro.tipo === 'formacao') {
  const programacao = programacoes.find(prog => prog.id === registro.programacao_id);
  const tipoAtor = programacao?.tipo_ator_presenca;
  const isCargoAdministrativo = tipoAtor && tipoAtor !== 'todos' && tipoAtor !== 'professor';

  return professores.filter(p => {
    if (p.escola_id !== registro.escola_id) return false;
    // Filtro por componente: apenas se o alvo for professor (admins têm 'nao_se_aplica')
    if (!isCargoAdministrativo && p.componente !== registro.componente) return false;
    // Filtro por segmento: apenas se o alvo for professor
    if (!isCargoAdministrativo && registro.segmento !== 'todos' && p.segmento !== registro.segmento) return false;
    // Filtro por ano_serie: apenas se o alvo for professor
    if (!isCargoAdministrativo && registro.ano_serie !== 'todos' && p.ano_serie !== registro.ano_serie) return false;
    // Filtro por cargo
    if (tipoAtor && tipoAtor !== 'todos' && p.cargo !== tipoAtor) return false;
    return true;
  });
}
```

## Resumo

| Item | Detalhe |
|---|---|
| Causa raiz | Filtro por `componente` aplicado incondicionalmente, eliminando atores administrativos (coordenador, diretor, vice-diretor) antes de verificar o cargo |
| Solução | Tornar os filtros de `componente`, `segmento` e `ano_serie` condicionais ao tipo de ator — igual ao que foi feito em `ListaPresencaPage.tsx` |
| Arquivo alterado | `src/pages/admin/RegistrosPage.tsx` somente |
| Linhas afetadas | 428–453 (função `getAvailableProfessors`) |
| Migração de banco | Não necessária |
