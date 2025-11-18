// Conteúdo para: src/middleware/adminMiddleware.ts

import { Response, NextFunction } from 'express';
// Importamos a interface do firebaseAuthMiddleware
import { AuthenticatedRequest } from './firebaseAuthMiddleware'; 

/**
 * Middleware para verificar se o utilizador autenticado é um admin.
 * Deve ser usado *depois* do firebaseProtect.
 */
export const adminProtect = (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): void => { // Tipo de retorno 'void' para satisfazer o TypeScript
  
  // 1. Verifica se o firebaseProtect foi executado e anexou o usuário
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Não autorizado. Faça login primeiro.',
    });
    return; // Interrompe a execução
  }

  // 2. Verifica se a role é 'admin'
  if (req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Acesso negado. Esta rota é apenas para administradores.',
    });
    return; // Interrompe a execução
  }

  // 3. Se for admin, continua
  next();
};