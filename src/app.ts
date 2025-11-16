import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, query } from './db';
import { errorHandler, notFound } from './middleware/errorHandler';
import { firebaseProtect } from './middleware/firebaseAuthMiddleware'; // Importa o novo middleware

// Importar Rotas
import categoryRoutes from './routes/categoryRoutes';
import productRoutes from './routes/productRoutes';
import cartRoutes from './routes/cartRoutes';
import orderRoutes from './routes/orderRoutes';
// NÃO precisamos mais de authRoutes

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
}));
app.use(express.json());

// --- Rotas da API ---

// Rotas públicas
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);

// Rotas protegidas (carrinho, pedidos)
// Note que elas agora usam o firebaseProtect!
app.use('/api/cart', firebaseProtect, cartRoutes);
app.use('/api/orders', firebaseProtect, orderRoutes);

// NÃO precisamos mais das rotas /api/auth
// app.use('/api/auth', authRoutes);


// Rota de Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    env: NODE_ENV,
    db: 'connected' // Assumindo que connectDB lida com a falha
  });
});

// Middlewares de Erro
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌍 Ambiente: ${NODE_ENV}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
});