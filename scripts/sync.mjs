/**
 * SYNC BIDIRECIONAL — Plataforma AAP <-> Notion
 * 
 * Campos sincronizados: Titulo, Descricao, Data, Status, Rede, Responsavel
 * 
 * Uso:
 *   node scripts/sync.mjs              Sync completo (ambas direcoes)
 *   node scripts/sync.mjs --supabase   Somente Supabase -> Notion
 *   node scripts/sync.mjs --notion     Somente Notion -> Supabase
 *   node scripts/sync.mjs --watch      Sync automatico a cada 60s
 *   node scripts/sync.mjs --watch 30   Sync automatico a cada 30s
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
const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY;

// ============================================================
// CONFIGURACAO DE TIPOS A SINCRONIZAR
// ============================================================

const TIPOS_PARA_SINCRONIZAR = [
  'formacao',
  // 'acompanhamento_formacoes',
  // 'participa_formacoes',
  // 'encontro_eteg_redes',
  // 'encontro_professor_redes',
  // 'lista_presenca',
  // 'observacao_aula',
  // 'observacao_aula_redes',
  // 'devolutiva_pedagogica',
  // 'obs_engajamento_solidez',
  // 'obs_implantacao_programa',
  // 'obs_uso_dados',
  // 'qualidade_acomp_aula',
  // 'agenda_gestao',
  // 'autoavaliacao',
  // 'qualidade_implementacao',
  // 'qualidade_atpcs',
  // 'sustentabilidade_programa',
  // 'avaliacao_formacao_participante',
];

// ============================================================
// MAPEAMENTO DE REDES: Supabase (nome da escola) -> Notion (page ID)
// ============================================================

const REDE_SUPABASE_TO_NOTION = {
  'Rede Municipal de Araraquara':           '32d6e2c7-d2c9-81e5-8070-faf0f3b6ccc6',
  'Rede Municipal de Bebedouro':            '32d6e2c7-d2c9-81f8-bf38-e9f898f6a14f',
  'Rede Municipal de Bertioga':             '32d6e2c7-d2c9-812b-8f05-f156415900d1',
  'Rede Municipal de Caraguatatuba':        '32d6e2c7-d2c9-8193-97f9-c0cac8f2677a',
  'Rede Municipal de Descalvado':           '32d6e2c7-d2c9-81b9-9cd0-cca874194741',
  'Rede Municipal de Esp\u00edrito Santo do Pinhal': '32d6e2c7-d2c9-8120-acdc-f7dfa740f70a',
  'Rede Municipal de Itaquaquecetuba':      '32d6e2c7-d2c9-8115-910e-f0d1a476fbf3',
  'Rede Municipal de Jarinu':               '32d6e2c7-d2c9-81a1-926a-f03bae74e495',
  'Rede Municipal de Santos (SME)':         '32d6e2c7-d2c9-819a-beeb-eb387d8a1651',
  'Rede Municipal de Santos (URE)':         '32d6e2c7-d2c9-8165-8cd4-d0e88799484f',
};

const REDE_NOTION_TO_SUPABASE = {};
for (const [nome, pageId] of Object.entries(REDE_SUPABASE_TO_NOTION)) {
  REDE_NOTION_TO_SUPABASE[pageId] = nome;
}

// ============================================================
// Mapeamentos de status e tipo
// ============================================================

const STATUS_TO_NOTION = {
  'prevista': 'A fazer',
  'agendada': 'A fazer',
  'realizada': 'Conclu\u00edda',
  'cancelada': 'Inativa',
};

const STATUS_TO_SUPABASE = {
  'A fazer': 'prevista',
  'Pendente': 'prevista',
  'Pausada': 'prevista',
  'Em andamento': 'prevista',
  'Inativa': 'cancelada',
  'Conclu\u00edda': 'realizada',
};

const TIPO_TO_NOTION = {
  'formacao': 'Forma\u00e7\u00e3o',
  'acompanhamento_formacoes': 'Forma\u00e7\u00e3o',
  'participa_formacoes': 'Forma\u00e7\u00e3o',
  'encontro_eteg_redes': 'Forma\u00e7\u00e3o',
  'encontro_professor_redes': 'Forma\u00e7\u00e3o',
  'lista_presenca': 'Forma\u00e7\u00e3o',
  'observacao_aula': 'Visitas',
  'observacao_aula_redes': 'Visitas',
  'visita': 'Visitas',
  'devolutiva_pedagogica': 'Visitas',
  'obs_engajamento_solidez': 'Visitas',
  'obs_implantacao_programa': 'Visitas',
  'obs_uso_dados': 'Visitas',
  'qualidade_acomp_aula': 'Visitas',
  'agenda_gestao': 'Reuni\u00e3o',
  'autoavaliacao': 'Tarefa',
  'qualidade_implementacao': 'Tarefa',
  'qualidade_atpcs': 'Tarefa',
  'sustentabilidade_programa': 'Tarefa',
  'avaliacao_formacao_participante': 'Tarefa',
};

const TIPO_FROM_NOTION = {};
for (const [supa, notion] of Object.entries(TIPO_TO_NOTION)) {
  if (!TIPO_FROM_NOTION[notion]) TIPO_FROM_NOTION[notion] = supa;
}

// ============================================================
// Helpers
// ============================================================

function timestamp() {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function log(msg) {
  console.log(`   ${msg}`);
}

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
    log(`ERRO Notion (${response.status}): ${data.message}`);
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
    log(`ERRO Supabase GET (${response.status}): ${text}`);
    return null;
  }
  return response.json();
}

async function supabaseInsert(table, data) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const text = await response.text();
    log(`ERRO Supabase INSERT (${response.status}): ${text}`);
    return null;
  }
  return response.json();
}

async function supabaseUpdate(table, id, data) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const text = await response.text();
    log(`ERRO Supabase UPDATE (${response.status}): ${text}`);
    return null;
  }
  return response.json();
}

// ============================================================
// Caches
// ============================================================

let escolasCache = null;
let syncConfigCache = null;

async function getEscolas() {
  if (escolasCache) return escolasCache;
  escolasCache = await supabaseGet('escolas', 'select=id,nome') || [];
  return escolasCache;
}

async function getEscolaNome(escolaId) {
  const escolas = await getEscolas();
  return escolas.find(e => e.id === escolaId)?.nome || null;
}

async function getEscolaIdByNome(nome) {
  const escolas = await getEscolas();
  return escolas.find(e => e.nome === nome)?.id || null;
}

async function getSyncConfig() {
  if (syncConfigCache) return syncConfigCache;
  syncConfigCache = await supabaseGet('notion_sync_config', 'select=*&ativo=eq.true') || [];
  return syncConfigCache;
}

async function getNotionUserIdByAapId(aapId) {
  const configs = await getSyncConfig();
  const config = configs.find(c => c.system_user_id === aapId);
  return config?.notion_user_id || null;
}

async function getSupabaseUserByNotionId(notionUserId) {
  const configs = await getSyncConfig();
  const config = configs.find(c => c.notion_user_id === notionUserId);
  return config ? { userId: config.system_user_id, escolaId: config.escola_padrao_id } : null;
}

async function getSupabaseUserByEmail(email) {
  const configs = await getSyncConfig();
  const config = configs.find(c => c.notion_user_email === email);
  return config ? { userId: config.system_user_id, escolaId: config.escola_padrao_id } : null;
}

// ============================================================
// DIRECAO 1: Supabase -> Notion
// ============================================================

async function syncSupabaseParaNotion() {
  log('--- Supabase -> Notion ---\n');

  const programacoes = await supabaseGet('programacoes',
    'select=id,titulo,tipo,status,data,descricao,escola_id,aap_id&order=created_at.desc');

  if (!programacoes || programacoes.length === 0) {
    log('Nenhuma programacao no Supabase.');
    return { exportadas: 0, puladas: 0 };
  }

  const syncLogs = await supabaseGet('notion_sync_log',
    'select=registro_id&status=eq.sucesso&tabela_destino=eq.programacoes');
  const syncedIds = new Set((syncLogs || []).map(l => l.registro_id));

  const pendentes = programacoes.filter(p =>
    !syncedIds.has(p.id) && TIPOS_PARA_SINCRONIZAR.includes(p.tipo)
  );

  const puladas = programacoes.filter(p =>
    !syncedIds.has(p.id) && !TIPOS_PARA_SINCRONIZAR.includes(p.tipo)
  );

  if (pendentes.length === 0) {
    log(`Nenhuma programacao nova para exportar.${puladas.length > 0 ? ` (${puladas.length} com tipo nao configurado)` : ''}`);
    return { exportadas: 0, puladas: puladas.length };
  }

  let exportadas = 0;

  for (const prog of pendentes) {
    const tipoNotion = TIPO_TO_NOTION[prog.tipo];
    const statusNotion = STATUS_TO_NOTION[prog.status] || 'A fazer';

    const escolaNome = await getEscolaNome(prog.escola_id);
    const redeNotionId = escolaNome ? REDE_SUPABASE_TO_NOTION[escolaNome] : null;
    const notionUserId = await getNotionUserIdByAapId(prog.aap_id);

    const properties = {
      'Tarefa': { title: [{ text: { content: prog.titulo } }] },
      'Status': { status: { name: statusNotion } },
      'Tipo da A\u00e7\u00e3o': { select: { name: tipoNotion } },
    };
    if (prog.data) properties['Prazo'] = { date: { start: prog.data } };
    if (prog.descricao) properties['Descri\u00e7\u00e3o'] = { rich_text: [{ text: { content: prog.descricao } }] };
    if (redeNotionId) properties['Rede'] = { relation: [{ id: redeNotionId }] };
    if (notionUserId) properties['Respons\u00e1vel'] = { people: [{ id: notionUserId }] };

    const notionPage = await notionRequest('/pages', 'POST', {
      parent: { database_id: NOTION_DB_TAREFAS },
      properties,
    });

    if (!notionPage) {
      log(`FALHOU: "${prog.titulo}"`);
      continue;
    }

    await supabaseInsert('notion_sync_log', {
      notion_page_id: notionPage.id,
      notion_database_id: NOTION_DB_TAREFAS,
      tabela_destino: 'programacoes',
      registro_id: prog.id,
      operacao: 'export',
      status: 'sucesso',
    });

    const redeInfo = redeNotionId ? escolaNome : 'sem mapeamento';
    const userInfo = notionUserId ? 'vinculado' : 'sem mapeamento';
    log(`EXPORTADO: "${prog.titulo}" -> ${statusNotion} | Rede: ${redeInfo} | Responsavel: ${userInfo}`);
    exportadas++;
  }

  return { exportadas, puladas: puladas.length };
}

// ============================================================
// DIRECAO 2: Notion -> Supabase (atualizar registros existentes)
// ============================================================

async function syncNotionParaSupabase() {
  log('--- Notion -> Supabase (atualizacoes) ---\n');

  const syncLogs = await supabaseGet('notion_sync_log',
    'select=notion_page_id,registro_id,tabela_destino&status=eq.sucesso&order=created_at.desc');

  if (!syncLogs || syncLogs.length === 0) {
    log('Nenhum registro vinculado.');
    return { atualizados: 0, semMudanca: 0, erros: 0 };
  }

  const syncMap = new Map();
  for (const l of syncLogs) {
    if (!syncMap.has(l.notion_page_id)) syncMap.set(l.notion_page_id, l);
  }

  let atualizados = 0;
  let semMudanca = 0;
  let erros = 0;

  for (const [notionPageId, syncLog] of syncMap) {
    const notionPage = await notionRequest(`/pages/${notionPageId}`);
    if (!notionPage) { erros++; continue; }

    const props = notionPage.properties;
    const titulo = props['Tarefa']?.title?.map(t => t.plain_text).join('') || 'Sem titulo';
    const statusNotion = props['Status']?.status?.name || 'A fazer';
    const prazoNotion = props['Prazo']?.date?.start || null;

    const redeRelations = props['Rede']?.relation || [];
    const redeNotionPageId = redeRelations.length > 0 ? redeRelations[0].id : null;
    const redeSupabaseNome = redeNotionPageId ? REDE_NOTION_TO_SUPABASE[redeNotionPageId] : null;

    const tabela = syncLog.tabela_destino || 'programacoes';
    const registros = await supabaseGet(tabela, `select=id,status,data,escola_id,aap_id&id=eq.${syncLog.registro_id}`);
    if (!registros?.length) { erros++; continue; }

    const reg = registros[0];
    const statusNovo = STATUS_TO_SUPABASE[statusNotion] || 'prevista';
    const statusMudou = reg.status !== statusNovo;
    const dataMudou = prazoNotion && reg.data !== prazoNotion;

    let escolaMudou = false;
    let novaEscolaId = null;
    if (redeSupabaseNome) {
      novaEscolaId = await getEscolaIdByNome(redeSupabaseNome);
      if (novaEscolaId && novaEscolaId !== reg.escola_id) escolaMudou = true;
    }

    // Verificar se responsavel mudou no Notion
    const notionPeople = props['Respons\u00e1vel']?.people || [];
    const notionPersonId = notionPeople.length > 0 ? notionPeople[0].id : null;
    let aapMudou = false;
    let novoAapId = null;
    if (notionPersonId) {
      const mapping = await getSupabaseUserByNotionId(notionPersonId);
      if (mapping && mapping.userId !== reg.aap_id) {
        aapMudou = true;
        novoAapId = mapping.userId;
      }
    }

    if (!statusMudou && !dataMudou && !escolaMudou && !aapMudou) {
      semMudanca++;
      continue;
    }

    const updateData = {};
    const mudancas = [];

    if (statusMudou) { updateData.status = statusNovo; mudancas.push(`status: ${reg.status} -> ${statusNovo}`); }
    if (dataMudou) { updateData.data = prazoNotion; mudancas.push(`data: ${reg.data} -> ${prazoNotion}`); }
    if (escolaMudou) { updateData.escola_id = novaEscolaId; mudancas.push(`rede: -> ${redeSupabaseNome}`); }
    if (aapMudou) { updateData.aap_id = novoAapId; mudancas.push(`responsavel: atualizado`); }

    const updated = await supabaseUpdate(tabela, syncLog.registro_id, updateData);
    if (!updated?.length) { erros++; continue; }

    log(`ATUALIZADO: "${titulo}" (${mudancas.join(', ')})`);
    atualizados++;
  }

  return { atualizados, semMudanca, erros };
}

// ============================================================
// DIRECAO 2b: Notion -> Supabase (importar tarefas novas)
// ============================================================

async function importarNovasDoNotion() {
  log('--- Notion -> Supabase (novas tarefas) ---\n');

  const configs = await getSyncConfig();
  if (!configs?.length) {
    log('Nenhum mapeamento de usuario configurado. Pulando importacao.');
    return { importadas: 0 };
  }

  const syncLogs = await supabaseGet('notion_sync_log', 'select=notion_page_id&status=eq.sucesso');
  const alreadySynced = new Set((syncLogs || []).map(l => l.notion_page_id));

  const tiposNotionPermitidos = new Set(
    TIPOS_PARA_SINCRONIZAR.map(t => TIPO_TO_NOTION[t]).filter(Boolean)
  );

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

  let importadas = 0;

  for (const page of allPages) {
    if (alreadySynced.has(page.id)) continue;

    const props = page.properties;
    const tipoNotion = props['Tipo da A\u00e7\u00e3o']?.select?.name;
    if (!tipoNotion || !tiposNotionPermitidos.has(tipoNotion)) continue;

    // Tentar mapear responsavel por Notion User ID primeiro, depois por email
    const notionPeople = props['Respons\u00e1vel']?.people || [];
    let mapping = null;

    for (const person of notionPeople) {
      mapping = await getSupabaseUserByNotionId(person.id);
      if (mapping) break;
      if (person.person?.email) {
        mapping = await getSupabaseUserByEmail(person.person.email);
        if (mapping) break;
      }
    }

    if (!mapping) continue;

    const titulo = props['Tarefa']?.title?.map(t => t.plain_text).join('') || 'Sem titulo';
    const statusNotion = props['Status']?.status?.name || 'A fazer';
    const prazo = props['Prazo']?.date?.start || new Date().toISOString().split('T')[0];
    const descricao = props['Descri\u00e7\u00e3o']?.rich_text?.map(t => t.plain_text).join('') || '';
    const tipoSupabase = TIPO_FROM_NOTION[tipoNotion] || 'formacao';

    const redeRelations = props['Rede']?.relation || [];
    let escolaId = mapping.escolaId;
    if (redeRelations.length > 0) {
      const redeNome = REDE_NOTION_TO_SUPABASE[redeRelations[0].id];
      if (redeNome) {
        const escolaPorRede = await getEscolaIdByNome(redeNome);
        if (escolaPorRede) escolaId = escolaPorRede;
      }
    }

    const created = await supabaseInsert('programacoes', {
      titulo,
      tipo: tipoSupabase,
      data: prazo,
      aap_id: mapping.userId,
      escola_id: escolaId,
      segmento: 'anos_iniciais',
      componente: 'polivalente',
      ano_serie: 'todos',
      programa: ['redes_municipais'],
      status: STATUS_TO_SUPABASE[statusNotion] || 'prevista',
      horario_inicio: '08:00',
      horario_fim: '12:00',
      descricao: descricao || null,
    });

    if (!created?.length) continue;

    await supabaseInsert('notion_sync_log', {
      notion_page_id: page.id,
      notion_database_id: NOTION_DB_TAREFAS,
      tabela_destino: 'programacoes',
      registro_id: created[0].id,
      operacao: 'import',
      status: 'sucesso',
    });

    log(`IMPORTADO: "${titulo}" (${tipoNotion} -> ${tipoSupabase})`);
    importadas++;
  }

  if (importadas === 0) log('Nenhuma tarefa nova para importar.');
  return { importadas };
}

// ============================================================
// EXECUCAO PRINCIPAL
// ============================================================

async function runSync(direcao) {
  const hora = timestamp();
  console.log(`\n[${'='.repeat(56)}]`);
  console.log(`   SYNC ${hora} | Tipos: ${TIPOS_PARA_SINCRONIZAR.join(', ')}`);
  console.log(`[${'='.repeat(56)}]\n`);

  escolasCache = null;
  syncConfigCache = null;

  const resultados = {};

  if (direcao === 'all' || direcao === 'supabase') {
    resultados.supabaseNotion = await syncSupabaseParaNotion();
    console.log();
  }

  if (direcao === 'all' || direcao === 'notion') {
    resultados.notionSupabaseUpdate = await syncNotionParaSupabase();
    console.log();
    resultados.notionSupabaseImport = await importarNovasDoNotion();
    console.log();
  }

  const partes = [];
  if (resultados.supabaseNotion?.exportadas > 0) partes.push(`${resultados.supabaseNotion.exportadas} exportada(s)`);
  if (resultados.notionSupabaseUpdate?.atualizados > 0) partes.push(`${resultados.notionSupabaseUpdate.atualizados} atualizada(s)`);
  if (resultados.notionSupabaseImport?.importadas > 0) partes.push(`${resultados.notionSupabaseImport.importadas} importada(s)`);

  if (partes.length > 0) {
    log(`RESUMO: ${partes.join(', ')}`);
  } else {
    log('RESUMO: Tudo sincronizado, sem mudancas.');
  }

  return resultados;
}

async function main() {
  const args = process.argv.slice(2);
  const isWatch = args.includes('--watch');
  const isNotion = args.includes('--notion');
  const isSupabase = args.includes('--supabase');

  const direcao = isNotion ? 'notion' : isSupabase ? 'supabase' : 'all';

  const intervaloArg = args.find(a => !a.startsWith('--') && !isNaN(a));
  const intervaloSeg = intervaloArg ? parseInt(intervaloArg) : 60;

  console.log('\n SYNC Plataforma AAP <-> Notion');
  console.log(`   Direcao: ${direcao === 'all' ? 'bidirecional' : direcao === 'notion' ? 'Notion -> Supabase' : 'Supabase -> Notion'}`);
  console.log(`   Tipos configurados: ${TIPOS_PARA_SINCRONIZAR.length}`);
  console.log(`   Redes mapeadas: ${Object.keys(REDE_SUPABASE_TO_NOTION).length}`);
  if (isWatch) {
    console.log(`   Modo: WATCH (a cada ${intervaloSeg} segundos)`);
    console.log(`   Para parar: Ctrl+C`);
  }

  if (isWatch) {
    let rodando = false;
    const executar = async () => {
      if (rodando) return;
      rodando = true;
      try { await runSync(direcao); }
      catch (err) { console.error(`   Erro no ciclo: ${err.message}`); }
      rodando = false;
    };

    await executar();
    setInterval(executar, intervaloSeg * 1000);
  } else {
    await runSync(direcao);
    console.log();
  }
}

main().catch(err => {
  console.error('\n   Erro inesperado:', err);
  process.exit(1);
});
