import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import { query } from '../db';
import path from 'path';

// Estendemos o Request para incluir o nosso *utilizador do PostgreSQL*
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string; // ID do PostgreSQL (UUID)
    role: 'user' | 'admin';
    firebase_uid: string;
    // ...outros campos da sua tabela 'users' do Postgres
  };
}

// Inicializa o Firebase Admin com a chave de serviço
try {
  // Procura a chave na raiz do projeto
  const serviceAccountPath = path.join(__dirname, '../../serviceAccountKey.json');
  const serviceAccount = require(serviceAccountPath); 
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('Firebase Admin SDK inicializado com sucesso.');
} catch (error) {
  console.error('ERRO: Falha ao inicializar o Firebase Admin SDK.');
  console.error('ERRO: Certifique-se de que o ficheiro "serviceAccountKey.json" está na raiz do projeto back-end.');
}

/**
 * Procura um utilizador na tabela 'users' do Postgres pelo seu firebase_uid.
 * Se não o encontrar, cria um novo registo de utilizador.
 */
const findOrCreateUser = async (firebaseUser: admin.auth.UserRecord) => {
  const { uid, email, displayName } = firebaseUser;

  // 1. Tenta encontrar o utilizador pelo firebase_uid
  const findQuery = 'SELECT * FROM users WHERE firebase_uid = $1';
  let { rows } = await query(findQuery, [uid]);

  if (rows.length > 0) {
    return rows[0]; // Utilizador encontrado
  }

  // 2. Se não encontrar, cria um novo utilizador na tabela 'users'
  const insertQuery = `
    INSERT INTO users (name, email, firebase_uid, role)
    VALUES ($1, $2, $3, 'user')
    RETURNING *;
  `;
  const name = displayName || email?.split('@')[0] || 'Novo Utilizador';
  const { rows: newRows } = await query(insertQuery, [name, email, uid]);
  
  return newRows[0]; // Retorna o novo utilizador criado
};


// Middleware de proteção
export const firebaseProtect = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  let token;

  // 1. Obter o Token do Firebase enviado pelo front-end
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Não autorizado, nenhum token fornecido.' });
  }

  try {
    // 2. Verificar se o token é um token válido do Firebase
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // 3. O token é válido. Obter o registo completo do utilizador do Firebase Auth
    const firebaseUser = await admin.auth().getUser(decodedToken.uid);

    // 4. Encontrar ou criar o utilizador correspondente no nosso banco PostgreSQL
    const postgresUser = await findOrCreateUser(firebaseUser);

    // 5. Anexar o *utilizador do PostgreSQL* ao request
    req.user = postgresUser;
    
    // CORREÇÃO: Adicionado 'return' para garantir que este caminho da função termine
    return next();

  } catch (error) {
    // Token expirado ou inválido
    return res.status(401).json({ success: false, error: 'Não autorizado, token falhou ou expirou.' });
  }
};