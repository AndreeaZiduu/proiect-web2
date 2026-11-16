import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Parola123!', 10);

  await prisma.user.upsert({
    where: { email: 'admin@farmaciisibiu.ro' },
    update: {},
    create: {
      email: 'admin@farmaciisibiu.ro',
      name: 'Admin Sibiu',
      passwordHash,
      role: 'ADMIN'
    }
  });

  await prisma.user.upsert({
    where: { email: 'moderator@farmaciisibiu.ro' },
    update: {},
    create: {
      email: 'moderator@farmaciisibiu.ro',
      name: 'Moderator Sibiu',
      passwordHash,
      role: 'MODERATOR'
    }
  });

  await prisma.user.upsert({
    where: { email: 'user@farmaciisibiu.ro' },
    update: {},
    create: {
      email: 'user@farmaciisibiu.ro',
      name: 'Utilizator Test',
      passwordHash,
      role: 'USER'
    }
  });

  const existingCount = await prisma.facility.count();
  if (existingCount === 0) {
    await prisma.facility.create({
      data: {
        name: 'Farmacia Help Net - Bulevardul Mihai Viteazu (Non-Stop)',
        type: 'PHARMACY',
        address: 'Bulevardul Mihai Viteazu nr. 13, Sibiu',
        city: 'Sibiu',
        latitude: 45.7824,
        longitude: 24.1481,
        phone: '0269 242 222',
        sourceName: 'Colegiul Farmaciștilor Sibiu / Site oficial Help Net',
        services: {
          create: [
            { serviceName: 'Program Non-Stop' },
            { serviceName: 'Eliberare rețete compensate' },
            { serviceName: 'Măsurare tensiune' }
          ]
        },
        regularSchedules: {
          create: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
            dayOfWeek: day,
            openMinute: 0,
            closeMinute: 1440,
            crossesMidnight: false
          }))
        }
      }
    });

    await prisma.facility.create({
      data: {
        name: 'Centrul de Permanență Cedonia Sibiu',
        type: 'PERMANENCE_CENTER',
        address: 'Strada Nicolae Iorga nr. 50, Sibiu',
        city: 'Sibiu',
        latitude: 45.7795,
        longitude: 24.1558,
        phone: '0269 211 999',
        sourceName: 'DSP Sibiu - Lista Centrelor de Permanență',
        services: {
          create: [
            { serviceName: 'Urgențe medicale minore' },
            { serviceName: 'Consultații medicină de familie' },
            { serviceName: 'Tratamente injectabile' }
          ]
        },
        regularSchedules: {
          create: [
            ...[1, 2, 3, 4, 5].map((day) => ({
              dayOfWeek: day,
              openMinute: 15 * 60,
              closeMinute: 8 * 60,
              crossesMidnight: true
            })),
            ...[0, 6].map((day) => ({
              dayOfWeek: day,
              openMinute: 8 * 60,
              closeMinute: 8 * 60,
              crossesMidnight: true
            }))
          ]
        }
      }
    });
  }

  console.log('Seed finalizat cu succes!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
