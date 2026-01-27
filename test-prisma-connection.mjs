import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔌 Testing Prisma/PostgreSQL connection...');
    await prisma.$connect();
    console.log('✅ Successfully connected to PostgreSQL');

    // Test a simple query
    const userCount = await prisma.users.count();
    console.log(`📊 Found ${userCount} users in database`);

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Prisma connection failed:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testConnection();
