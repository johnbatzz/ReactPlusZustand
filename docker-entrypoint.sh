#!/bin/sh
set -e

# Initialize database if it doesn't exist
if [ ! -f /app/data/app.db ]; then
  echo "Initializing database..."
  npx prisma db push --schema=/app/backend/prisma/schema.prisma --skip-generate

  echo "Seeding admin account..."
  node -e "
    const { PrismaClient } = require('@prisma/client');
    const bcrypt = require('bcryptjs');
    const prisma = new PrismaClient();

    async function seed() {
      const existing = await prisma.admin.findUnique({ where: { email: 'admin@school.com' } });
      if (!existing) {
        const hash = await bcrypt.hash('admin123', 10);
        await prisma.admin.create({
          data: { email: 'admin@school.com', password: hash, name: 'Super Admin', role: 'super_admin' }
        });
        console.log('Admin account created: admin@school.com / admin123');
      }
    }
    seed().finally(() => prisma.\$disconnect());
  "
fi

# Start the server
exec node backend/dist/index.js
