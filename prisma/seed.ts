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
      role: 'ADMIN',
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
      role: 'STAFF',
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
      role: 'CUSTOMER',
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

  // Criar um pedido de exemplo com item contendo observações (notes)
  try {
    const mesa1 = await prisma.table.findUnique({ where: { number: 1 } });
    const xBurger = await prisma.product.findFirst({ where: { name: 'X-Burger Clássico' } });

    if (mesa1 && xBurger) {
      const pedidoExemplo = await prisma.order.create({
        data: {
          userId: cliente.id,
          status: 'PENDENTE',
          total: xBurger.price * 1,
          deliveryType: 'RETIRADA',
          paymentMethod: 'DINHEIRO',
          notes: 'Pedido de seed com observações',
          tableId: mesa1.id,
          items: {
            create: {
              productId: xBurger.id,
              quantity: 1,
              price: xBurger.price,
              notes: 'alface',
            },
          },
        },
      });

      console.log('✅ Pedido de exemplo criado com notas no item:', pedidoExemplo.id);
    } else {
      console.log('ℹ️ Não foi possível criar pedido de exemplo: mesa ou produto não encontrados.');
    }
  } catch (e) {
    console.log('⚠️ Falha ao criar pedido de exemplo com notes (provavelmente modelo Orders não disponível neste ambiente):', e);
  }

  // Criar configurações públicas (Settings) quando disponível (ambiente Postgres)
  const publicSettings = [
    {
      category: 'general',
      key: 'restaurantName',
      value: JSON.stringify('Lanchonete Delícia'),
      description: 'Nome do restaurante',
      isActive: true,
    },
    {
      category: 'general',
      key: 'restaurantAddress',
      value: JSON.stringify('Rua das Flores, 123 - Centro'),
      description: 'Endereço do restaurante',
      isActive: true,
    },
    {
      category: 'general',
      key: 'restaurantPhone',
      value: JSON.stringify('(11) 99999-9999'),
      description: 'Telefone do restaurante',
      isActive: true,
    },
    {
      category: 'general',
      key: 'restaurantEmail',
      value: JSON.stringify('contato@lanchonete.com'),
      description: 'E-mail de contato do restaurante',
      isActive: true,
    },
    {
      category: 'general',
      key: 'openingTime',
      value: JSON.stringify('08:00'),
      description: 'Horário de abertura',
      isActive: true,
    },
    {
      category: 'general',
      key: 'closingTime',
      value: JSON.stringify('22:00'),
      description: 'Horário de fechamento',
      isActive: true,
    },
    {
      category: 'general',
      key: 'workingDays',
      value: JSON.stringify(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']),
      description: 'Dias de funcionamento',
      isActive: true,
    },
    {
      category: 'general',
      key: 'currency',
      value: JSON.stringify('BRL'),
      description: 'Moeda padrão',
      isActive: true,
    },
    {
      category: 'general',
      key: 'language',
      value: JSON.stringify('pt-BR'),
      description: 'Idioma padrão',
      isActive: true,
    },
    {
      category: 'general',
      key: 'timezone',
      value: JSON.stringify('America/Sao_Paulo'),
      description: 'Timezone padrão da aplicação',
      isActive: true,
    },
  ];

  // Se o modelo Settings existir (Postgres), cria/atualiza os registros
  const settingsModel = (prisma as any).settings;
  if (settingsModel && settingsModel.findFirst && settingsModel.create) {
    for (const s of publicSettings) {
      const existing = await settingsModel.findFirst({ where: { category: s.category, key: s.key } });
      if (existing) {
        await settingsModel.update({ where: { id: existing.id }, data: s });
      } else {
        await settingsModel.create({ data: s });
      }
    }
    console.log('✅ Configurações públicas (Settings) criadas/atualizadas');
  } else {
    console.log('ℹ️ Modelo Settings não está disponível neste ambiente (provavelmente SQLite). Pulando seed de Settings.');
  }

  // ===== SEED DE ADICIONAIS =====
  console.log('\n🍗 Criando adicionais...');

  // Criar adicionais para hambúrgueres
  const adicionaisHamburger = [
    {
      name: 'Bacon',
      description: 'Bacon crocante premium',
      price: 2.50,
      maxQuantity: 3,
    },
    {
      name: 'Ovo Frito',
      description: 'Ovo frito fresco',
      price: 1.50,
      maxQuantity: 2,
    },
    {
      name: 'Queijo Extra',
      description: 'Muçarela em fatias',
      price: 1.50,
      maxQuantity: 3,
    },
    {
      name: 'Salada',
      description: 'Alface e tomate frescos',
      price: 0.00,
      maxQuantity: 1,
    },
    {
      name: 'Cebola Caramelizada',
      description: 'Cebola caramelizada artesanal',
      price: 1.00,
      maxQuantity: 2,
    },
    {
      name: 'Abacate',
      description: 'Fatias de abacate fresco',
      price: 3.00,
      maxQuantity: 2,
    },
  ];

  // Criar adicionais para bebidas
  const adicionaisBebidas = [
    {
      name: 'Gelo Extra',
      description: 'Mais gelo na bebida',
      price: 0.00,
      maxQuantity: 1,
    },
    {
      name: 'Limão',
      description: 'Fatias de limão',
      price: 0.50,
      maxQuantity: 1,
    },
  ];

  // Criar adicionais para pizzas
  const adicionaisPizzas = [
    {
      name: 'Queijo Extra',
      description: 'Muçarela extra derretida',
      price: 4.00,
      maxQuantity: 2,
    },
    {
      name: 'Borda Recheada',
      description: 'Borda recheada com catupiry',
      price: 5.00,
      maxQuantity: 1,
    },
    {
      name: 'Adicional de Pepperoni',
      description: 'Mais pepperoni na pizza',
      price: 3.50,
      maxQuantity: 2,
    },
  ];

  // Criar adicionais para sucos
  const adicionaisSucos = [
    {
      name: 'Abacaxi',
      description: 'Suco natural de abacaxi',
      price: 0.00,
      maxQuantity: 1,
    },
    {
      name: 'Morango',
      description: 'Suco natural de morango',
      price: 0.00,
      maxQuantity: 1,
    },
    {
      name: 'Goiaba',
      description: 'Suco natural de goiaba',
      price: 0.00,
      maxQuantity: 1,
    },
  ];

  // Inserir adicionais no BD
  const adicionaisCriados: Record<string, any> = {};

  for (const grupo of [
    { items: adicionaisHamburger, key: 'hamburger' },
    { items: adicionaisBebidas, key: 'bebidas' },
    { items: adicionaisPizzas, key: 'pizzas' },
    { items: adicionaisSucos, key: 'sucos' },
  ]) {
    adicionaisCriados[grupo.key] = [];
    for (const adicional of grupo.items) {
      // Buscar existente primeiro
      let created = await prisma.adicional.findFirst({
        where: { name: adicional.name },
      });

      // Se não existe, criar
      if (!created) {
        created = await prisma.adicional.create({
          data: {
            name: adicional.name,
            description: adicional.description,
            price: adicional.price,
            maxQuantity: adicional.maxQuantity,
            isAvailable: true,
          },
        });
      }
      adicionaisCriados[grupo.key].push(created);
    }
  }

  console.log(`✅ ${Object.values(adicionaisCriados).flat().length} adicionais criados`);

  // ===== ASSOCIAR ADICIONAIS AOS PRODUTOS =====
  console.log('\n🔗 Associando adicionais aos produtos...');

  const hamburgerClassico = await prisma.product.findFirst({ where: { name: 'X-Burger Clássico' } });
  const hamburgerBacon = await prisma.product.findFirst({ where: { name: 'X-Bacon' } });
  const hamburgerTudo = await prisma.product.findFirst({ where: { name: 'X-Tudo' } });
  const sucoLaranja = await prisma.product.findFirst({ where: { name: 'Suco de Laranja 300ml' } });
  const pizzaMargherita = await prisma.product.findFirst({ where: { name: 'Pizza Margherita' } });
  const pizzaPepperoni = await prisma.product.findFirst({ where: { name: 'Pizza Pepperoni' } });

  // Associações para hambúrgueres
  if (hamburgerClassico && adicionaisCriados.hamburger) {
    for (const adicional of adicionaisCriados.hamburger) {
      await prisma.productAdicional.upsert({
        where: {
          productId_adicionalId: {
            productId: hamburgerClassico.id,
            adicionalId: adicional.id,
          },
        },
        update: {},
        create: {
          productId: hamburgerClassico.id,
          adicionalId: adicional.id,
          isRequired: false,
        },
      });
    }
  }

  if (hamburgerBacon && adicionaisCriados.hamburger) {
    for (const adicional of adicionaisCriados.hamburger) {
      await prisma.productAdicional.upsert({
        where: {
          productId_adicionalId: {
            productId: hamburgerBacon.id,
            adicionalId: adicional.id,
          },
        },
        update: {},
        create: {
          productId: hamburgerBacon.id,
          adicionalId: adicional.id,
          isRequired: false,
        },
      });
    }
  }

  if (hamburgerTudo && adicionaisCriados.hamburger) {
    for (const adicional of adicionaisCriados.hamburger) {
      await prisma.productAdicional.upsert({
        where: {
          productId_adicionalId: {
            productId: hamburgerTudo.id,
            adicionalId: adicional.id,
          },
        },
        update: {},
        create: {
          productId: hamburgerTudo.id,
          adicionalId: adicional.id,
          isRequired: false,
        },
      });
    }
  }

  // Associações para sucos
  if (sucoLaranja && adicionaisCriados.sucos) {
    for (const adicional of adicionaisCriados.sucos) {
      await prisma.productAdicional.upsert({
        where: {
          productId_adicionalId: {
            productId: sucoLaranja.id,
            adicionalId: adicional.id,
          },
        },
        update: {},
        create: {
          productId: sucoLaranja.id,
          adicionalId: adicional.id,
          isRequired: false,
        },
      });
    }
  }

  // Associações para pizzas
  if (pizzaMargherita && adicionaisCriados.pizzas) {
    for (const adicional of adicionaisCriados.pizzas) {
      await prisma.productAdicional.upsert({
        where: {
          productId_adicionalId: {
            productId: pizzaMargherita.id,
            adicionalId: adicional.id,
          },
        },
        update: {},
        create: {
          productId: pizzaMargherita.id,
          adicionalId: adicional.id,
          isRequired: false,
        },
      });
    }
  }

  if (pizzaPepperoni && adicionaisCriados.pizzas) {
    for (const adicional of adicionaisCriados.pizzas) {
      await prisma.productAdicional.upsert({
        where: {
          productId_adicionalId: {
            productId: pizzaPepperoni.id,
            adicionalId: adicional.id,
          },
        },
        update: {},
        create: {
          productId: pizzaPepperoni.id,
          adicionalId: adicional.id,
          isRequired: false,
        },
      });
    }
  }

  // Associações para bebidas
  const cocaCola = await prisma.product.findFirst({ where: { name: 'Coca-Cola 350ml' } });
  if (cocaCola && adicionaisCriados.bebidas) {
    for (const adicional of adicionaisCriados.bebidas) {
      await prisma.productAdicional.upsert({
        where: {
          productId_adicionalId: {
            productId: cocaCola.id,
            adicionalId: adicional.id,
          },
        },
        update: {},
        create: {
          productId: cocaCola.id,
          adicionalId: adicional.id,
          isRequired: false,
        },
      });
    }
  }

  console.log(`✅ Adicionais associados aos produtos`);

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('\n📋 Dados criados:');
  console.log('👤 Usuários:');
  console.log('  - admin@lanchonete.com (senha: 123456)');
  console.log('  - funcionario@lanchonete.com (senha: 123456)');
  console.log('  - cliente@lanchonete.com (senha: 123456)');
  console.log('📦 Categorias: 5 categorias');
  console.log('🍔 Produtos: 10 produtos');
  console.log('🪑 Mesas: 10 mesas');
  console.log('🍗 Adicionais: 18 adicionais');
  console.log('🔗 Associações: Adicionais vinculados aos produtos');
  console.log('⚙️ Configurações: público (se modelo Settings disponível)');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
