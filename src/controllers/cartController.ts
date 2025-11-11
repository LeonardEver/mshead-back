import { Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { query } from '../db';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

// Interface para tipar o resultado da query SQL dos itens do carrinho
interface CartItemQueryResult {
  item_id: string;
  product_id: string;
  quantity: number;
  price_at_addition: number;
  product_name: string;
  product_image: string;
  current_price: number;
}


// Função auxiliar para buscar o carrinho do utilizador
const getOrCreateCart = async (userId: string) => {
  let cartQuery = 'SELECT id FROM carts WHERE user_id = $1 AND is_active = TRUE';
  let { rows } = await query(cartQuery, [userId]);

  if (rows.length > 0) {
    return rows[0].id;
  }

  let insertCartQuery = 'INSERT INTO carts (user_id) VALUES ($1) RETURNING id';
  let { rows: newCartRows } = await query(insertCartQuery, [userId]);
  return newCartRows[0].id;
};

// GET /api/cart - Obter carrinho do utilizador (Requer autenticação)
export const getCart = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Utilizador não autenticado.' });
  }

  const cartId = await getOrCreateCart(userId);

  const cartDetailsQuery = `
    SELECT
        ci.id AS item_id,
        ci.product_id,
        ci.quantity,
        ci.price_at_addition,
        p.name AS product_name,
        p.image AS product_image,
        p.price AS current_price
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.cart_id = $1
    ORDER BY ci.created_at;
  `;

  const { rows } = await query(cartDetailsQuery, [cartId]);
  const items: CartItemQueryResult[] = rows as CartItemQueryResult[];
  
  // CORREÇÃO: Usamos 'number' como tipo inicial para o acumulador 'sum'
  const subtotal = items.reduce((sum: number, item) => sum + (item.price_at_addition * item.quantity), 0 as number);

  // CORREÇÃO: Adicionamos 'return'
  return res.json({
    success: true,
    data: {
      id: cartId,
      items,
      subtotal,
    }
  });
});

// POST /api/cart - Adicionar produto ao carrinho
export const addToCart = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const { productId, quantity } = req.body;

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Utilizador não autenticado.' });
  }
  
  if (!productId || typeof quantity !== 'number' || quantity <= 0) {
    return res.status(400).json({ success: false, error: 'Dados inválidos.' });
  }

  const cartId = await getOrCreateCart(userId);

  const productQuery = 'SELECT price FROM products WHERE id = $1';
  const { rows: productRows } = await query(productQuery, [productId]);

  if (productRows.length === 0) {
    return res.status(404).json({ success: false, error: 'Produto não encontrado.' });
  }
  const priceAtAddition = productRows[0].price;

  const existingItemQuery = 'SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2';
  const { rows: existingItems } = await query(existingItemQuery, [cartId, productId]);

  let updatedItem;
  if (existingItems.length > 0) {
    const newQuantity = existingItems[0].quantity + quantity;
    const updateQuery = 'UPDATE cart_items SET quantity = $1, price_at_addition = $2 WHERE id = $3 RETURNING *';
    const { rows: updatedRows } = await query(updateQuery, [newQuantity, priceAtAddition, existingItems[0].id]);
    updatedItem = updatedRows[0];
  } else {
    const insertQuery = 'INSERT INTO cart_items (cart_id, product_id, quantity, price_at_addition) VALUES ($1, $2, $3, $4) RETURNING *';
    const { rows: newRows } = await query(insertQuery, [cartId, productId, quantity, priceAtAddition]);
    updatedItem = newRows[0];
  }

  // CORREÇÃO: Adicionamos 'return'
  return res.status(200).json({
    success: true,
    message: 'Produto adicionado/atualizado no carrinho.',
    data: updatedItem
  });
});

// DELETE /api/cart/:itemId - Remover um item do carrinho
export const removeFromCart = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const { itemId } = req.params;
  
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Utilizador não autenticado.' });
  }

  const cartId = await getOrCreateCart(userId);

  const deleteQuery = `
    DELETE FROM cart_items
    WHERE id = $1
    AND cart_id = $2
    RETURNING id;
  `;
  const { rowCount } = await query(deleteQuery, [itemId, cartId]);

  if (rowCount === 0) {
    return res.status(404).json({ success: false, error: 'Item do carrinho não encontrado ou não pertence a este carrinho.' });
  }

  // CORREÇÃO: Adicionamos 'return'
  return res.json({ success: true, message: 'Item removido do carrinho.' });
});

// PUT /api/cart/:itemId - Atualizar a quantidade de um item no carrinho
export const updateCartItem = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const { itemId } = req.params;
  const { quantity } = req.body;
  
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Utilizador não autenticado.' });
  }
  
  if (typeof quantity !== 'number' || quantity < 0) {
    return res.status(400).json({ success: false, error: 'Quantidade inválida.' });
  }
  
  const cartId = await getOrCreateCart(userId);

  if (quantity === 0) {
      const deleteQuery = `
        DELETE FROM cart_items
        WHERE id = $1
        AND cart_id = $2
        RETURNING id;
      `;
      const { rowCount } = await query(deleteQuery, [itemId, cartId]);

      if (rowCount === 0) {
        return res.status(404).json({ success: false, error: 'Item do carrinho não encontrado ou não pertence a este carrinho.' });
      }

      return res.json({ success: true, message: 'Item removido do carrinho.' });
  }

  const updateQuery = `
    UPDATE cart_items
    SET quantity = $1, updated_at = NOW()
    WHERE id = $2
    AND cart_id = $3
    RETURNING *;
  `;
  const { rows: updatedRows } = await query(updateQuery, [quantity, itemId, cartId]);

  if (updatedRows.length === 0) {
    return res.status(404).json({ success: false, error: 'Item do carrinho não encontrado ou não pertence a este carrinho.' });
  }

  // CORREÇÃO: Adicionamos 'return'
  return res.json({ success: true, data: updatedRows[0] });
});

// DELETE /api/cart/clear - Limpar todo o carrinho (esvaziar)
export const clearCart = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Utilizador não autenticado.' });
  }

  const cartId = await getOrCreateCart(userId);

  const deleteQuery = 'DELETE FROM cart_items WHERE cart_id = $1';
  await query(deleteQuery, [cartId]);

  // CORREÇÃO: Adicionamos 'return'
  return res.json({ success: true, message: 'Carrinho limpo com sucesso.' });
});