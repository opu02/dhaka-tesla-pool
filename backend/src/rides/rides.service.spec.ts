import { Test, TestingModule } from '@nestjs/testing';
import { RidesService } from './rides.service';
import { PrismaService } from '../prisma/prisma.service';
import { PoolsService } from '../pools/pools.service';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

const mockPrisma = {
  rideRequest: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  pool: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  poolMember: {
    create: jest.fn(),
    deleteMany: jest.fn(),
  },
  vehicle: {
    findUnique: jest.fn(),
  },
  $transaction: jest.fn((fn) => fn(mockPrisma)),
};

const mockPoolsService = {
  findAvailablePool: jest.fn(),
  calculateFare: jest.fn(),
  isCompatiblePickup: jest.fn(),
};

describe('RidesService', () => {
  let service: RidesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RidesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PoolsService, useValue: mockPoolsService },
      ],
    }).compile();

    service = module.get<RidesService>(RidesService);
    jest.clearAllMocks();
  });

  // Test 1: Fare calculation
  describe('Fare Calculation', () => {
    it('should apply pool discount for Nusrat and Rafiq', () => {
      const poolsService = new PoolsService(mockPrisma as any);

      // Nusrat: Banani → Mohakhali (pooled)
      const nusratFare = poolsService.calculateFare(
        23.7937, 90.4066, 'Mohakhali', true
      );

      // Rafiq: Banani → Gulshan1 (pooled)
      const rafiqFare = poolsService.calculateFare(
        23.7937, 90.4066, 'Gulshan1', true
      );

      // Pool discount applied (1000 paisa = 10 taka)
      const nusratFareNoPool = poolsService.calculateFare(
        23.7937, 90.4066, 'Mohakhali', false
      );

      expect(nusratFare).toBeLessThan(nusratFareNoPool);
      expect(nusratFare).toBeGreaterThan(0);
      expect(rafiqFare).toBeGreaterThan(0);
    });
  });

  // Test 2: Capacity enforcement
  describe('Pool Capacity', () => {
    it('should not exceed Bullet capacity of 3 seats', async () => {
      mockPoolsService.findAvailablePool.mockResolvedValue({
        id: 'pool-1',
        availableSeats: 0,
      });
      mockPoolsService.calculateFare.mockReturnValue(3500);
      mockPrisma.pool.findUnique.mockResolvedValue({
        id: 'pool-1',
        availableSeats: 0,
      });

      await expect(
        service.requestRide('passenger-1', {
          pickupArea: 'Banani',
          destinationArea: 'Mohakhali',
          pickupLat: 23.7937,
          pickupLng: 90.4066,
          seatsRequested: 1,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // Test 3: Invalid state transitions
  describe('Ride Status Transitions', () => {
    it('should reject invalid state transition', async () => {
      mockPrisma.vehicle.findUnique.mockResolvedValue({
        id: 'vehicle-1',
        driverId: 'driver-1',
      });
      mockPrisma.rideRequest.findUnique.mockResolvedValue({
        id: 'ride-1',
        status: 'REQUESTED',
        pool: { vehicleId: 'vehicle-1' },
      });

      await expect(
        service.updateRideStatus('ride-1', 'driver-1', 'COMPLETED'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow valid transition MATCHED → DRIVER_ARRIVED', async () => {
      mockPrisma.vehicle.findUnique.mockResolvedValue({
        id: 'vehicle-1',
        driverId: 'driver-1',
      });
      mockPrisma.rideRequest.findUnique.mockResolvedValue({
        id: 'ride-1',
        status: 'MATCHED',
        pool: { vehicleId: 'vehicle-1' },
      });
      mockPrisma.rideRequest.update.mockResolvedValue({
        id: 'ride-1',
        status: 'DRIVER_ARRIVED',
      });

      const result = await service.updateRideStatus(
        'ride-1', 'driver-1', 'DRIVER_ARRIVED'
      );
      expect(result.status).toBe('DRIVER_ARRIVED');
    });
  });

  // Test 4: Users can't modify another user's ride
  describe('Authorization', () => {
    it('should not allow passenger to cancel another passenger ride', async () => {
      mockPrisma.rideRequest.findUnique.mockResolvedValue({
        id: 'ride-1',
        passengerId: 'nusrat-id',
        status: 'REQUESTED',
        poolId: null,
      });

      await expect(
        service.cancelRide('ride-1', 'rafiq-id'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // Test 5: Cancellation rules
  describe('Cancellation', () => {
    it('should not allow cancellation after STARTED', async () => {
      mockPrisma.rideRequest.findUnique.mockResolvedValue({
        id: 'ride-1',
        passengerId: 'passenger-1',
        status: 'STARTED',
        poolId: null,
      });

      await expect(
        service.cancelRide('ride-1', 'passenger-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});