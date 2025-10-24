-- Script para corrigir a configuração da tabela products no Supabase
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar a estrutura atual da tabela products
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;

-- 2. Alterar a coluna id para usar gen_random_uuid() como padrão
ALTER TABLE products 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3. Verificar se a alteração foi aplicada
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'id';

-- 4. Inserir alguns produtos de teste para verificar se funciona
INSERT INTO products (name, description, price, "categoryId", "preparationTime", "isAvailable") 
VALUES 
('Teste Produto 1', 'Produto de teste', 10.00, (SELECT id FROM categories WHERE name = 'Hambúrgueres' LIMIT 1), 15, true),
('Teste Produto 2', 'Outro produto de teste', 15.00, (SELECT id FROM categories WHERE name = 'Bebidas' LIMIT 1), 5, true);

-- 5. Verificar se os produtos foram inseridos com IDs gerados automaticamente
SELECT id, name, price FROM products WHERE name LIKE 'Teste Produto%';

-- 6. Limpar produtos de teste (opcional)
-- DELETE FROM products WHERE name LIKE 'Teste Produto%';