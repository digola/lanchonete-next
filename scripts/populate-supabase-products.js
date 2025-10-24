const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function populateProducts() {
  try {
    console.log('🚀 Iniciando população de produtos no Supabase...');

    // Primeiro, buscar as categorias existentes
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name')
      .eq('isActive', true);

    if (categoriesError) {
      console.error('❌ Erro ao buscar categorias:', categoriesError);
      return;
    }

    console.log(`✅ Encontradas ${categories.length} categorias:`, categories.map(c => c.name));

    // Criar um mapa de categorias por nome
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name] = cat.id;
    });

    // Produtos para inserir (sem campo id)
    const products = [
      // Hambúrgueres
      {
        name: 'X-Burger Clássico',
        description: 'Hambúrguer artesanal com queijo, alface, tomate e molho especial',
        price: 18.90,
        imageUrl: '',
        categoryId: categoryMap['Hambúrgueres'] || categoryMap['Lanches'],
        preparationTime: 15,
        isAvailable: true
      },
      {
        name: 'X-Bacon',
        description: 'Hambúrguer com bacon crocante, queijo e molho barbecue',
        price: 22.90,
        imageUrl: '',
        categoryId: categoryMap['Hambúrgueres'] || categoryMap['Lanches'],
        preparationTime: 18,
        isAvailable: true
      },
      {
        name: 'X-Tudo',
        description: 'Hambúrguer completo com ovo, bacon, queijo, presunto e salada',
        price: 26.90,
        imageUrl: '',
        categoryId: categoryMap['Hambúrgueres'] || categoryMap['Lanches'],
        preparationTime: 20,
        isAvailable: true
      },
      {
        name: 'Chicken Burger',
        description: 'Hambúrguer de frango grelhado com maionese temperada',
        price: 19.90,
        imageUrl: '',
        categoryId: categoryMap['Hambúrgueres'] || categoryMap['Lanches'],
        preparationTime: 16,
        isAvailable: true
      },
      // Bebidas
      {
        name: 'Coca-Cola 350ml',
        description: 'Refrigerante Coca-Cola gelado',
        price: 5.50,
        imageUrl: '',
        categoryId: categoryMap['Bebidas'],
        preparationTime: 2,
        isAvailable: true
      },
      {
        name: 'Suco de Laranja',
        description: 'Suco natural de laranja 300ml',
        price: 7.90,
        imageUrl: '',
        categoryId: categoryMap['Bebidas'],
        preparationTime: 3,
        isAvailable: true
      },
      {
        name: 'Água Mineral',
        description: 'Água mineral sem gás 500ml',
        price: 3.50,
        imageUrl: '',
        categoryId: categoryMap['Bebidas'],
        preparationTime: 1,
        isAvailable: true
      },
      {
        name: 'Guaraná Antarctica',
        description: 'Refrigerante Guaraná Antarctica 350ml',
        price: 5.50,
        imageUrl: '',
        categoryId: categoryMap['Bebidas'],
        preparationTime: 2,
        isAvailable: true
      },
      // Acompanhamentos
      {
        name: 'Batata Frita Grande',
        description: 'Porção de batata frita crocante',
        price: 14.90,
        imageUrl: '',
        categoryId: categoryMap['Acompanhamentos'],
        preparationTime: 12,
        isAvailable: true
      },
      {
        name: 'Onion Rings',
        description: 'Anéis de cebola empanados e fritos',
        price: 16.90,
        imageUrl: '',
        categoryId: categoryMap['Acompanhamentos'],
        preparationTime: 10,
        isAvailable: true
      },
      {
        name: 'Nuggets 10 unidades',
        description: 'Nuggets de frango crocantes',
        price: 18.90,
        imageUrl: '',
        categoryId: categoryMap['Acompanhamentos'],
        preparationTime: 8,
        isAvailable: true
      }
    ];

    console.log(`📦 Inserindo ${products.length} produtos...`);

    // Inserir produtos um por um para melhor controle de erros
    let successCount = 0;
    let errorCount = 0;

    for (const product of products) {
      try {
        // Verificar se o produto já existe
        const { data: existingProduct } = await supabase
          .from('products')
          .select('id, name')
          .eq('name', product.name)
          .single();

        if (existingProduct) {
          console.log(`⚠️ Produto "${product.name}" já existe, pulando...`);
          continue;
        }

        // Inserir produto
        const { data, error } = await supabase
          .from('products')
          .insert([product])
          .select();

        if (error) {
          console.error(`❌ Erro ao inserir produto "${product.name}":`, error);
          errorCount++;
        } else {
          console.log(`✅ Produto "${product.name}" inserido com sucesso`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Erro inesperado ao inserir produto "${product.name}":`, err);
        errorCount++;
      }
    }

    console.log(`\n📊 Resumo da inserção:`);
    console.log(`✅ Produtos inseridos com sucesso: ${successCount}`);
    console.log(`❌ Produtos com erro: ${errorCount}`);

    // Verificar produtos inseridos
    const { data: allProducts, error: verifyError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        price,
        isAvailable,
        category:categories(name)
      `)
      .eq('isAvailable', true)
      .order('name');

    if (verifyError) {
      console.error('❌ Erro ao verificar produtos:', verifyError);
    } else {
      console.log(`\n🔍 Produtos atualmente no banco (${allProducts.length}):`);
      allProducts.forEach(product => {
        console.log(`  - ${product.name} (${product.category?.name}) - R$ ${product.price}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar o script
populateProducts()
  .then(() => {
    console.log('\n🎉 Script finalizado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });