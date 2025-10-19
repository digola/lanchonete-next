const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  const catId = process.argv[2];
  if (!catId) {
    console.error('Usage: node scripts/test-create-product.js <categoryId>');
    process.exit(1);
  }
  try {
    const p = await prisma.product.create({
      data: {
        name: 'Teste via Node',
        description: 'Teste',
        price: 10.5,
        categoryId: catId,
      },
    });
    console.log('OK:' + p.id);
  } catch (e) {
    console.error('ERR:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();