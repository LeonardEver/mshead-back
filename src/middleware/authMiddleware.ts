// Conteúdo para: src/middleware/authMiddleware.ts

import { Request, Response, NextFunction } from 'express';
import jwt, { Secret } from 'jsonwebtoken';
import { query } from '../db';
import { asyncHandler } from './errorHandler';

// Estendemos a interface Request do Express para incluir o user
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: 'user' | 'admin';
  };
}

// Middleware para proteger rotas
export const protect = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  let token;

  // 1. Verificar se o token está no cabeçalho (Bearer Token)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Obter token do cabeçalho
      token = req.headers.authorization.split(' ')[1];

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error('JWT_SECRET não está definido');
      }

      // 2. Verificar e decodificar o token
      const decoded = jwt.verify(token, secret as Secret) as { id: string };

      // 3. Obter utilizador pelo ID do token (excluindo a password)
      const findUserQuery = 'SELECT id, role FROM users WHERE id = $1';
      const { rows } = await query(findUserQuery, [decoded.id]);

      if (rows.length === 0) {
        res.status(401).json({ success: false, error: 'Token inválido, utilizador não encontrado.' });
        return;
      }

      // 4. Anexar o utilizador ao objeto Request para acesso nas rotas
      req.user = rows[0];

      next();

    } catch (error) {
      // Se a verificação falhar (token expirado, inválido)
      res.status(401).json({ success: false, error: 'Não autorizado, token falhou ou expirou.' });
    }
  }

  if (!token) {
    res.status(401).json({ success: false, error: 'Não autorizado, nenhum token fornecido.' });
  }
});