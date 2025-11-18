// Conteúdo ATUALIZADO para: src/routes/categoryRoutes.ts

import express from 'express';
import {
  getAllCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categoryController';

// Importar os middlewares
import { firebaseProtect } from '../middleware/firebaseAuthMiddleware';
import { adminProtect } from '../middleware/adminMiddleware';

const router = express.Router();

// Rotas públicas
router.get('/', getAllCategories);
router.get('/:slug', getCategoryBySlug);

// Rotas administrativas (Com proteção de Admin)
router.post('/', firebaseProtect, adminProtect, createCategory);
router.put('/:id', firebaseProtect, adminProtect, updateCategory);
router.delete('/:id', firebaseProtect, adminProtect, deleteCategory);

export default router;