import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RidesService } from './rides.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RideStatus } from '@prisma/client';

@Controller('rides')
export class RidesController {
  constructor(private ridesService: RidesService) {}

  @UseGuards(JwtAuthGuard)
  @Post('request')
  requestRide(
    @Request() req,
    @Body()
    body: {
      pickupArea: string;
      destinationArea: string;
      pickupLat: number;
      pickupLng: number;
      seatsRequested: number;
    },
  ) {
    return this.ridesService.requestRide(req.user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-rides')
  getMyRides(@Request() req) {
    return this.ridesService.getMyRides(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getRideById(@Param('id') id: string, @Request() req) {
    return this.ridesService.getRideById(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  cancelRide(@Param('id') id: string, @Request() req) {
    return this.ridesService.cancelRide(id, req.user.id);
  }
  
    // DRIVER ROUTES
  @UseGuards(JwtAuthGuard)
  @Get('driver/pending')
  getPendingRides() {
    return this.ridesService.getPendingRides();
  }

  @UseGuards(JwtAuthGuard)
  @Get('driver/my-rides')
  getDriverRides(@Request() req) {
    return this.ridesService.getDriverRides(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/accept')
  acceptRide(@Param('id') id: string, @Request() req) {
    return this.ridesService.acceptRide(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Request() req,
    @Body() body: { status: RideStatus },
  ) {
    return this.ridesService.updateRideStatus(id, req.user.id, body.status);
  }

}