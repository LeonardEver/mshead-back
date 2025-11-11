import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { query } from '../db';
// Não precisamos mais do tipo 'Category' dos mocks
// import { Category } from '../types';

// GET /api/categories - Buscar todas as categorias
export const getAllCategories = asyncHandler(async (req: Request, res: Response) => {
  const sqlQuery = `
    SELECT * FROM categories
    WHERE is_active = true
    ORDER BY order_index ASC;
  `;
  
  const { rows } = await query(sqlQuery);
  
  res.json({
    success: true,
    data: rows
  });
});

// GET /api/categories/:slug - Buscar categoria por slug
export const getCategoryBySlug = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  
  const sqlQuery = `
    SELECT * FROM categories
    WHERE slug = $1 AND is_active = true;
  `;
  
  const { rows } = await query(sqlQuery, [slug]);
  
  if (rows.length === 0) {
    res.status(404).json({
      success: false,
      error: 'Categoria não encontrada'
    });
    return;
  }
  
  res.json({
    success: true,
    data: rows[0] // Retorna o primeiro (e único) resultado
  });
});

// POST /api/categories - Criar categoria (admin)
// TODO: Proteger esta rota para ser apenas para 'admin'
export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  // Extraímos os dados do corpo da requisição
  const {
    name,
    slug,
    image,
    description,
    parent_id = null, // Valor padrão null se não for fornecido
    order_index = 0,
    seo_title = null,
    seo_description = null
  } = req.body;
  
  // 1. Validar dados (exemplo: verificar se campos obrigatórios existem)
  if (!name || !slug || !image || !description) {
    res.status(400).json({
      success: false,
      error: 'Campos obrigatórios (name, slug, image, description) não foram fornecidos.'
    });
    return;
  }

  // 2. Verificar se slug já existe (como o mock fazia)
  const checkSlugQuery = 'SELECT 1 FROM categories WHERE slug = $1';
  const { rows: existing } = await query(checkSlugQuery, [slug]);
  
  if (existing.length > 0) {
    res.status(400).json({
      success: false,
      error: 'Slug já existe'
    });
    return;
  }
  
  // 3. Inserir no banco
  const insertQuery = `
    INSERT INTO categories (
      name, slug, image, description, parent_id, order_index, seo_title, seo_description
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *; -- Retorna a linha completa que acabou de ser inserida
  `;
  
  const values = [
    name, slug, image, description, parent_id, order_index, seo_title, seo_description
  ];
  
  const { rows: newCategoryRows } = await query(insertQuery, values);
  
  res.status(201).json({
    success: true,
    data: newCategoryRows[0]
  });
});

// PUT /api/categories/:id - Atualizar categoria (admin)
// TODO: Proteger esta rota
export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    name,
    slug,
    image,
    description,
    parent_id,
    is_active,
    order_index,
    seo_title,
    seo_description
  } = req.body;

  // 1. Verificar se a categoria existe
  const checkQuery = 'SELECT * FROM categories WHERE id = $1';
  const { rows: existingRows } = await query(checkQuery, [id]);

  if (existingRows.length === 0) {
    res.status(404).json({
      success: false,
      error: 'Categoria não encontrada'
    });
    return;
  }
  
  const existingCategory = existingRows[0];

  // 2. Verificar se o novo slug (se fornecido) já existe em OUTRA categoria
  if (slug && slug !== existingCategory.slug) {
    const checkSlugQuery = 'SELECT 1 FROM categories WHERE slug = $1 AND id != $2';
    const { rows: conflicting } = await query(checkSlugQuery, [slug, id]);
    if (conflicting.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Slug já existe em outra categoria'
      });
      return;
    }
  }
  
  // 3. Montar a query de atualização
  // Usamos COALESCE para manter o valor antigo se um novo não for fornecido
  const updateQuery = `
    UPDATE categories SET
      name = COALESCE($1, name),
      slug = COALESCE($2, slug),
      image = COALESCE($3, image),
      description = COALESCE($4, description),
      parent_id = COALESCE($5, parent_id),
      is_active = COALESCE($6, is_active),
      order_index = COALESCE($7, order_index),
      seo_title = COALESCE($8, seo_title),
      seo_description = COALESCE($9, seo_description),
      updated_at = CURRENT_TIMESTAMP -- Atualiza automaticamente (trigger já faz isso, mas é bom garantir)
    WHERE id = $10
    RETURNING *;
  `;
  
  const values = [
    name, slug, image, description, parent_id, is_active, order_index, seo_title, seo_description, id
  ];
  
  const { rows: updatedRows } = await query(updateQuery, values);

  res.json({
    success: true,
    data: updatedRows[0]
  });
});

// DELETE /api/categories/:id - Deletar categoria (admin)
// TODO: Proteger esta rota
export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Cuidado: O schema.sql usa 'ON DELETE RESTRICT' para produtos.
  // Isso significa que você NÃO PODE deletar uma categoria se houver produtos
  // associados a ela. Vamos tratar esse erro.

  try {
    const deleteQuery = 'DELETE FROM categories WHERE id = $1 RETURNING id;';
    const { rowCount } = await query(deleteQuery, [id]);
    
    if (rowCount === 0) {
      res.status(404).json({
        success: false,
        error: 'Categoria não encontrada'
      });
      return;
    }
    
    res.json({
      success: true,
      message: 'Categoria deletada com sucesso'
    });

  } catch (error: any) {
    // Verificar se o erro é de restrição de chave estrangeira (fk)
    if (error.code === '23503') { // Código de erro do Postgres para 'foreign_key_violation'
      res.status(400).json({
        success: false,
        error: 'Não é possível deletar esta categoria pois existem produtos associados a ela.'
      });
    } else {
      // Outro erro de banco de dados
      throw error;
    }
  }
});