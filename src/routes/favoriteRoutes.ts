import express from 'express';
import {
  getFavorites,
  addFavorite,
  removeFavorite
} from '../controllers/favoriteController';

const router = express.Router();

// Todas as rotas de favoritos são protegidas e já usam
// o 'firebaseProtect' aplicado no app.ts

router.route('/')
  .get(getFavorites)   // GET /api/favorites
  .post(addFavorite);  // POST /api/favorites

router.delete('/:productId', removeFavorite); // DELETE /api/favorites/:productId

export default router;