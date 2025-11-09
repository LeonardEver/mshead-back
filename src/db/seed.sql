-- Script de seed para popular o banco com dados de exemplo
-- Execute após criar o schema

-- Inserir categorias
INSERT INTO categories (id, name, slug, image, description, is_active, order_index, seo_title, seo_description) VALUES
(uuid_generate_v4(), 'Bongs', 'bongs', '/images/category-bongs.jpg', 'Bongs de vidro e acrílico de alta qualidade para uma experiência premium', true, 1, 'Bongs - Mushco Headshop', 'Encontre os melhores bongs de vidro e acrílico na Mushco Headshop'),
(uuid_generate_v4(), 'Acessórios', 'acessorios', '/images/category-acessorios.jpg', 'Dichavadores, piteiras, isqueiros e outros acessórios essenciais', true, 2, 'Acessórios - Mushco Headshop', 'Acessórios essenciais para sua experiência'),
(uuid_generate_v4(), 'Vaporizadores', 'vaporizadores', '/images/category-vaporizadores.jpg', 'Vaporizadores portáteis e de mesa para uma experiência mais saudável', true, 3, 'Vaporizadores - Mushco Headshop', 'Vaporizadores de alta qualidade para uma experiência premium'),
(uuid_generate_v4(), 'Piteiras', 'piteiras', '/images/category-piteiras.jpg', 'Piteiras de vidro, madeira e outros materiais', true, 4, 'Piteiras - Mushco Headshop', 'Piteiras de qualidade para todos os gostos');

