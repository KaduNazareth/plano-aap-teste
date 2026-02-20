
# Correções no Dashboard: Atores Educacionais e Contagem de Consultores

## Problema 1 — Substituir "Professores" e "Coordenadores" por "Atores Educacionais"

Atualmente o dashboard exibe dois cards separados:
- **Professores** → conta `filteredProfessores.length` (todos os registros da tabela `professores`)
- **Coordenadores** → conta `filteredProfessores.filter(p => p.cargo === 'coordenador').length`

A tabela `professores` já armazena todos os atores educacionais locais (Professor, Coordenador, Vice-Diretor, Diretor, Equipe Técnica SME), portanto um único card "Atores Educacionais" com `totalProfessores` é a representação correta.

**Mudança na UI (linhas 563–589 aproximadamente):**
- Remover os dois cards separados ("Professores" e "Coordenadores")
- Adicionar um único card "Atores Educacionais" com `value={totalProfessores}` e link para `/professores`
- Remover a variável `totalCoordenadores` que ficará sem uso
- Ajustar o `grid-cols` da seção de stats (reduz de 6 para 5 colunas no máximo)

## Problema 2 — Contagem duplicada de "Consultores / Gestores / Formadores"

**Causa raiz:** A query `rolesRes` retorna todas as linhas da tabela `user_roles` para os papéis listados. Como um usuário pode ter múltiplos papéis (ex: `n4_1_cped` e `n4_2_gpi`), o mesmo `user_id` aparece várias vezes. O array `aapsWithProgramas` é construído com `.map()` sobre essas linhas, criando um objeto por linha — não por usuário.

```typescript
// PROBLEMA: rolesRes.data tem uma linha por papel, não por usuário
const aapsWithProgramas: AAPWithPrograma[] = (rolesRes.data || []).map(role => {
  // Se user_id aparece 3x (3 papéis), cria 3 entradas
  ...
});
```

**Solução:** Deduplificar por `user_id` antes de criar `aapsWithProgramas`:

```typescript
// Agrupar roles por user_id (deduplicar)
const uniqueUserIds = [...new Set((rolesRes.data || []).map(r => r.user_id))];

const aapsWithProgramas: AAPWithPrograma[] = uniqueUserIds.map(userId => {
  const legacyProgramas = (aapProgramasRes.data || [])
    .filter(p => p.aap_user_id === userId)
    .map(p => p.programa as ProgramaType);
  const newProgramas = (userProgramasRes.data || [])
    .filter(p => p.user_id === userId)
    .map(p => p.programa as ProgramaType);
  const programas = [...new Set([...legacyProgramas, ...newProgramas])];
  const profileItem = profilesData.find(p => p.id === userId);
  return { user_id: userId, programas, nome: profileItem?.nome || 'Ator' };
});
```

Isso garante que cada usuário único seja contado apenas uma vez, independente de quantos papéis ele possua.

## Resumo das alterações

| Arquivo | Mudança |
|---|---|
| `src/pages/admin/AdminDashboard.tsx` | 1. Substituir cards "Professores" + "Coordenadores" por card único "Atores Educacionais" |
| `src/pages/admin/AdminDashboard.tsx` | 2. Deduplificar `aapsWithProgramas` por `user_id` para corrigir a contagem |
| `src/pages/admin/AdminDashboard.tsx` | 3. Remover variável `totalCoordenadores` (sem uso) |
| `src/pages/admin/AdminDashboard.tsx` | 4. Ajustar `grid-cols` do stats grid (de `lg:grid-cols-6` para `lg:grid-cols-5`) |

Apenas **um arquivo** é alterado e **nenhuma migração** de banco de dados é necessária.
