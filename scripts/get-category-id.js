const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  const name = process.env.CATEGORY_NAME || 'Lanches';
  try {
    let category = await prisma.category.findUnique({ where: { name } });
    if (!category) {
      category = await prisma.category.create({
        data: {
          name,
          description: 'Categoria criada automaticamente para testes',
          color: '#FF9900',
          isActive: true,
        },
      });
      console.log('CREATED', category.id);
    } else {
      console.log('EXISTING', category.id);
    }
    console.log('ID', category.id);
    console.log('NAME', category.name);
    process.exit(0);
  } catch (err) {
    console.error('ERR', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();