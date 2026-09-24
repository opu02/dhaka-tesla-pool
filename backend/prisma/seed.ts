
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.poolMember.deleteMany();
  await prisma.rideRequest.deleteMany();
  await prisma.pool.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  // Create Driver — Jashim
  const jashim = await prisma.user.create({
    data: {
      name: 'Jashim Uddin',
      email: 'jashim@tesla.bd',
      passwordHash: await bcrypt.hash('jashim123', 10),
      role: 'DRIVER',
      phone: '01711000001',
    },
  });

  // Create Bullet — Jashim's Tesla
  const bullet = await prisma.vehicle.create({
    data: {
      name: 'Bullet',
      capacity: 3,
      isOnline: true,
      driverId: jashim.id,
    },
  });

  // Create Passengers
  const nusrat = await prisma.user.create({
    data: {
      name: 'Nusrat Jahan',
      email: 'nusrat@passenger.bd',
      passwordHash: await bcrypt.hash('nusrat123', 10),
      role: 'PASSENGER',
      phone: '01711000002',
    },
  });

  const rafiq = await prisma.user.create({
    data: {
      name: 'Rafiq Islam',
      email: 'rafiq@passenger.bd',
      passwordHash: await bcrypt.hash('rafiq123', 10),
      role: 'PASSENGER',
      phone: '01711000003',
    },
  });

  const shirin = await prisma.user.create({
    data: {
      name: 'Shirin Akter',
      email: 'shirin@passenger.bd',
      passwordHash: await bcrypt.hash('shirin123', 10),
      role: 'PASSENGER',
      phone: '01711000004',
    },
  });

  // Create Pool for Bullet
  const pool = await prisma.pool.create({
    data: {
      vehicleId: bullet.id,
      availableSeats: 3,
      status: 'OPEN',
    },
  });

  // Nusrat requests ride — Banani to Mohakhali
  const nusratRide = await prisma.rideRequest.create({
    data: {
      passengerId: nusrat.id,
      pickupArea: 'Banani',
      destinationArea: 'Mohakhali',
      pickupLat: 23.7937,
      pickupLng: 90.4066,
      seatsRequested: 1,
      farePaisa: 3500,
      status: 'MATCHED',
      poolId: pool.id,
    },
  });

  await prisma.poolMember.create({
    data: {
      poolId: pool.id,
      rideRequestId: nusratRide.id,
      farePaisa: 3500,
    },
  });

  // Rafiq requests ride — Banani to Gulshan 1
  const rafiqRide = await prisma.rideRequest.create({
    data: {
      passengerId: rafiq.id,
      pickupArea: 'Banani',
      destinationArea: 'Gulshan1',
      pickupLat: 23.7937,
      pickupLng: 90.4066,
      seatsRequested: 1,
      farePaisa: 3000,
      status: 'MATCHED',
      poolId: pool.id,
    },
  });

  await prisma.poolMember.create({
    data: {
      poolId: pool.id,
      rideRequestId: rafiqRide.id,
      farePaisa: 3000,
    },
  });

  // Update pool — 2 seats taken
  await prisma.pool.update({
    where: { id: pool.id },
    data: { availableSeats: 1 },
  });

  // Shirin — waiting (concurrency test)
  await prisma.rideRequest.create({
    data: {
      passengerId: shirin.id,
      pickupArea: 'Banani',
      destinationArea: 'Farmgate',
      pickupLat: 23.7937,
      pickupLng: 90.4066,
      seatsRequested: 1,
      farePaisa: 3200,
      status: 'REQUESTED',
    },
  });

  console.log('✅ Seed complete!');
  console.log('👤 Driver: jashim@tesla.bd / jashim123');
  console.log('👤 Passenger: nusrat@passenger.bd / nusrat123');
  console.log('👤 Passenger: rafiq@passenger.bd / rafiq123');
  console.log('👤 Passenger: shirin@passenger.bd / shirin123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());