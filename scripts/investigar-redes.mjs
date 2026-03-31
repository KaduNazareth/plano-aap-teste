/**
 * INVESTIGACAO: Mapeamento Rede (Notion) <-> Entidade (Supabase)
 * 
 * Somente leitura. Identifica:
 * 1. Todas as Redes no database "Perfil das Redes Municipais"
 * 2. Todas as Entidades (escolas) no Supabase
 * 3. Mostra as duas listas pra gerar o mapeamento
 * 
 * Para rodar: node scripts/investigar-redes.mjs
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '.env.notion');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  if (line.startsWith('#') || !line.includes('=')) return;
  const [key, ...rest] = line.split('=');
  env[key.trim()] = rest.join('=').trim();
});

const NOTION_API_KEY = env.NOTION_API_KEY;
const NOTION_DB_PERFIL_REDES = env.NOTION_DB_PERFIL_REDES;
const NOTION_DB_TAREFAS = env.NOTION_DB_TAREFAS;
const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY;

async function notionRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${NOTION_API_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
  };
  if (body) options.body = JSON.stringify(body);
  const response = await fetch(`https://api.notion.com/v1${endpoint}`, options);
  const data = await response.json();
  if (!response.ok) {
    console.error(`   ERRO Notion (${response.status}): ${data.message}`);
    return null;
  }
  return data;
}

async function supabaseGet(table, params = '') {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!response.ok) {
    const text = await response.text();
    console.error(`   ERRO Supabase GET (${response.status}): ${text}`);
    return null;
  }
  return response.json();
}

async function main() {
  console.log('\n Investigacao: Mapeamento Rede <-> Entidade\n');

  // 1. Ler estrutura do campo "Rede" no database Tarefas
  console.log('='.repeat(60));
  console.log('  1. Estrutura do campo "Rede" em (Redes) Tarefas');
  console.log('='.repeat(60) + '\n');

  const dbTarefas = await notionRequest(`/databases/${NOTION_DB_TAREFAS}`);
  if (dbTarefas) {
    const redeProp = dbTarefas.properties['Rede'];
    if (redeProp) {
      console.log(`   Tipo: ${redeProp.type}`);
      if (redeProp.relation) {
        console.log(`   Database vinculado: ${redeProp.relation.database_id}`);
        console.log(`   Tipo de relacao: ${redeProp.relation.type}`);
        if (redeProp.relation.single_property) {
          console.log(`   Single property: ${JSON.stringify(redeProp.relation.single_property)}`);
        }
        if (redeProp.relation.dual_property) {
          console.log(`   Dual property: ${JSON.stringify(redeProp.relation.dual_property)}`);
        }
      }
    } else {
      console.log('   Campo "Rede" NAO encontrado!');
    }
  }

  // 2. Ler todas as paginas do "Perfil das Redes Municipais"
  console.log('\n' + '='.repeat(60));
  console.log('  2. Redes no Notion (Perfil das Redes Municipais)');
  console.log('='.repeat(60) + '\n');

  let allRedes = [];
  let hasMore = true;
  let startCursor = undefined;

  while (hasMore) {
    const body = { page_size: 100 };
    if (startCursor) body.start_cursor = startCursor;
    const result = await notionRequest(`/databases/${NOTION_DB_PERFIL_REDES}/query`, 'POST', body);
    if (!result) break;
    allRedes = allRedes.concat(result.results);
    hasMore = result.has_more;
    startCursor = result.next_cursor;
  }

  console.log(`   Total de Redes no Notion: ${allRedes.length}\n`);

  const redesNotion = [];
  for (const page of allRedes) {
    const props = page.properties;
    let nome = '';
    for (const [key, prop] of Object.entries(props)) {
      if (prop.type === 'title' && prop.title?.length > 0) {
        nome = prop.title.map(t => t.plain_text).join('');
        break;
      }
    }
    redesNotion.push({ id: page.id, nome });
    console.log(`   ${nome.padEnd(40)} ID: ${page.id}`);
  }

  // 3. Ler entidades do Supabase
  console.log('\n' + '='.repeat(60));
  console.log('  3. Entidades (escolas) no Supabase de teste');
  console.log('='.repeat(60) + '\n');

  const escolas = await supabaseGet('escolas', 'select=id,nome,programa&order=nome');
  if (escolas?.length) {
    for (const e of escolas) {
      console.log(`   ${e.nome.padEnd(45)} ID: ${e.id}`);
      console.log(`   ${' '.repeat(45)} Programa: ${e.programa?.join(', ') || 'nenhum'}`);
    }
  } else {
    console.log('   Nenhuma escola encontrada no Supabase de teste.');
    console.log('   (Na producao havera escolas como "Rede Municipal de Araraquara")');
  }

  // 4. Verificar como uma tarefa existente usa o campo Rede
  console.log('\n' + '='.repeat(60));
  console.log('  4. Exemplo: como tarefas usam o campo "Rede"');
  console.log('='.repeat(60) + '\n');

  const tarefasComRede = await notionRequest(`/databases/${NOTION_DB_TAREFAS}/query`, 'POST', {
    page_size: 5,
    filter: {
      property: 'Rede',
      relation: { is_not_empty: true },
    },
  });

  if (tarefasComRede?.results?.length) {
    for (const page of tarefasComRede.results.slice(0, 3)) {
      const props = page.properties;
      const titulo = props['Tarefa']?.title?.map(t => t.plain_text).join('') || 'Sem titulo';
      const redeRelations = props['Rede']?.relation || [];

      console.log(`   Tarefa: "${titulo}"`);
      console.log(`   Rede vinculada (IDs): ${redeRelations.map(r => r.id).join(', ')}`);

      // Resolver nomes
      for (const rel of redeRelations) {
        const match = redesNotion.find(r => r.id === rel.id);
        console.log(`      -> ${match?.nome || 'Nome nao encontrado'} (${rel.id})`);
      }
      console.log();
    }
  } else {
    console.log('   Nenhuma tarefa com Rede vinculada encontrada.');
  }

  // 5. Proposta de mapeamento
  console.log('='.repeat(60));
  console.log('  5. Proposta de mapeamento');
  console.log('='.repeat(60) + '\n');

  console.log('   Para vincular a Rede ao sincronizar, precisamos de um');
  console.log('   mapeamento entre o page_id do Notion e o escola_id do Supabase.');
  console.log('   Exemplo:\n');
  console.log('   Notion (Rede)                  Supabase (Entidade)');
  console.log('   ' + '-'.repeat(55));

  for (const rede of redesNotion) {
    console.log(`   ${rede.nome.padEnd(33)} -> Rede Municipal de ${rede.nome}`);
  }

  console.log(`\n   Total de mapeamentos necessarios: ${redesNotion.length}`);
  console.log('   Esses mapeamentos podem ser salvos numa tabela ou');
  console.log('   num objeto de configuracao no script de sync.\n');
}

main().catch(err => {
  console.error('\n   Erro inesperado:', err);
  process.exit(1);
});
