# Mushco Headshop - Backend API (PostgreSQL)

Backend API para o e-commerce de tabacaria Mushco Headshop, desenvolvido em Node.js com Express, TypeScript e PostgreSQL.

## 🚀 Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **TypeScript** - Tipagem estática
- **PostgreSQL** - Banco de dados relacional
- **pg** - Driver PostgreSQL para Node.js
- **JWT** - Autenticação
- **bcryptjs** - Hash de senhas
- **CORS** - Cross-Origin Resource Sharing
- **Helmet** - Segurança HTTP
- **Morgan** - Logging de requisições

## 📁 Estrutura do Projeto

```
src/
├── app.ts              # Configuração principal do Express
├── types/              # Definições de tipos TypeScript
│   └── index.ts
├── routes/             # Definição das rotas da API
│   ├── productRoutes.ts
│   ├── categoryRoutes.ts
│   ├── orderRoutes.ts
│   └── cartRoutes.ts
├── controllers/        # Lógica de negócio para cada rota
│   ├── productController.ts
│   ├── categoryController.ts
│   ├── orderController.ts
│   └── cartController.ts
├── db/                 # Configuração do banco de dados
│   ├── index.ts        # Conexão PostgreSQL
│   ├── schema.sql      # Schema das tabelas
│   └── seed.sql        # Dados de exemplo
└── middleware/         # Middlewares personalizados
    ├── errorHandler.ts
    └── notFound.ts
```

## 🛠️ Instalação e Configuração

### Pré-requisitos

- Node.js (versão 18 ou superior)
- PostgreSQL (versão 12 ou superior)
- npm ou yarn

### Instalação

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd mushco-headshop-backend-fixed
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
# Configurações do servidor
PORT=3001
NODE_ENV=development

# Configurações do banco de dados PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mushco_headshop
DB_USER=postgres
DB_PASSWORD=postgres

# Configurações de autenticação
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Configurações de CORS
CORS_ORIGIN=http://localhost:5173
```

### Configuração do Banco de Dados

1. **Criar o banco de dados:**
```sql
CREATE DATABASE mushco_headshop;
```

2. **Executar o schema:**
```bash
psql -U postgres -d mushco_headshop -f src/db/schema.sql
```

3. **Popular com dados de exemplo:**
```bash
psql -U postgres -d mushco_headshop -f src/db/seed.sql
```

### Iniciar o Servidor

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

O servidor estará rodando em `http://localhost:3001`

## 📚 API Endpoints

### Produtos

- `GET /api/products` - Listar todos os produtos
- `GET /api/products/:id` - Buscar produto por ID
- `GET /api/products/category/:category` - Buscar produtos por categoria
- `GET /api/products/search` - Buscar produtos com filtros
- `POST /api/products` - Criar produto (admin)
- `PUT /api/products/:id` - Atualizar produto (admin)
- `DELETE /api/products/:id` - Deletar produto (admin)

### Categorias

- `GET /api/categories` - Listar todas as categorias
- `GET /api/categories/:slug` - Buscar categoria por slug
- `POST /api/categories` - Criar categoria (admin)
- `PUT /api/categories/:id` - Atualizar categoria (admin)
- `DELETE /api/categories/:id` - Deletar categoria (admin)

### Pedidos

- `POST /api/orders` - Criar pedido
- `GET /api/orders/user/:userId` - Buscar pedidos do usuário
- `GET /api/orders/:id` - Buscar pedido por ID
- `PUT /api/orders/:id/status` - Atualizar status do pedido (admin)

### Carrinho

- `POST /api/cart/:userId/sync` - Sincronizar carrinho
- `GET /api/cart/:userId` - Buscar carrinho do usuário

### Health Check

- `GET /health` - Verificar status da API

## 🗄️ Schema do Banco de Dados

### Principais Tabelas

- **users** - Usuários do sistema
- **categories** - Categorias de produtos
- **products** - Produtos do e-commerce
- **orders** - Pedidos realizados
- **order_items** - Itens dos pedidos
- **addresses** - Endereços de entrega
- **cart_items** - Itens do carrinho (persistente)
- **reviews** - Avaliações dos produtos

### Recursos Avançados

- **Triggers automáticos** para atualizar timestamps
- **Cálculo automático** de desconto baseado no preço original
- **Atualização automática** de rating baseado nas reviews
- **Índices otimizados** para busca e performance
- **Busca full-text** em português para produtos
- **Constraints** para garantir integridade dos dados

## 🔧 Scripts Disponíveis

- `npm run dev` - Inicia o servidor em modo desenvolvimento
- `npm run build` - Compila o TypeScript para JavaScript
- `npm start` - Inicia o servidor em produção
- `npm test` - Executa os testes

## 📊 Exemplos de Uso

### Buscar produtos com filtros:
```bash
GET /api/products/search?query=bong&category=bongs&minPrice=100&maxPrice=500&page=1&limit=10
```

### Criar um pedido:
```bash
POST /api/orders
Content-Type: application/json

{
  "items": [
    {
      "productId": "uuid-do-produto",
      "quantity": 1,
      "price": 299.99
    }
  ],
  "shippingAddress": {
    "street": "Rua das Flores",
    "number": "123",
    "neighborhood": "Centro",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01234-567",
    "country": "Brasil"
  },
  "paymentMethod": "credit_card"
}
```

## 🔒 Segurança

- **Helmet** - Configuração de headers de segurança
- **CORS** - Controle de acesso cross-origin
- **bcryptjs** - Hash de senhas
- **JWT** - Tokens de autenticação
- **Validação de entrada** - Sanitização de dados
- **SQL Injection Protection** - Queries parametrizadas

## 🚀 Deploy

### Desenvolvimento Local
```bash
npm run dev
```

### Produção
```bash
npm run build
npm start
```

### Docker (opcional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

## 🧪 Testes

Para executar os testes:
```bash
npm test
```

## 📝 Logs

Os logs são gerados usando Morgan e incluem:
- Requisições HTTP
- Queries do banco de dados
- Erros de aplicação
- Conexões com banco de dados

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença ISC.

## 📞 Suporte

Para suporte, entre em contato através do email: suporte@mushco.com

---

Desenvolvido com ❤️ para Mushco Headshop

