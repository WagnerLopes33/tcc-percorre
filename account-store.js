const { mkdirSync, readFileSync, renameSync, writeFileSync } = require('node:fs');
const { dirname, join } = require('node:path');

const emptyData = () => ({ accounts: [], projects: [], reviews: [], sessions: [] });

function readFile(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return emptyData();
  }
}

function fileStore(file) {
  let data;
  const read = () => data ??= readFile(file);
  return {
    read,
    change(update) {
      const next = structuredClone(read());
      const result = update(next);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file + '.tmp', JSON.stringify(next), { mode: 0o600 });
      renameSync(file + '.tmp', file);
      data = next;
      return result;
    },
  };
}

function postgresStore(connectionString, migrationUrl, importFile) {
  const { Pool } = require('pg');
  function createPool(value, allowExitOnIdle = false) {
    const url = new URL(value);
    if (url.searchParams.get('sslmode') === 'require' && url.searchParams.get('uselibpqcompat') !== 'true') {
      url.searchParams.set('sslmode', 'verify-full');
    }
    return new Pool({
      connectionString: url.href, connectionTimeoutMillis: 10000, enableChannelBinding: true, allowExitOnIdle,
    });
  }
  const pool = createPool(connectionString, true);
  pool.on('error', error => console.error('Falha na conexão ociosa com o Postgres:', error.code || error.name));

  async function transaction(run, connectionPool = pool) {
    const client = await connectionPool.connect();
    let discard;
    try {
      await client.query('BEGIN');
      const result = await run(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        discard = rollbackError;
      }
      throw error;
    } finally {
      client.release(discard);
    }
  }

  let ready;
  async function prepareSchema() {
    const migrations = migrationUrl && migrationUrl !== connectionString
      ? createPool(migrationUrl)
      : pool;
    try {
      await transaction(async client => {
        await client.query("SELECT pg_advisory_xact_lock(hashtext('dico_account_state'))");
        await client.query(`
          CREATE TABLE IF NOT EXISTS dico_account_state (
            id integer PRIMARY KEY CHECK (id = 1),
            data jsonb NOT NULL
          )
        `);
        await client.query('INSERT INTO dico_account_state (id, data) VALUES (1, $1) ON CONFLICT (id) DO NOTHING', [emptyData()]);
        if (!importFile) return;

        const { rows } = await client.query('SELECT data FROM dico_account_state WHERE id = 1 FOR UPDATE');
        if (Object.keys(emptyData()).some(key => rows[0].data[key].length > 0)) {
          throw Object.assign(new Error('O Postgres já contém registros.'), { code: 'DICO_IMPORT_TARGET_NOT_EMPTY' });
        }
        const data = JSON.parse(readFileSync(importFile, 'utf8'));
        if (!Object.keys(emptyData()).every(key => Array.isArray(data?.[key]))) {
          throw Object.assign(new Error('O arquivo de dados do Dico tem formato inválido.'), { code: 'DICO_IMPORT_INVALID_DATA' });
        }
        await client.query('UPDATE dico_account_state SET data = $1 WHERE id = 1', [data]);
      }, migrations);
      await pool.query('SELECT 1 FROM dico_account_state WHERE id = 1');
    } finally {
      if (migrations !== pool) await migrations.end();
    }
  }

  function initialize() {
    ready ??= prepareSchema().catch(error => {
      ready = undefined;
      throw error;
    });
    return ready;
  }

  return {
    initialize,
    async read() {
      await initialize();
      const { rows } = await pool.query('SELECT data FROM dico_account_state WHERE id = 1');
      return rows[0].data;
    },
    async change(update) {
      await initialize();
      return transaction(async client => {
        const { rows } = await client.query('SELECT data FROM dico_account_state WHERE id = 1 FOR UPDATE');
        const data = rows[0].data;
        const result = update(data);
        await client.query('UPDATE dico_account_state SET data = $1 WHERE id = 1', [data]);
        return result;
      });
    },
    close: () => pool.end(),
  };
}

function openAccountStore({ dataFile } = {}) {
  const file = dataFile || process.env.DICO_DATA_FILE || join(__dirname, '.dico', 'dados.json');
  const url = !dataFile && process.env.DATABASE_URL;
  const importFile = process.env.DICO_IMPORT_LOCAL_DATA === 'true' ? file : undefined;
  return url ? postgresStore(url, process.env.DATABASE_URL_UNPOOLED, importFile) : fileStore(file);
}

module.exports = { openAccountStore };
