import 'dotenv/config';
import { Client } from 'pg';

async function ensureDatabase() {
  const databaseUrl = process.env.NOTIFICATION_DATABASE_URL;
  if (!databaseUrl) {
    console.error('NOTIFICATION_DATABASE_URL não definido');
    process.exit(1);
  }

  let url: URL;
  try {
    url = new URL(databaseUrl);
  } catch {
    console.error('NOTIFICATION_DATABASE_URL inválida');
    process.exit(1);
  }

  const dbName = url.pathname?.replace(/^\//, '') || '';
  if (!dbName) {
    console.error('Nome do banco não encontrado na NOTIFICATION_DATABASE_URL');
    process.exit(1);
  }

  const adminUrl = new URL(databaseUrl);
  adminUrl.pathname = '/postgres';

  const client = new Client({ connectionString: adminUrl.toString() });

  try {
    await client.connect();
    const res = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName],
    );
    if (res.rowCount === 0) {
      const safeName = dbName.replace(/"/g, '');
      console.log(`Banco "${dbName}" não existe. Criando...`);
      await client.query(`CREATE DATABASE "${safeName}"`);
      console.log('Banco criado.');
    } else {
      console.log(`Banco "${dbName}" já existe.`);
    }
  } catch (err) {
    console.error('Erro ao garantir banco:', err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

ensureDatabase();
