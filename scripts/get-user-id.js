import prisma from '../src/lib/prisma.js';

async function getUserId() {
  try {
    const users = await prisma.users.findMany({
      select: {
        spotify_id: true,
        display_name: true,
      },
    });

    console.log('Users in database:');
    users.forEach((user) => {
      console.log(`  Spotify ID: ${user.spotify_id}, Name: ${user.display_name}`);
    });
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getUserId();
