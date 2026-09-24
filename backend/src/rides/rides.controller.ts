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
}