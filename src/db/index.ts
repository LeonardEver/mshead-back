import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Configuração da conexão com PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'mushco_headshop',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Máximo de conexões no pool
  idleTimeoutMillis: 30000, // Tempo limite para conexões inativas
  connectionTimeoutMillis: 2000, // Tempo limite para estabelecer conexão
});

// Função para conectar ao banco de dados
export const connectDB = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    console.log('🐘 PostgreSQL conectado:', client.database);
    client.release();
  } catch (error) {
    console.error('❌ Erro ao conectar com PostgreSQL:', error);
    process.exit(1);
  }
};

// Função para executar queries
export const query = async (text: string, params?: any[]): Promise<any> => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Query executada:', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ Erro na query:', { text, error });
    throw error;
  }
};

// Função para executar transações
export const transaction = async (callback: (client: any) => Promise<any>): Promise<any> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Função para fechar conexões
export const closeDB = async (): Promise<void> => {
  try {
    await pool.end();
    console.log('🔌 PostgreSQL desconectado');
  } catch (error) {
    console.error('❌ Erro ao desconectar PostgreSQL:', error);
  }
};

export default pool;

