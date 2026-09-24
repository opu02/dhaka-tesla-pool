import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Dhaka areas with lat/long
export const DHAKA_AREAS = {
  Banani: { lat: 23.7937, lng: 90.4066 },
  Gulshan1: { lat: 23.7807, lng: 90.4148 },
  Mohakhali: { lat: 23.7799, lng: 90.4023 },
  Dhanmondi: { lat: 23.7461, lng: 90.3742 },
  Mirpur: { lat: 23.8223, lng: 90.3654 },
  Uttara: { lat: 23.8759, lng: 90.3795 },
  Farmgate: { lat: 23.7593, lng: 90.3919 },
  Bashundhara: { lat: 23.8141, lng: 90.4238 },
};

@Injectable()
export class PoolsService {
  constructor(private prisma: PrismaService) {}

  // Calculate distance between two points (km)
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // Pool matching rule: same pickup area OR pickup within 2km
  isCompatiblePickup(
    pickup1Area: string,
    pickup1Lat: number,
    pickup1Lng: number,
    pickup2Area: string,
    pickup2Lat: number,
    pickup2Lng: number,
  ): boolean {
    if (pickup1Area === pickup2Area) return true;
    const distance = this.calculateDistance(
      pickup1Lat,
      pickup1Lng,
      pickup2Lat,
      pickup2Lng,
    );
    return distance <= 2;
  }

  // Calculate fare in paisa
  calculateFare(
    pickupLat: number,
    pickupLng: number,
    destArea: string,
    isPooled: boolean,
  ): number {
    const destCoords = DHAKA_AREAS[destArea];
    if (!destCoords) return 5000; // default 50 taka

    const distance = this.calculateDistance(
      pickupLat,
      pickupLng,
      destCoords.lat,
      destCoords.lng,
    );

    const baseFare = 3000; // 30 taka
    const distanceCharge = Math.round(distance * 500); // 5 taka per km
    const poolDiscount = isPooled ? 1000 : 0; // 10 taka discount for pool

    return baseFare + distanceCharge - poolDiscount;
  }

  async findAvailablePool(
    pickupArea: string,
    pickupLat: number,
    pickupLng: number,
    seatsNeeded: number,
  ) {
    const openPools = await this.prisma.pool.findMany({
      where: {
        status: 'OPEN',
        availableSeats: { gte: seatsNeeded },
        vehicle: { isOnline: true },
      },
      include: {
        rideRequests: true,
        vehicle: true,
      },
    });

    for (const pool of openPools) {
      if (pool.rideRequests.length === 0) continue;

      const firstRequest = pool.rideRequests[0];
      const compatible = this.isCompatiblePickup(
        pickupArea,
        pickupLat,
        pickupLng,
        firstRequest.pickupArea,
        firstRequest.pickupLat,
        firstRequest.pickupLng,
      );

      if (compatible) return pool;
    }

    return null;
  }
}