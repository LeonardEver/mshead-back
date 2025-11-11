import { Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import pool from '../db';
import { query } from '../db';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

// POST /api/orders - Criar um novo pedido (Checkout)
export const createOrder = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const { addressId, paymentMethod, shippingCost, totalAmount } = req.body;

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Utilizador não autenticado.' });
  }
  if (!addressId || !paymentMethod || totalAmount === undefined || shippingCost === undefined) {
    return res.status(400).json({ success: false, error: 'Dados do pedido incompletos.' });
  }

  // 1. Iniciar Transação
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 2. Encontrar o carrinho ativo e itens (JOIN com products para obter dados para a ordem)
    const cartDetailsQuery = `
      SELECT ci.product_id, ci.quantity, ci.price_at_addition, p.stock
      FROM cart_items ci
      JOIN carts c ON c.id = ci.cart_id
      JOIN products p ON p.id = ci.product_id
      WHERE c.user_id = $1 AND c.is_active = TRUE;
    `;
    const { rows: cartItems } = await client.query(cartDetailsQuery, [userId]);

    if (cartItems.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'O carrinho está vazio.' });
    }

    // 3. Verificar o estoque (uma última vez antes de criar a ordem)
    for (const item of cartItems) {
      if (item.quantity > item.stock) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: `Estoque insuficiente para o produto ID ${item.product_id}. Disponível: ${item.stock}, Requerido: ${item.quantity}.`
        });
      }
    }

    // 4. Criar a Ordem
    const insertOrderQuery = `
      INSERT INTO orders (user_id, total_amount, shipping_cost, payment_method, address_id, status)
      VALUES ($1, $2, $3, $4, $5, 'pending')
      RETURNING id, created_at, total_amount;
    `;
    const orderValues = [userId, totalAmount, shippingCost, paymentMethod, addressId];
    const { rows: orderRows } = await client.query(insertOrderQuery, orderValues);
    const orderId = orderRows[0].id;

    // 5. Mover Itens do Carrinho para order_items e Atualizar Estoque
    for (const item of cartItems) {
      // Inserir item do pedido
      const insertItemQuery = `
        INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES ($1, $2, $3, $4);
      `;
      const itemValues = [orderId, item.product_id, item.quantity, item.price_at_addition];
      await client.query(insertItemQuery, itemValues);

      // Atualizar o estoque
      const updateStockQuery = `
        UPDATE products SET stock = stock - $1 WHERE id = $2;
      `;
      await client.query(updateStockQuery, [item.quantity, item.product_id]);
    }

    // 6. Limpar o Carrinho Ativo
    const clearCartQuery = 'DELETE FROM cart_items WHERE cart_id = (SELECT id FROM carts WHERE user_id = $1 AND is_active = TRUE)';
    await client.query(clearCartQuery, [userId]);

    // 7. Commit (Confirmar) a transação
    await client.query('COMMIT');
    
    return res.status(201).json({
      success: true,
      message: 'Pedido criado com sucesso e estoque atualizado.',
      data: orderRows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK'); // Desfaz tudo se algo der errado
    throw error;
  } finally {
    client.release();
  }
});

// GET /api/orders - Obter o histórico de pedidos do utilizador
export const getOrderHistory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Utilizador não autenticado.' });
  }

  const ordersQuery = `
    SELECT id, total_amount, status, created_at
    FROM orders
    WHERE user_id = $1
    ORDER BY created_at DESC;
  `;
  const { rows: orders } = await query(ordersQuery, [userId]);
  
  return res.json({ success: true, data: orders });
});

// GET /api/orders/:id - Obter detalhes de um pedido específico
export const getOrderDetails = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Utilizador não autenticado.' });
  }

  // 1. Obter a ordem e garantir que pertence ao utilizador
  const orderQuery = `
    SELECT id, total_amount, status, created_at, shipping_cost, payment_method
    FROM orders
    WHERE id = $1 AND user_id = $2;
  `;
  const { rows: orders } = await query(orderQuery, [id, userId]);

  if (orders.length === 0) {
    return res.status(404).json({ success: false, error: 'Pedido não encontrado ou não pertence a este utilizador.' });
  }
  const order = orders[0];

  // 2. Obter os itens da ordem
  const itemsQuery = `
    SELECT oi.product_id, oi.quantity, oi.price_at_purchase, p.name, p.image
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = $1;
  `;
  const { rows: items } = await query(itemsQuery, [id]);

  order.items = items;

  return res.json({ success: true, data: order });
});

// GET /api/orders/admin - Obter todos os pedidos (APENAS ADMIN)
export const getAllOrdersAdmin = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // TODO: Implementar lógica de autorização para verificar se req.user.role === 'admin'
  const ordersQuery = `
    SELECT o.id, u.email, o.total_amount, o.status, o.created_at
    FROM orders o
    JOIN users u ON u.id = o.user_id
    ORDER BY o.created_at DESC;
  `;
  const { rows: orders } = await query(ordersQuery);
  
  return res.json({ success: true, data: orders });
});

// PUT /api/orders/:id/status - Atualizar status de um pedido (APENAS ADMIN)
export const updateOrderStatusAdmin = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // TODO: Implementar lógica de autorização para verificar se req.user.role === 'admin'
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ success: false, error: 'O status é obrigatório.' });
  }
  // TODO: Adicionar validação de status válido (ex: 'processing', 'shipped', 'delivered')

  const updateQuery = `
    UPDATE orders SET status = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING id, status;
  `;
  const { rows } = await query(updateQuery, [status, id]);

  if (rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Pedido não encontrado.' });
  }
  
  return res.json({ success: true, data: rows[0] });
});