-- Inserir produtos (usando as categorias criadas)
WITH category_ids AS (
    SELECT id, slug FROM categories
)
INSERT INTO products (
    id, name, price, original_price, image, images, category_id, description, 
    rating, review_count, in_stock, stock, is_best_seller, is_new,
    features, specifications, tags, weight, length, width, height
) VALUES
(
    uuid_generate_v4(),
    'Bong de Vidro Premium 35cm',
    299.99,
    399.99,
    '/images/bong-premium-35cm.jpg',
    ARRAY['/images/bong-premium-35cm-1.jpg', '/images/bong-premium-35cm-2.jpg', '/images/bong-premium-35cm-3.jpg'],
    (SELECT id FROM category_ids WHERE slug = 'bongs'),
    'Bong de vidro borossilicato de alta qualidade com percolador duplo. Proporciona uma experiência suave e filtrada. Ideal para uso diário com design elegante e funcional.',
    4.8,
    24,
    true,
    15,
    true,
    false,
    ARRAY['Vidro borossilicato resistente', 'Percolador duplo para filtragem superior', 'Base estável e antiderrapante', 'Fácil limpeza e manutenção', 'Design ergonômico'],
    '{"altura": "35cm", "material": "Vidro borossilicato", "peso": "800g", "diametro_base": "12cm", "espessura_vidro": "5mm"}',
    ARRAY['bong', 'vidro', 'premium', 'percolador', 'borossilicato'],
    0.8,
    15.0,
    15.0,
    35.0
),
(
    uuid_generate_v4(),
    'Dichavador Metálico 4 Partes 63mm',
    89.99,
    NULL,
    '/images/dichavador-metalico-63mm.jpg',
    ARRAY['/images/dichavador-metalico-63mm-1.jpg', '/images/dichavador-metalico-63mm-2.jpg'],
    (SELECT id FROM category_ids WHERE slug = 'acessorios'),
    'Dichavador metálico de 4 partes com ímã forte e compartimento para kief. Construção durável em liga metálica de alta qualidade com dentes afiados para moagem perfeita.',
    4.6,
    18,
    true,
    32,
    false,
    true,
    ARRAY['4 partes com compartimentos separados', 'Ímã forte para fechamento seguro', 'Compartimento especial para kief', 'Material durável e resistente', 'Dentes afiados para moagem eficiente'],
    '{"diametro": "63mm", "material": "Liga metálica", "peso": "150g", "partes": "4", "cor": "Prata"}',
    ARRAY['dichavador', 'metal', '4partes', 'kief', 'ímã'],
    0.15,
    6.3,
    6.3,
    4.0
),
(
    uuid_generate_v4(),
    'Vaporizador Portátil DaVinci IQ2',
    1299.99,
    1499.99,
    '/images/vaporizador-davinci-iq2.jpg',
    ARRAY['/images/vaporizador-davinci-iq2-1.jpg', '/images/vaporizador-davinci-iq2-2.jpg', '/images/vaporizador-davinci-iq2-3.jpg'],
    (SELECT id FROM category_ids WHERE slug = 'vaporizadores'),
    'Vaporizador portátil de última geração com controle preciso de temperatura e aplicativo móvel. Tecnologia de convecção pura para máxima eficiência e sabor.',
    4.9,
    45,
    true,
    8,
    true,
    true,
    ARRAY['Controle preciso de temperatura', 'Aplicativo móvel para controle', 'Bateria de longa duração', 'Tecnologia de convecção pura', 'Design compacto e discreto', 'Câmara de cerâmica'],
    '{"temperatura_min": "120°C", "temperatura_max": "220°C", "bateria": "3500mAh", "tempo_aquecimento": "20 segundos", "material_camara": "Cerâmica", "conectividade": "Bluetooth"}',
    ARRAY['vaporizador', 'portátil', 'davinci', 'bluetooth', 'convecção'],
    0.25,
    9.0,
    3.5,
    2.3
),
(
    uuid_generate_v4(),
    'Piteira de Vidro Colorida 15cm',
    45.99,
    NULL,
    '/images/piteira-vidro-colorida-15cm.jpg',
    ARRAY['/images/piteira-vidro-colorida-15cm-1.jpg', '/images/piteira-vidro-colorida-15cm-2.jpg'],
    (SELECT id FROM category_ids WHERE slug = 'piteiras'),
    'Piteira de vidro artesanal com design colorido único. Cada peça é única com padrões de cores vibrantes. Fácil de limpar e proporciona sabor puro.',
    4.4,
    12,
    true,
    25,
    false,
    false,
    ARRAY['Vidro artesanal de qualidade', 'Design colorido único', 'Fácil limpeza', 'Sabor puro sem interferência', 'Tamanho ideal para portabilidade'],
    '{"comprimento": "15cm", "material": "Vidro borossilicato", "peso": "50g", "diametro": "8mm", "tipo": "Artesanal"}',
    ARRAY['piteira', 'vidro', 'colorida', 'artesanal', 'portátil'],
    0.05,
    15.0,
    0.8,
    0.8
),
(
    uuid_generate_v4(),
    'Bong Acrílico Transparente 25cm',
    79.99,
    NULL,
    '/images/bong-acrilico-25cm.jpg',
    NULL,
    (SELECT id FROM category_ids WHERE slug = 'bongs'),
    'Bong de acrílico resistente e transparente, ideal para iniciantes. Design simples e funcional com excelente custo-benefício.',
    4.2,
    8,
    true,
    20,
    false,
    false,
    ARRAY['Material acrílico resistente', 'Transparente para visualização', 'Leve e portátil', 'Fácil manutenção', 'Ótimo custo-benefício'],
    '{"altura": "25cm", "material": "Acrílico", "peso": "200g", "cor": "Transparente"}',
    ARRAY['bong', 'acrílico', 'transparente', 'iniciante', 'barato'],
    0.2,
    10.0,
    10.0,
    25.0
);

-- Inserir usuários de exemplo
INSERT INTO users (id, name, email, password, role) VALUES
(uuid_generate_v4(), 'Administrador', 'admin@mushco.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO.G', 'admin'), -- senha: admin123
(uuid_generate_v4(), 'Usuário Teste', 'teste@mushco.com', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user'); -- senha: teste123

-- Inserir endereços de exemplo
INSERT INTO addresses (id, street, number, complement, neighborhood, city, state, zip_code, country) VALUES
(uuid_generate_v4(), 'Rua das Flores', '123', 'Apto 45', 'Centro', 'São Paulo', 'SP', '01234-567', 'Brasil'),
(uuid_generate_v4(), 'Avenida Paulista', '1000', NULL, 'Bela Vista', 'São Paulo', 'SP', '01310-100', 'Brasil');

-- Inserir algumas reviews de exemplo
WITH product_user_data AS (
    SELECT 
        p.id as product_id,
        u.id as user_id
    FROM products p
    CROSS JOIN users u
    WHERE u.role = 'user'
    LIMIT 3
)
INSERT INTO reviews (product_id, user_id, rating, title, comment, is_verified_purchase) 
SELECT 
    product_id,
    user_id,
    5,
    'Produto excelente!',
    'Muito satisfeito com a compra. Qualidade excepcional e entrega rápida.',
    true
FROM product_user_data;

