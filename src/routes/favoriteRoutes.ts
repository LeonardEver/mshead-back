import express from 'express';
import {
  getFavorites,
  addFavorite,
  removeFavorite
} from '../controllers/favoriteController';
// Adicione o import
import { firebaseProtect } from '../middleware/firebaseAuthMiddleware';

const router = express.Router();

// Garanta a proteção aqui
router.use(firebaseProtect);

router.route('/')
  .get(getFavorites)
  .post(addFavorite);

router.delete('/:productId', removeFavorite);

export default router;