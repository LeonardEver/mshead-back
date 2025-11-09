import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';

// Dados mock para desenvolvimento (será substituído pelo banco de dados)
const mockCarts: Record<string, any[]> = {};

// POST /api/cart/:userId/sync - Sincronizar carrinho
export const syncCart = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { items } = req.body;
  
  if (!Array.isArray(items)) {
    res.status(400).json({
      success: false,
      error: 'Items deve ser um array'
    });
    return;
  }
  
  // Salvar carrinho do usuário
  mockCarts[userId] = items;
  
  res.json({
    success: true,
    message: 'Carrinho sincronizado com sucesso',
    data: items
  });
});

// GET /api/cart/:userId - Buscar carrinho do usuário
export const getCart = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  
  const userCart = mockCarts[userId] || [];
  
  res.json({
    success: true,
    data: userCart
  });
});

