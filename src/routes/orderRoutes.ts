// Conteúdo ATUALIZADO para: src/routes/orderRoutes.ts

import express from 'express';
import {
  createOrder,
  getOrderHistory,
  getOrderDetails,
  getAllOrdersAdmin,
  updateOrderStatusAdmin,
} from '../controllers/orderController';
// import { protect } from '../middleware/authMiddleware'; // Não é mais necessário
import { adminProtect } from '../middleware/adminMiddleware'; 

const router = express.Router();

// Rotas de Utilizador (Já protegidas em app.ts)
// router.use(protect); // Removido

router.route('/')
  .post(createOrder) // POST /api/orders (Checkout)
  .get(getOrderHistory); // GET /api/orders (Histórico)

router.get('/:id', getOrderDetails); // GET /api/orders/:id

// Rotas de Administrador (Com proteção de Admin)
router.get('/admin', adminProtect, getAllOrdersAdmin); // Só admin pode ver todas
router.put('/admin/:id/status', adminProtect, updateOrderStatusAdmin); // Só admin pode atualizar

export default router;