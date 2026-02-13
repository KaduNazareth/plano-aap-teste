
# Atualizar dados do grafico "Acoes Previstas x Realizadas - Por Ator do Programa"

## Problema

O grafico atual busca apenas usuarios com roles legados (`aap_inicial`, `aap_portugues`, `aap_matematica`) da tabela `aap_programas`. Os novos perfis N2 a N5 nao aparecem no grafico, ja que seus programas estao na tabela `user_programas`.

## Alteracoes no arquivo `src/pages/admin/AdminDashboard.tsx`

### 1. Renomear titulo (linhas 661-663)
- Comentario: `{/* By AAP */}` para `{/* By Ator do Programa */}`
- Titulo: `Acoes Previstas x Realizadas por AAP` para `Acoes Previstas x Realizadas - Por Ator do Programa`

### 2. Expandir busca de atores (linhas 167-186)

Adicionar ao `Promise.all`:
- Buscar roles N2-N5 alem dos legados: incluir `'gestor'`, `'n3_coordenador_programa'`, `'n4_1_cped'`, `'n4_2_gpi'`, `'n5_formador'` na query de `user_roles`
- Buscar `user_programas` (programas dos novos perfis) alem de `aap_programas`

```typescript
// Antes (linha 179):
supabase.from('user_roles').select('user_id').in('role', ['aap_inicial', 'aap_portugues', 'aap_matematica']),

// Depois:
supabase.from('user_roles').select('user_id, role').in('role', [
  'gestor', 'n3_coordenador_programa', 'n4_1_cped', 'n4_2_gpi', 'n5_formador',
  'aap_inicial', 'aap_portugues', 'aap_matematica'
]),
```

Adicionar fetch de `user_programas`:
```typescript
supabase.from('user_programas').select('user_id, programa'),
```

### 3. Atualizar mapeamento de atores com programas (linhas 207-215)

Combinar programas de `aap_programas` E `user_programas` para cada ator:

```typescript
const aapsWithProgramas: AAPWithPrograma[] = (rolesRes.data || []).map(role => {
  // Programas legados (aap_programas)
  const legacyProgramas = (aapProgramasRes.data || [])
    .filter(p => p.aap_user_id === role.user_id)
    .map(p => p.programa as ProgramaType);
  // Programas novos (user_programas)
  const newProgramas = (userProgramasRes.data || [])
    .filter(p => p.user_id === role.user_id)
    .map(p => p.programa as ProgramaType);
  // Combinar sem duplicatas
  const programas = [...new Set([...legacyProgramas, ...newProgramas])];
  const profileItem = profilesData.find(p => p.id === role.user_id);
  return { user_id: role.user_id, programas, nome: profileItem?.nome || 'Ator' };
});
```

### 4. Renomear variavel interna (opcional mas recomendado)

Renomear `acoesPorAAP` para `acoesPorAtor` em todas as referencias (~6 ocorrencias) para clareza do codigo. Tambem renomear `filteredAAPs` para `filteredAtores`, `totalAAPs` para `totalAtores`, e o state `aaps`/`setAaps` para `atores`/`setAtores`.

Alternativamente, manter os nomes internos e so alterar o titulo visivel para minimizar a quantidade de mudancas. Optaremos por manter nomes internos para reduzir risco de erros.

### Resumo

| Aspecto | Antes | Depois |
|---|---|---|
| Titulo do grafico | "por AAP" | "- Por Ator do Programa" |
| Roles buscados | 3 legados | 3 legados + 5 novos (N2-N5) |
| Fonte de programas | Apenas `aap_programas` | `aap_programas` + `user_programas` |
| Nome padrao fallback | "AAP" | "Ator" |
