import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  async createVehicle(driverId: string, data: { name: string; capacity: number }) {
    return this.prisma.vehicle.create({
      data: {
        name: data.name,
        capacity: data.capacity,
        driverId,
      },
    });
  }

  async getMyVehicle(driverId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { driverId },
      include: {
        pools: {
          where: { status: { in: ['OPEN', 'FULL', 'STARTED'] } },
          include: {
            rideRequests: {
              include: { passenger: { select: { id: true, name: true, phone: true } } },
            },
          },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException('No vehicle found for this driver');
    }

    return vehicle;
  }

  async toggleOnline(driverId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { driverId },
    });

    if (!vehicle) {
      throw new NotFoundException('No vehicle found');
    }

    return this.prisma.vehicle.update({
      where: { driverId },
      data: { isOnline: !vehicle.isOnline },
    });
  }

  async getOnlineVehicles() {
    return this.prisma.vehicle.findMany({
      where: { isOnline: true },
      include: {
        driver: { select: { id: true, name: true, phone: true } },
        pools: {
          where: { status: 'OPEN' },
          select: { id: true, availableSeats: true },
        },
      },
    });
  }
}