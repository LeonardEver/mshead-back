import { Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { query } from '../db';
import { AuthenticatedRequest } from '../middleware/firebaseAuthMiddleware';

// GET /api/favorites - Buscar todos os favoritos do usuário
export const getFavorites = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;

  const sqlQuery = `
    SELECT p.* FROM products p
    JOIN user_favorites uf ON p.id = uf.product_id
    WHERE uf.user_id = $1;
  `;
  
  const { rows } = await query(sqlQuery, [userId]);
  
  res.json({
    success: true,
    data: rows
  });
});

// POST /api/favorites - Adicionar um produto aos favoritos
export const addFavorite = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const { productId } = req.body;

  if (!productId) {
    res.status(400).json({ success: false, error: 'ID do produto é obrigatório.' });
    return;
  }

  // Tenta inserir, ignora se já existir (ON CONFLICT DO NOTHING)
  const insertQuery = `
    INSERT INTO user_favorites (user_id, product_id)
    VALUES ($1, $2)
    ON CONFLICT (user_id, product_id) DO NOTHING
    RETURNING *;
  `;
  
  const { rows } = await query(insertQuery, [userId, productId]);
  
  if (rows.length > 0) {
    res.status(201).json({
      success: true,
      message: 'Produto adicionado aos favoritos.',
      data: rows[0]
    });
  } else {
    res.status(200).json({
      success: true,
      message: 'Produto já estava nos favoritos.'
    });
  }
});

// DELETE /api/favorites/:productId - Remover um produto dos favoritos
export const removeFavorite = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const { productId } = req.params;

  const deleteQuery = 'DELETE FROM user_favorites WHERE user_id = $1 AND product_id = $2 RETURNING id;';
  
  const { rowCount } = await query(deleteQuery, [userId, productId]);
  
  if (rowCount === 0) {
    res.status(404).json({
      success: false,
      error: 'Favorito não encontrado.'
    });
    return;
  }
  
  res.json({
    success: true,
    message: 'Produto removido dos favoritos.'
  });
});