import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar usuários iniciais
  const hashedPassword = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@lanchonete.com' },
    update: {},
    create: {
      email: 'admin@lanchonete.com',
      name: 'Administrador',
      password: hashedPassword,
      role: 'ADMINISTRADOR',
      isActive: true,
    },
  });

  const funcionario = await prisma.user.upsert({
    where: { email: 'funcionario@lanchonete.com' },
    update: {},
    create: {
      email: 'funcionario@lanchonete.com',
      name: 'João Funcionário',
      password: hashedPassword,
      role: 'FUNCIONARIO',
      isActive: true,
    },
  });

  const cliente = await prisma.user.upsert({
    where: { email: 'cliente@lanchonete.com' },
    update: {},
    create: {
      email: 'cliente@lanchonete.com',
      name: 'Maria Cliente',
      password: hashedPassword,
      role: 'CLIENTE',
      isActive: true,
    },
  });

  console.log('✅ Usuários criados:', { admin: admin.email, funcionario: funcionario.email, cliente: cliente.email });

  // Criar categorias
  const categorias = [
    {
      name: 'Hambúrgueres',
      description: 'Deliciosos hambúrgueres artesanais',
      icon: '',
      color: '#f97316',
    },
    {
      name: 'Bebidas',
      description: 'Refrigerantes, sucos e bebidas geladas',
      icon: '',
      color: '#3b82f6',
    },
    {
      name: 'Acompanhamentos',
      description: 'Batatas, saladas e outros acompanhamentos',
      icon: '',
      color: '#10b981',
    },
    {
      name: 'Sobremesas',
      description: 'Doces e sobremesas deliciosas',
      icon: '',
      color: '#f59e0b',
    },
    {
      name: 'Pizzas',
      description: 'Pizzas artesanais com ingredientes frescos',
      icon: '',
      color: '#ef4444',
    },
  ];

  for (const categoria of categorias) {
    await prisma.category.upsert({
      where: { name: categoria.name },
      update: {},
      create: {
        name: categoria.name,
        description: categoria.description,
        icon: categoria.icon,
        color: categoria.color,
        isActive: true,
      },
    });
  }

  console.log('✅ Categorias criadas');

  // Buscar categorias criadas para usar nos produtos
  const categoriaHamburguer = await prisma.category.findUnique({ where: { name: 'Hambúrgueres' } });
  const categoriaBebidas = await prisma.category.findUnique({ where: { name: 'Bebidas' } });
  const categoriaAcompanhamentos = await prisma.category.findUnique({ where: { name: 'Acompanhamentos' } });
  const categoriaSobremesas = await prisma.category.findUnique({ where: { name: 'Sobremesas' } });
  const categoriaPizzas = await prisma.category.findUnique({ where: { name: 'Pizzas' } });

  // Criar produtos
  const produtos = [
    // Hambúrgueres
    {
      name: 'X-Burger Clássico',
      description: 'Hambúrguer artesanal com queijo, alface, tomate e molho especial',
      price: 18.90,
      categoryId: categoriaHamburguer?.id,
      preparationTime: 15,
      allergens: 'Glúten, Lactose',
    },
    {
      name: 'X-Bacon',
      description: 'Hambúrguer com bacon crocante, queijo, alface e tomate',
      price: 22.90,
      categoryId: categoriaHamburguer?.id,
      preparationTime: 18,
      allergens: 'Glúten, Lactose',
    },
    {
      name: 'X-Tudo',
      description: 'Hambúrguer completo com bacon, ovo, queijo, alface e tomate',
      price: 26.90,
      categoryId: categoriaHamburguer?.id,
      preparationTime: 20,
      allergens: 'Glúten, Lactose, Ovo',
    },
    // Bebidas
    {
      name: 'Coca-Cola 350ml',
      description: 'Refrigerante Coca-Cola gelado',
      price: 4.50,
      categoryId: categoriaBebidas?.id,
      preparationTime: 2,
      allergens: null,
    },
    {
      name: 'Suco de Laranja 300ml',
      description: 'Suco natural de laranja',
      price: 6.90,
      categoryId: categoriaBebidas?.id,
      preparationTime: 5,
      allergens: null,
    },
    // Acompanhamentos
    {
      name: 'Batata Frita',
      description: 'Porção de batata frita crocante',
      price: 8.90,
      categoryId: categoriaAcompanhamentos?.id,
      preparationTime: 10,
      allergens: 'Glúten',
    },
    {
      name: 'Onion Rings',
      description: 'Anéis de cebola empanados e fritos',
      price: 12.90,
      categoryId: categoriaAcompanhamentos?.id,
      preparationTime: 12,
      allergens: 'Glúten, Lactose',
    },
    // Sobremesas
    {
      name: 'Sorvete de Chocolate',
      description: 'Sorvete cremoso de chocolate',
      price: 9.90,
      categoryId: categoriaSobremesas?.id,
      preparationTime: 3,
      allergens: 'Lactose, Glúten',
    },
    // Pizzas
    {
      name: 'Pizza Margherita',
      description: 'Pizza com molho de tomate, mussarela e manjericão',
      price: 35.90,
      categoryId: categoriaPizzas?.id,
      preparationTime: 25,
      allergens: 'Glúten, Lactose',
    },
    {
      name: 'Pizza Pepperoni',
      description: 'Pizza com molho de tomate, mussarela e pepperoni',
      price: 42.90,
      categoryId: categoriaPizzas?.id,
      preparationTime: 25,
      allergens: 'Glúten, Lactose',
    },
  ];

  for (const produto of produtos) {
    if (produto.categoryId) {
      await prisma.product.create({
        data: {
          ...produto,
          categoryId: produto.categoryId,
        },
      });
    }
  }

  console.log('✅ Produtos criados');

  // Criar mesas
  const mesas = [];
  for (let i = 1; i <= 10; i++) {
    mesas.push({
      number: i,
      capacity: i <= 4 ? 4 : i <= 7 ? 6 : 8,
      status: 'LIVRE' as const,
    });
  }

  for (const mesa of mesas) {
    await prisma.table.upsert({
      where: { number: mesa.number },
      update: {},
      create: mesa,
    });
  }

  console.log('✅ Mesas criadas');

  // Criar configurações do sistema
  const configuracoes = [
    {
      key: 'restaurant_name',
      value: JSON.stringify('Lanchonete Delícia'),
      description: 'Nome do restaurante',
    },
    {
      key: 'restaurant_address',
      value: JSON.stringify('Rua das Flores, 123 - Centro'),
      description: 'Endereço do restaurante',
    },
    {
      key: 'restaurant_phone',
      value: JSON.stringify('(11) 99999-9999'),
      description: 'Telefone do restaurante',
    },
    {
      key: 'delivery_fee',
      value: JSON.stringify(5.00),
      description: 'Taxa de entrega',
    },
    {
      key: 'min_order_value',
      value: JSON.stringify(20.00),
      description: 'Valor mínimo do pedido',
    },
    {
      key: 'delivery_time',
      value: JSON.stringify(45),
      description: 'Tempo médio de entrega em minutos',
    },
  ];

  // Comentado para SQLite - modelo systemSettings não existe
  // for (const config of configuracoes) {
  //   await prisma.systemSettings.upsert({
  //     where: { key: config.key },
  //     update: {},
  //     create: config,
  //   });
  // }

  // console.log('✅ Configurações do sistema criadas');

  console.log('🎉 Seed concluído com sucesso!');
  console.log('\n📋 Dados criados:');
  console.log('👤 Usuários:');
  console.log('  - admin@lanchonete.com (senha: 123456)');
  console.log('  - funcionario@lanchonete.com (senha: 123456)');
  console.log('  - cliente@lanchonete.com (senha: 123456)');
  console.log('📦 Categorias: 5 categorias');
  console.log('🍔 Produtos: 10 produtos');
  console.log('🪑 Mesas: 10 mesas');
  console.log('⚙️ Configurações: 6 configurações');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
