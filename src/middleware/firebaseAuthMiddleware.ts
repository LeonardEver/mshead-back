import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import { query } from '../db';
import path from 'path';

export interface AuthenticatedRequest extends Request {
  user?: any;
}

// Inicializa o Firebase Admin (mantive sua lógica)
try {
  const serviceAccountPath = path.join(__dirname, '../../serviceAccountKey.json');
  const serviceAccount = require(serviceAccountPath); 
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('Firebase Admin SDK inicializado.');
} catch (error) {
  // Ignora erro se já estiver inicializado
  if (!admin.apps.length) {
    console.error('ERRO: Falha ao inicializar Firebase Admin:', error);
  }
}

const findOrCreateUser = async (firebaseUser: admin.auth.UserRecord) => {
  const { uid, email, displayName } = firebaseUser;

  // 1. Busca usuário
  const findQuery = 'SELECT * FROM users WHERE firebase_uid = $1 OR email = $2';
  let { rows } = await query(findQuery, [uid, email]);

  if (rows.length > 0) {
    const user = rows[0];
    // Se o usuário existe mas não tem firebase_uid (login antigo), atualiza
    if (!user.firebase_uid) {
        await query('UPDATE users SET firebase_uid = $1 WHERE id = $2', [uid, user.id]);
        user.firebase_uid = uid;
    }
    return user;
  }

  // 2. Cria usuário se não existir
  // IMPORTANTE: Aqui que estava o erro se a senha fosse NOT NULL
  const insertQuery = `
    INSERT INTO users (name, email, firebase_uid, role)
    VALUES ($1, $2, $3, 'user')
    RETURNING *;
  `;
  const name = displayName || email?.split('@')[0] || 'Novo Utilizador';
  
  // LOG PARA DEBUG
  console.log(`Criando novo usuário no DB: ${email} (UID: ${uid})`);
  
  const { rows: newRows } = await query(insertQuery, [name, email, uid]);
  return newRows[0];
};

export const firebaseProtect = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Token não fornecido.' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const firebaseUser = await admin.auth().getUser(decodedToken.uid);
    
    // Tenta encontrar ou criar
    const postgresUser = await findOrCreateUser(firebaseUser);
    
    req.user = postgresUser;
    return next();

  } catch (error: any) {
    // AQUI ESTÁ A MELHORIA: Logar o erro real no terminal do servidor
    console.error("ERRO CRÍTICO NO AUTH MIDDLEWARE:", error.message);
    if (error.detail) console.error("Detalhe DB:", error.detail);
    
    return res.status(401).json({ 
        success: false, 
        error: 'Autenticação falhou.',
        debug: error.message // Útil para você ver no frontend temporariamente
    });
  }
};