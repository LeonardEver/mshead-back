// Conteúdo ATUALIZADO para: src/routes/productRoutes.ts

import express from 'express';
import {
  getAllProducts,
  getProductById,
  getProductsByCategory,
  searchProducts,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController';

// Importar os middlewares
import { firebaseProtect } from '../middleware/firebaseAuthMiddleware';
import { adminProtect } from '../middleware/adminMiddleware';

const router = express.Router();

// Rotas públicas
router.get('/', getAllProducts);
router.get('/search', searchProducts);
router.get('/category/:category', getProductsByCategory);
router.get('/:id', getProductById);

// Rotas administrativas (Com proteção de Admin)
router.post('/', firebaseProtect, adminProtect, createProduct);
router.put('/:id', firebaseProtect, adminProtect, updateProduct);
router.delete('/:id', firebaseProtect, adminProtect, deleteProduct);

export default router;