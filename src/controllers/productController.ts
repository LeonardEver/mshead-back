// Conteúdo para: src/controllers/productController.ts

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { query } from '../db';

// GET /api/products - Buscar todos os produtos (com filtros básicos)
export const getAllProducts = asyncHandler(async (req: Request, res: Response) => {
  // Note o uso de aspas duplas para selecionar as colunas camelCase agora
  const text = 'SELECT * FROM products'; 
  const { rows } = await query(text);
  
  // Como renomeamos no banco, o "rows" já virá como { inStock: true, ... }
  // Não precisa mais de mapper manual.
  
  res.status(200).json({
    success: true,
    data: rows,
  });
});

// GET /api/products/:id - Buscar produto por ID
export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  // O schema.sql mostra que o ID é UUID, o que é ótimo.
  const sqlQuery = `
    SELECT * FROM products
    WHERE id = $1;
  `;
  
  const { rows } = await query(sqlQuery, [id]);
  
  if (rows.length === 0) {
    res.status(404).json({
      success: false,
      error: 'Produto não encontrado'
    });
    return;
  }
  
  res.json({
    success: true,
    data: rows[0]
  });
});

export const getProductsByCategory = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  
  // Query com JOIN para buscar produtos pelo SLUG da categoria
  const sqlQuery = `
    SELECT p.* FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE c.slug = $1 AND p.in_stock = true;
  `;
  
  const { rows } = await query(sqlQuery, [slug]);
  
  // Não é um erro se não vier nada, apenas uma categoria vazia
  res.json({
    success: true,
    data: rows
  });
});

// Adicionar esta função também em src/controllers/productController.ts

// GET /api/products/search?q=... - Buscar produtos
export const searchProducts = asyncHandler(async (req: Request, res: Response) => {
  const { q } = req.query;

  if (typeof q !== 'string' || q.trim() === '') {
    res.status(400).json({
      success: false,
      error: 'Termo de busca (q) é obrigatório.'
    });
    return;
  }

  // O schema.sql 
  // cria índices de Full-Text Search, vamos usá-los!
  const searchTerm = q.trim();
  
  const sqlQuery = `
    SELECT * FROM products
    WHERE 
      (
        to_tsvector('portuguese', name) @@ plainto_tsquery('portuguese', $1)
        OR
        to_tsvector('portuguese', description) @@ plainto_tsquery('portuguese', $1)
      )
      AND in_stock = true;
  `;
  
  const { rows } = await query(sqlQuery, [searchTerm]);
  
  res.json({
    success: true,
    data: rows
  });
});

// POST /api/products - Criar produto (admin)
// TODO: Proteger esta rota
export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const {
    name,
    price,
    image,
    category_id,
    description,
    stock = 0,
    original_price = null,
    images = [],
    is_best_seller = false,
    is_new = false,
    specifications = {},
    tags = []
  } = req.body;
  
  // Validação básica
  if (!name || !price || !image || !category_id || !description) {
    res.status(400).json({
      success: false,
      error: 'Campos obrigatórios (name, price, image, category_id, description) não foram fornecidos.'
    });
    return;
  }
  
  const insertQuery = `
    INSERT INTO products (
      name, price, image, category_id, description, stock, 
      original_price, images, is_best_seller, is_new, specifications, tags
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *;
  `;
  
  const values = [
    name, price, image, category_id, description, stock,
    original_price, images, is_best_seller, is_new, specifications, tags
  ];
  
  const { rows: newProductRows } = await query(insertQuery, values);
  
  res.status(201).json({
    success: true,
    data: newProductRows[0]
  });
});

// PUT /api/products/:id - Atualizar produto (admin)
// TODO: Proteger esta rota
export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    name,
    price,
    original_price,
    image,
    images,
    category_id,
    description,
    stock,
    is_best_seller,
    is_new,
    specifications,
    tags
  } = req.body;

  // 1. Verificar se o produto existe
  const checkQuery = 'SELECT * FROM products WHERE id = $1';
  const { rows: existingRows } = await query(checkQuery, [id]);

  if (existingRows.length === 0) {
    res.status(404).json({
      success: false,
      error: 'Produto não encontrado'
    });
    return;
  }
  
  // 2. Montar a query de atualização com COALESCE
  const updateQuery = `
    UPDATE products SET
      name = COALESCE($1, name),
      price = COALESCE($2, price),
      original_price = COALESCE($3, original_price),
      image = COALESCE($4, image),
      images = COALESCE($5, images),
      category_id = COALESCE($6, category_id),
      description = COALESCE($7, description),
      stock = COALESCE($8, stock),
      is_best_seller = COALESCE($9, is_best_seller),
      is_new = COALESCE($10, is_new),
      specifications = COALESCE($11, specifications),
      tags = COALESCE($12, tags),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $13
    RETURNING *;
  `;
  
  const values = [
    name, price, original_price, image, images, category_id, description,
    stock, is_best_seller, is_new, specifications, tags,
    id
  ];
  
  const { rows: updatedRows } = await query(updateQuery, values);

  res.json({
    success: true,
    data: updatedRows[0]
  });
});

// DELETE /api/products/:id - Deletar produto (admin)
// TODO: Proteger esta rota
export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  // O schema.sql 
  // usa 'ON DELETE RESTRICT' em 'order_items'.
  // Devemos tratar o erro se alguém tentar deletar um produto que já foi pedido.

  try {
    const deleteQuery = 'DELETE FROM products WHERE id = $1 RETURNING id;';
    const { rowCount } = await query(deleteQuery, [id]);
    
    if (rowCount === 0) {
      res.status(404).json({
        success: false,
        error: 'Produto não encontrado'
      });
      return;
    }
    
    res.json({
      success: true,
      message: 'Produto deletado com sucesso'
    });

  } catch (error: any) {
    // Verificar se o erro é de restrição de chave estrangeira (fk)
    if (error.code === '23503') { // Código de erro do Postgres
      res.status(400).json({
        success: false,
        error: 'Não é possível deletar este produto pois ele está associado a pedidos existentes.'
      });
    } else {
      // Outro erro de banco de dados
      throw error;
    }
  }
});