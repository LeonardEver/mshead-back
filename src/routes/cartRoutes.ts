import express from 'express';
import {
  syncCart,
  getCart
} from '../controllers/cartController';

const router = express.Router();

// Rotas de carrinho
router.post('/:userId/sync', syncCart);
router.get('/:userId', getCart);

export default router;

