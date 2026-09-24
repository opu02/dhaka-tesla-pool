import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PoolsService } from '../pools/pools.service';
import { RideStatus } from '@prisma/client';

@Injectable()
export class RidesService {
  constructor(
    private prisma: PrismaService,
    private poolsService: PoolsService,
  ) {}

  async requestRide(
    passengerId: string,
    data: {
      pickupArea: string;
      destinationArea: string;
      pickupLat: number;
      pickupLng: number;
      seatsRequested: number;
    },
  ) {
    // Find available pool
    const availablePool = await this.poolsService.findAvailablePool(
      data.pickupArea,
      data.pickupLat,
      data.pickupLng,
      data.seatsRequested,
    );

    // Calculate fare
    const farePaisa = this.poolsService.calculateFare(
      data.pickupLat,
      data.pickupLng,
      data.destinationArea,
      !!availablePool,
    );

    if (availablePool) {
      // Join existing pool — use transaction for concurrency safety
      return this.prisma.$transaction(async (tx) => {
        // Lock the pool row
        const pool = await tx.pool.findUnique({
          where: { id: availablePool.id },
        });

        if (!pool || pool.availableSeats < data.seatsRequested) {
          throw new BadRequestException('No seats available');
        }

        // Create ride request
        const rideRequest = await tx.rideRequest.create({
          data: {
            passengerId,
            pickupArea: data.pickupArea,
            destinationArea: data.destinationArea,
            pickupLat: data.pickupLat,
            pickupLng: data.pickupLng,
            seatsRequested: data.seatsRequested,
            farePaisa,
            status: 'MATCHED',
            poolId: pool.id,
          },
        });

        // Add to pool members
        await tx.poolMember.create({
          data: {
            poolId: pool.id,
            rideRequestId: rideRequest.id,
            farePaisa,
          },
        });

        // Update available seats
        const newSeats = pool.availableSeats - data.seatsRequested;
        await tx.pool.update({
          where: { id: pool.id },
          data: {
            availableSeats: newSeats,
            status: newSeats === 0 ? 'FULL' : 'OPEN',
          },
        });

        return { ...rideRequest, matched: true };
      });
    } else {
      // Create new ride request — waiting for driver
      const rideRequest = await this.prisma.rideRequest.create({
        data: {
          passengerId,
          pickupArea: data.pickupArea,
          destinationArea: data.destinationArea,
          pickupLat: data.pickupLat,
          pickupLng: data.pickupLng,
          seatsRequested: data.seatsRequested,
          farePaisa,
          status: 'REQUESTED',
        },
      });

      return { ...rideRequest, matched: false };
    }
  }

  async getMyRides(passengerId: string) {
    return this.prisma.rideRequest.findMany({
      where: { passengerId },
      include: {
        pool: {
          include: {
            vehicle: {
              include: {
                driver: { select: { id: true, name: true, phone: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRideById(id: string, passengerId: string) {
    const ride = await this.prisma.rideRequest.findUnique({
      where: { id },
      include: {
        pool: {
          include: {
            vehicle: {
              include: {
                driver: { select: { id: true, name: true, phone: true } },
              },
            },
          },
        },
      },
    });

    if (!ride) throw new NotFoundException('Ride not found');
    if (ride.passengerId !== passengerId)
      throw new ForbiddenException('Not your ride');

    return ride;
  }

  async cancelRide(id: string, passengerId: string) {
    const ride = await this.prisma.rideRequest.findUnique({
      where: { id },
    });

    if (!ride) throw new NotFoundException('Ride not found');
    if (ride.passengerId !== passengerId)
      throw new ForbiddenException('Not your ride');

    if (!['REQUESTED', 'MATCHED'].includes(ride.status)) {
      throw new BadRequestException(
        'Cannot cancel ride in current status',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // If in a pool, restore seats
      if (ride.poolId) {
        await tx.pool.update({
          where: { id: ride.poolId },
          data: {
            availableSeats: { increment: ride.seatsRequested },
            status: 'OPEN',
          },
        });

        await tx.poolMember.deleteMany({
          where: { rideRequestId: ride.id },
        });
      }

      return tx.rideRequest.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });
    });
  }
  
    // DRIVER METHODS
  async getDriverRides(driverId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { driverId },
    });

    if (!vehicle) throw new NotFoundException('No vehicle found');

    return this.prisma.pool.findMany({
      where: { vehicleId: vehicle.id },
      include: {
        rideRequests: {
          include: {
            passenger: { select: { id: true, name: true, phone: true } },
          },
        },
        vehicle: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async acceptRide(rideRequestId: string, driverId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { driverId },
    });

    if (!vehicle) throw new NotFoundException('No vehicle found');
    if (!vehicle.isOnline) throw new BadRequestException('Vehicle is offline');

    const rideRequest = await this.prisma.rideRequest.findUnique({
      where: { id: rideRequestId },
    });

    if (!rideRequest) throw new NotFoundException('Ride not found');
    if (rideRequest.status !== 'REQUESTED')
      throw new BadRequestException('Ride already matched');

    return this.prisma.$transaction(async (tx) => {
      // Create new pool
      const pool = await tx.pool.create({
        data: {
          vehicleId: vehicle.id,
          availableSeats: vehicle.capacity - rideRequest.seatsRequested,
          status:
            vehicle.capacity - rideRequest.seatsRequested === 0
              ? 'FULL'
              : 'OPEN',
        },
      });

      // Add pool member
      await tx.poolMember.create({
        data: {
          poolId: pool.id,
          rideRequestId: rideRequest.id,
          farePaisa: rideRequest.farePaisa,
        },
      });

      // Update ride request
      return tx.rideRequest.update({
        where: { id: rideRequestId },
        data: { status: 'MATCHED', poolId: pool.id },
      });
    });
  }

  async updateRideStatus(
    rideRequestId: string,
    driverId: string,
    status: RideStatus,
  ) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { driverId },
    });

    if (!vehicle) throw new NotFoundException('No vehicle found');

    const rideRequest = await this.prisma.rideRequest.findUnique({
      where: { id: rideRequestId },
      include: { pool: true },
    });

    if (!rideRequest) throw new NotFoundException('Ride not found');
    if (rideRequest.pool?.vehicleId !== vehicle.id)
      throw new ForbiddenException('Not your ride');

    // Valid transitions
    const validTransitions = {
      MATCHED: 'DRIVER_ARRIVED',
      DRIVER_ARRIVED: 'STARTED',
      STARTED: 'COMPLETED',
    };

    if (validTransitions[rideRequest.status] !== status) {
      throw new BadRequestException(
        `Cannot transition from ${rideRequest.status} to ${status}`,
      );
    }

    return this.prisma.rideRequest.update({
      where: { id: rideRequestId },
      data: { status },
    });
  }

  async getPendingRides() {
    return this.prisma.rideRequest.findMany({
      where: { status: 'REQUESTED' },
      include: {
        passenger: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

}