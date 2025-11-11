import express from 'express';
import {
  createOrder,
  getOrderHistory,
  getOrderDetails,
  getAllOrdersAdmin,
  updateOrderStatusAdmin,
} from '../controllers/orderController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Rotas de Utilizador (Protegidas)
router.use(protect);

router.route('/')
  .post(createOrder) // POST /api/orders (Checkout)
  .get(getOrderHistory); // GET /api/orders (Histórico)

router.get('/:id', getOrderDetails); // GET /api/orders/:id

// Rotas de Administrador (TODO: Adicionar middleware de admin)
// Usamos rotas diferentes por enquanto, mas serão protegidas mais tarde
router.get('/admin', getAllOrdersAdmin);
router.put('/admin/:id/status', updateOrderStatusAdmin);

export default router;