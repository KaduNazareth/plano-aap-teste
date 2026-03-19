

# Gerar Schemas do BigQuery Automaticamente

## Objetivo
Consultar o banco de dados para extrair os schemas das 10 tabelas exportadas e gerar um arquivo com os comandos DDL do BigQuery prontos para execução.

## Abordagem
1. Executar `psql` para consultar `information_schema.columns` das 10 tabelas
2. Mapear tipos PostgreSQL → BigQuery (uuid/text → STRING, integer → INT64, boolean → BOOL, timestamp → TIMESTAMP, date → DATE, time → STRING, jsonb → JSON, ARRAY → STRING)
3. Gerar arquivo SQL com `CREATE TABLE` do BigQuery para cada tabela
4. Salvar em `/mnt/documents/bigquery_schemas.sql`

## Tabelas
`avaliacoes_aula`, `observacoes_aula_redes`, `relatorios_eteg_redes`, `relatorios_professor_redes`, `registros_acao`, `programacoes`, `presencas`, `escolas`, `professores`, `profiles`

## Entregável
Arquivo SQL pronto para colar no console do BigQuery, com todos os `CREATE TABLE` usando o dataset configurado.

