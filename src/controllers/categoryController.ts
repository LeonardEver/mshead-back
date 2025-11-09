import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { Category } from '../types';

// Dados mock para desenvolvimento (será substituído pelo banco de dados)
const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Bongs',
    slug: 'bongs',
    image: '/images/category-bongs.jpg',
    description: 'Bongs de vidro e acrílico de alta qualidade',
    isActive: true,
    order: 1,
    seoTitle: 'Bongs - Mushco Headshop',
    seoDescription: 'Encontre os melhores bongs de vidro e acrílico na Mushco Headshop',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Acessórios',
    slug: 'acessorios',
    image: '/images/category-acessorios.jpg',
    description: 'Dichavadores, piteiras, isqueiros e outros acessórios',
    isActive: true,
    order: 2,
    seoTitle: 'Acessórios - Mushco Headshop',
    seoDescription: 'Acessórios essenciais para sua experiência',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Vaporizadores',
    slug: 'vaporizadores',
    image: '/images/category-vaporizadores.jpg',
    description: 'Vaporizadores portáteis e de mesa',
    isActive: true,
    order: 3,
    seoTitle: 'Vaporizadores - Mushco Headshop',
    seoDescription: 'Vaporizadores de alta qualidade para uma experiência premium',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// GET /api/categories - Buscar todas as categorias
export const getAllCategories = asyncHandler(async (req: Request, res: Response) => {
  const activeCategories = mockCategories
    .filter(category => category.isActive)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  
  res.json({
    success: true,
    data: activeCategories
  });
});

// GET /api/categories/:slug - Buscar categoria por slug
export const getCategoryBySlug = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const category = mockCategories.find(c => c.slug === slug && c.isActive);
  
  if (!category) {
    res.status(404).json({
      success: false,
      error: 'Categoria não encontrada'
    });
    return;
  }
  
  res.json({
    success: true,
    data: category
  });
});

// POST /api/categories - Criar categoria (admin)
export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const categoryData = req.body;
  
  // Verificar se slug já existe
  const existingCategory = mockCategories.find(c => c.slug === categoryData.slug);
  if (existingCategory) {
    res.status(400).json({
      success: false,
      error: 'Slug já existe'
    });
    return;
  }
  
  // Gerar ID único
  const newCategory: Category = {
    ...categoryData,
    id: Date.now().toString(),
    isActive: categoryData.isActive !== undefined ? categoryData.isActive : true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  mockCategories.push(newCategory);
  
  res.status(201).json({
    success: true,
    data: newCategory
  });
});

// PUT /api/categories/:id - Atualizar categoria (admin)
export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;
  
  const categoryIndex = mockCategories.findIndex(c => c.id === id);
  
  if (categoryIndex === -1) {
    res.status(404).json({
      success: false,
      error: 'Categoria não encontrada'
    });
    return;
  }
  
  // Verificar se novo slug já existe (se estiver sendo alterado)
  if (updateData.slug && updateData.slug !== mockCategories[categoryIndex].slug) {
    const existingCategory = mockCategories.find(c => c.slug === updateData.slug && c.id !== id);
    if (existingCategory) {
      res.status(400).json({
        success: false,
        error: 'Slug já existe'
      });
      return;
    }
  }
  
  mockCategories[categoryIndex] = {
    ...mockCategories[categoryIndex],
    ...updateData,
    updatedAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    data: mockCategories[categoryIndex]
  });
});

// DELETE /api/categories/:id - Deletar categoria (admin)
export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const categoryIndex = mockCategories.findIndex(c => c.id === id);
  
  if (categoryIndex === -1) {
    res.status(404).json({
      success: false,
      error: 'Categoria não encontrada'
    });
    return;
  }
  
  mockCategories.splice(categoryIndex, 1);
  
  res.json({
    success: true,
    message: 'Categoria deletada com sucesso'
  });
});

