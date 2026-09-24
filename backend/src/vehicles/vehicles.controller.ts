import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('vehicles')
export class VehiclesController {
  constructor(private vehiclesService: VehiclesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  createVehicle(
    @Request() req,
    @Body() body: { name: string; capacity: number },
  ) {
    return this.vehiclesService.createVehicle(req.user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-vehicle')
  getMyVehicle(@Request() req) {
    return this.vehiclesService.getMyVehicle(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('toggle-online')
  toggleOnline(@Request() req) {
    return this.vehiclesService.toggleOnline(req.user.id);
  }

  @Get('online')
  getOnlineVehicles() {
    return this.vehiclesService.getOnlineVehicles();
  }
}