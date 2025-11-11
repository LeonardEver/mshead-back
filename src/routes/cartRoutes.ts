import express from 'express';
import {
  getCart,
  addToCart,
  removeFromCart,
  updateCartItem,
  clearCart,
} from '../controllers/cartController';
import { protect } from '../middleware/authMiddleware'; 

const router = express.Router();

// Todas as rotas de carrinho precisam de autenticação
router.use(protect);

router.get('/', getCart);
router.post('/', addToCart);
router.put('/:itemId', updateCartItem);
router.delete('/:itemId', removeFromCart);
router.delete('/clear', clearCart); 

export default router;