const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

(async () => {
  const prisma = new PrismaClient();
  const email = process.env.ADMIN_EMAIL || 'admin3001@example.com';
  const password = process.env.ADMIN_PASS || 'Admin@12345';
  const name = process.env.ADMIN_NAME || 'Admin 3001';

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log('EXISTING', existing.id);
      process.exit(0);
    }
    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: 'ADMINISTRADOR',
        isActive: true,
      },
    });
    console.log('CREATED', user.id);
    console.log('EMAIL', email);
    console.log('PASS', password);
    process.exit(0);
  } catch (err) {
    console.error('ERR', err);
    process.exit(1);
  }
})();