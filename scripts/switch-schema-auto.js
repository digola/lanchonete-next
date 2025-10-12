// Auto switch Prisma schema based on DATABASE_URL
// Uses PostgreSQL schema if DATABASE_URL starts with 'postgres://' or 'postgresql://'
// Otherwise defaults to SQLite schema

const fs = require('fs');
const path = require('path');

function main() {
  try {
    const dbUrl = process.env.DATABASE_URL || '';
    const prismaDir = path.join(process.cwd(), 'prisma');

    const usePostgres = /^postgres(ql)?:\/\//i.test(dbUrl);
    const sourceFile = usePostgres ? 'schema-postgresql.prisma' : 'schema-sqlite.prisma';
    const sourcePath = path.join(prismaDir, sourceFile);
    const targetPath = path.join(prismaDir, 'schema.prisma');

    if (!fs.existsSync(sourcePath)) {
      console.error(`[switch-schema-auto] Source schema not found: ${sourcePath}`);
      process.exit(1);
    }

    fs.copyFileSync(sourcePath, targetPath);
    console.log(`[switch-schema-auto] Active schema set to: ${sourceFile} -> schema.prisma`);
  } catch (err) {
    console.error('[switch-schema-auto] Failed to switch schema:', err);
    process.exit(1);
  }
}

main();