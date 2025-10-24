-- Script para popular o banco Supabase com dados de exemplo
-- Execute este script no SQL Editor do Supabase

-- Inserir categorias
INSERT INTO categories (name, description, color, "isActive", "createdAt", "updatedAt") VALUES
('Lanches', 'Hambúrgueres e sanduíches deliciosos', '#FF6B35', true, NOW(), NOW()),
('Bebidas', 'Refrigerantes, sucos e águas', '#4ECDC4', true, NOW(), NOW()),
('Sobremesas', 'Doces e sobremesas irresistíveis', '#FFE66D', true, NOW(), NOW()),
('Porções', 'Batata frita, onion rings e petiscos', '#9B59B6', true, NOW(), NOW());

-- Inserir produtos (assumindo que as categorias foram criadas com IDs sequenciais)
INSERT INTO products (name, description, price, "imageUrl", "categoryId", "isAvailable", "createdAt", "updatedAt") VALUES
-- Lanches (categoria 1)
('X-Burger Clássico', 'Hambúrguer artesanal com queijo, alface, tomate e molho especial', 18.90, '/images/products/x-burger-classico.jpg', 1, true, NOW(), NOW()),
('X-Bacon', 'Hambúrguer com bacon crocante, queijo e molho barbecue', 22.90, '/images/products/x-bacon.jpg', 1, true, NOW(), NOW()),
('X-Tudo', 'Hambúrguer completo com ovo, bacon, queijo, presunto e salada', 26.90, '/images/products/x-tudo.jpg', 1, true, NOW(), NOW()),
('Chicken Burger', 'Hambúrguer de frango grelhado com maionese temperada', 19.90, '/images/products/chicken-burger.jpg', 1, true, NOW(), NOW()),

-- Bebidas (categoria 2)
('Coca-Cola 350ml', 'Refrigerante Coca-Cola gelado', 5.50, '/images/products/coca-cola.jpg', 2, true, NOW(), NOW()),
('Suco de Laranja', 'Suco natural de laranja 300ml', 7.90, '/images/products/suco-laranja.jpg', 2, true, NOW(), NOW()),
('Água Mineral', 'Água mineral sem gás 500ml', 3.50, '/images/products/agua-mineral.jpg', 2, true, NOW(), NOW()),
('Guaraná Antarctica', 'Refrigerante Guaraná Antarctica 350ml', 5.50, '/images/products/guarana.jpg', 2, true, NOW(), NOW()),

-- Sobremesas (categoria 3)
('Pudim de Leite', 'Pudim caseiro com calda de caramelo', 8.90, '/images/products/pudim.jpg', 3, true, NOW(), NOW()),
('Brownie com Sorvete', 'Brownie de chocolate com sorvete de baunilha', 12.90, '/images/products/brownie.jpg', 3, true, NOW(), NOW()),
('Açaí 300ml', 'Açaí cremoso com granola e banana', 11.90, '/images/products/acai.jpg', 3, true, NOW(), NOW()),

-- Porções (categoria 4)
('Batata Frita Grande', 'Porção de batata frita crocante', 14.90, '/images/products/batata-frita.jpg', 4, true, NOW(), NOW()),
('Onion Rings', 'Anéis de cebola empanados e fritos', 16.90, '/images/products/onion-rings.jpg', 4, true, NOW(), NOW()),
('Nuggets 10 unidades', 'Nuggets de frango crocantes', 18.90, '/images/products/nuggets.jpg', 4, true, NOW(), NOW());

-- Verificar se os dados foram inseridos
SELECT 'Categorias inseridas:' as info;
SELECT id, name, "isActive" FROM categories ORDER BY id;

SELECT 'Produtos inseridos:' as info;
SELECT p.id, p.name, p.price, c.name as categoria, p."isAvailable" 
FROM products p 
JOIN categories c ON p."categoryId" = c.id 
ORDER BY c.name, p.name;