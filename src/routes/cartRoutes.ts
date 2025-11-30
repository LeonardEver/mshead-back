import express from 'express';
import {
  getCart,
  addToCart,
  removeFromCart,
  updateCartItem,
  clearCart,
} from '../controllers/cartController';
// MUDE ISTO: de 'authMiddleware' para 'firebaseAuthMiddleware'
// e de 'protect' para 'firebaseProtect'
import { firebaseProtect } from '../middleware/firebaseAuthMiddleware'; 

const router = express.Router();

// Aplique o middleware correto do Firebase
router.use(firebaseProtect);

router.get('/', getCart);
router.post('/', addToCart);
router.put('/:itemId', updateCartItem);
router.delete('/:itemId', removeFromCart);
router.delete('/clear', clearCart); 

export default router;