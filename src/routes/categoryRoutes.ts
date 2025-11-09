import express from 'express';
import {
  getAllCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categoryController';

const router = express.Router();

// Rotas públicas
router.get('/', getAllCategories);
router.get('/:slug', getCategoryBySlug);

// Rotas administrativas (TODO: adicionar middleware de autenticação)
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;

