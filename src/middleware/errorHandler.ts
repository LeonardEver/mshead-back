import { Request, Response, NextFunction } from 'express';

// Wrapper para funções async que automaticamente captura erros
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Middleware de tratamento de erros
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;

  // Log do erro
  // console.error('❌ Erro:', err);

  // Erro de validação do Mongoose
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val: any) => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // Erro de cast do Mongoose (ID inválido)
  if (err.name === 'CastError') {
    const message = 'Recurso não encontrado';
    error = { message, statusCode: 404 };
  }

  // Erro de duplicação (código 11000)
  if (err.code === 11000) {
    const message = 'Recurso duplicado';
    error = { message, statusCode: 400 };
  }

  // Erro de PostgreSQL
  if (err.code) {
    switch (err.code) {
      case '23505': // Violação de constraint única
        error = { message: 'Recurso já existe', statusCode: 400 };
        break;
      case '23503': // Violação de foreign key
        error = { message: 'Referência inválida', statusCode: 400 };
        break;
      case '23502': // Violação de not null
        error = { message: 'Campo obrigatório não informado', statusCode: 400 };
        break;
      case '22P02': // Tipo de dado inválido
        error = { message: 'Formato de dados inválido', statusCode: 400 };
        break;
      default:
        error = { message: 'Erro interno do servidor', statusCode: 500 };
    }
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Erro interno do servidor'
  });
};

