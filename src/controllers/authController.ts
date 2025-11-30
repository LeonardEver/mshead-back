// Conteúdo para: src/controllers/authController.ts

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { query } from '../db';
import bcrypt from 'bcryptjs';
import { sign, Secret, SignOptions } from 'jsonwebtoken';
import { AuthenticatedRequest } from '../middleware/firebaseAuthMiddleware';

// Função para gerar um token JWT
const generateToken = (userId: string) => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  if (!secret) {
    throw new Error('JWT_SECRET não está definido no .env');
  }

  // process.env values are strings; cast to SignOptions to satisfy the type definitions
  return sign(
    { id: userId },
    secret as Secret,
    { expiresIn } as unknown as SignOptions
  );
};

// POST /api/auth/register - Registar um novo utilizador
export const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body; // <-- SEM O UNDERSCORE


  if (!name || !email || !password) {
    res.status(400).json({ success: false, error: 'Por favor, forneça nome, email e password.' });
    return;
  }

  // 1. Verificar se o utilizador já existe
  const userExistsQuery = 'SELECT * FROM users WHERE email = $1';
  const { rows: existingUsers } = await query(userExistsQuery, [email]);

  if (existingUsers.length > 0) {
    res.status(400).json({ success: false, error: 'Utilizador com este email já existe.' });
    return;
  }

  // 2. Encriptar a password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // 3. Inserir no banco de dados
  const insertQuery = `
    INSERT INTO users (name, email, password)
    VALUES ($1, $2, $3)
    RETURNING id, name, email, role;
  `;
  const { rows: newUsers } = await query(insertQuery, [name, email, hashedPassword]);
  const newUser = newUsers[0];

  // 4. Gerar token e responder
  const token = generateToken(newUser.id);
  
  res.status(201).json({
    success: true,
    data: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      token: token,
    },
  });
});

// POST /api/auth/login - Autenticar um utilizador
export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ success: false, error: 'Por favor, forneça email e password.' });
    return;
  }

  // 1. Encontrar o utilizador
  const findUserQuery = 'SELECT * FROM users WHERE email = $1';
  const { rows: users } = await query(findUserQuery, [email]);
  
  if (users.length === 0) {
    res.status(401).json({ success: false, error: 'Email ou password inválidos.' }); // Email não encontrado
    return;
  }
  
  const user = users[0];

  // 2. Verificar a password
  const isMatch = await bcrypt.compare(password, user.password);
  
  if (!isMatch) {
    res.status(401).json({ success: false, error: 'Email ou password inválidos.' }); // Password errada
    return;
  }
  

  // 3. Gerar token e responder
const token = generateToken(user.id);

  res.status(200).json({
    success: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: token,
    },
  });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as any; // Usando any temporariamente para evitar erro de TS na interface

  if (!authReq.user) {
    res.status(404).json({ success: false, error: 'Usuário não encontrado.' });
    return;
  }

  res.status(200).json({
    success: true,
    data: authReq.user,
  });
});