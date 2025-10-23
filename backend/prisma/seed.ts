import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create a demo user
  const hashedPassword = await hashPassword('demo123456');

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@syncnotesai.com' },
    update: {},
    create: {
      email: 'demo@syncnotesai.com',
      password: hashedPassword,
      name: 'Demo User',
      company: 'SyncNotesAI Demo',
    },
  });

  console.log('✅ Created demo user:', demoUser.email);

  // Create a sample meeting
  const sampleMeeting = await prisma.meeting.create({
    data: {
      title: 'Team Standup - Monday',
      description: 'Weekly team standup meeting',
      meetingUrl: 'https://zoom.us/j/sample',
      platform: 'zoom',
      status: 'scheduled',
      userId: demoUser.id,
    },
  });

  console.log('✅ Created sample meeting:', sampleMeeting.title);

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
