import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { Order, CreateOrderRequest } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Dados mock para desenvolvimento (será substituído pelo banco de dados)
const mockOrders: Order[] = [
  {
    id: '1',
    userId: 'user123',
    items: [
      {
        id: '1',
        productId: '1',
        product: {
          id: '1',
          name: 'Bong de Vidro Premium',
          price: 299.99,
          image: '/images/bong-premium.jpg',
          category: 'bongs',
          description: 'Bong de vidro borossilicato de alta qualidade',
          rating: 4.8,
          reviewCount: 24,
          inStock: true,
          features: ['Vidro borossilicato', 'Percolador duplo']
        },
        quantity: 1,
        price: 299.99,
        total: 299.99
      }
    ],
    status: 'confirmed',
    total: 329.99,
    subtotal: 299.99,
    shipping: 30.00,
    tax: 0,
    shippingAddress: {
      street: 'Rua das Flores',
      number: '123',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
      country: 'Brasil'
    },
    paymentMethod: 'credit_card',
    paymentStatus: 'paid',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// POST /api/orders - Criar pedido
export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const orderData: CreateOrderRequest = req.body;
  
  // Validar dados básicos
  if (!orderData.items || orderData.items.length === 0) {
    res.status(400).json({
      success: false,
      error: 'Pedido deve conter pelo menos um item'
    });
    return;
  }
  
  if (!orderData.shippingAddress) {
    res.status(400).json({
      success: false,
      error: 'Endereço de entrega é obrigatório'
    });
    return;
  }
  
  // Calcular totais
  const subtotal = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 200 ? 0 : 30; // Frete grátis acima de R$ 200
  const tax = 0; // Sem impostos por enquanto
  const total = subtotal + shipping + tax;
  
  // Criar itens do pedido com dados dos produtos (mock)
  const orderItems = orderData.items.map(item => ({
    id: uuidv4(),
    productId: item.productId,
    product: {
      id: item.productId,
      name: `Produto ${item.productId}`,
      price: item.price,
      image: '/images/placeholder.jpg',
      category: 'categoria',
      description: 'Descrição do produto',
      rating: 4.5,
      reviewCount: 10,
      inStock: true,
      features: []
    },
    quantity: item.quantity,
    price: item.price,
    total: item.price * item.quantity
  }));
  
  // Criar pedido
  const newOrder: Order = {
    id: uuidv4(),
    userId: 'user123', // TODO: pegar do token de autenticação
    items: orderItems,
    status: 'pending',
    total,
    subtotal,
    shipping,
    tax,
    shippingAddress: orderData.shippingAddress,
    paymentMethod: orderData.paymentMethod,
    paymentStatus: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  mockOrders.push(newOrder);
  
  res.status(201).json({
    success: true,
    data: newOrder
  });
});

// GET /api/orders/user/:userId - Buscar pedidos do usuário
export const getUserOrders = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  
  const userOrders = mockOrders
    .filter(order => order.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  res.json({
    success: true,
    data: userOrders
  });
});

// GET /api/orders/:id - Buscar pedido por ID
export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const order = mockOrders.find(o => o.id === id);
  
  if (!order) {
    res.status(404).json({
      success: false,
      error: 'Pedido não encontrado'
    });
    return;
  }
  
  res.json({
    success: true,
    data: order
  });
});

// PUT /api/orders/:id/status - Atualizar status do pedido (admin)
export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  
  if (!validStatuses.includes(status)) {
    res.status(400).json({
      success: false,
      error: 'Status inválido'
    });
    return;
  }
  
  const orderIndex = mockOrders.findIndex(o => o.id === id);
  
  if (orderIndex === -1) {
    res.status(404).json({
      success: false,
      error: 'Pedido não encontrado'
    });
    return;
  }
  
  mockOrders[orderIndex] = {
    ...mockOrders[orderIndex],
    status,
    updatedAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    data: mockOrders[orderIndex]
  });
});

