import express from 'express';
import {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus
} from '../controllers/orderController';

const router = express.Router();

// Rotas de pedidos
router.post('/', createOrder);
router.get('/user/:userId', getUserOrders);
router.get('/:id', getOrderById);

// Rotas administrativas (TODO: adicionar middleware de autenticação)
router.put('/:id/status', updateOrderStatus);

export default router;

