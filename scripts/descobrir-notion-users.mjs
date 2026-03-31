/**
 * Descobre os Notion User IDs dos responsaveis nas tarefas existentes.
 * Somente leitura.
 * 
 * Para rodar: node scripts/descobrir-notion-users.mjs
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
const NOTION_DB_TAREFAS = env.NOTION_DB_TAREFAS;

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
    console.error(`   ERRO (${response.status}): ${data.message}`);
    return null;
  }
  return data;
}

async function main() {
  console.log('\n Descobrindo Notion User IDs\n');

  // Metodo 1: Listar usuarios do workspace
  console.log('='.repeat(50));
  console.log('  Usuarios do workspace Notion');
  console.log('='.repeat(50) + '\n');

  const users = await notionRequest('/users');
  if (users?.results) {
    for (const user of users.results) {
      const tipo = user.type === 'person' ? 'Pessoa' : 'Bot';
      const email = user.person?.email || user.bot?.owner?.user?.person?.email || '-';
      const nome = user.name || 'Sem nome';
      console.log(`   ${nome}`);
      console.log(`      Tipo: ${tipo}`);
      console.log(`      Email: ${email}`);
      console.log(`      Notion User ID: ${user.id}`);
      console.log();
    }
  }

  // Metodo 2: Extrair dos responsaveis nas tarefas
  console.log('='.repeat(50));
  console.log('  Responsaveis encontrados nas tarefas');
  console.log('='.repeat(50) + '\n');

  let allPages = [];
  let hasMore = true;
  let startCursor = undefined;

  while (hasMore) {
    const body = { page_size: 100 };
    if (startCursor) body.start_cursor = startCursor;
    const result = await notionRequest(`/databases/${NOTION_DB_TAREFAS}/query`, 'POST', body);
    if (!result) break;
    allPages = allPages.concat(result.results);
    hasMore = result.has_more;
    startCursor = result.next_cursor;
  }

  const usersMap = new Map();

  for (const page of allPages) {
    const people = page.properties['Respons\u00e1vel']?.people || [];
    for (const person of people) {
      if (!usersMap.has(person.id)) {
        usersMap.set(person.id, {
          id: person.id,
          nome: person.name || 'Sem nome',
          email: person.person?.email || '-',
        });
      }
    }
  }

  console.log(`   Total de responsaveis unicos: ${usersMap.size}\n`);

  for (const [id, user] of usersMap) {
    console.log(`   ${user.nome}`);
    console.log(`      Email: ${user.email}`);
    console.log(`      Notion User ID: ${id}`);
    console.log();
  }

  // Resumo pra copiar
  console.log('='.repeat(50));
  console.log('  Tabela pronta pra notion_sync_config');
  console.log('='.repeat(50) + '\n');

  console.log('   Email'.padEnd(45) + 'Notion User ID');
  console.log('   ' + '-'.repeat(75));
  for (const [id, user] of usersMap) {
    console.log(`   ${user.email.padEnd(42)} ${id}`);
  }
  console.log();
}

main().catch(err => {
  console.error('\n   Erro inesperado:', err);
  process.exit(1);
});
