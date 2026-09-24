import { Module } from '@nestjs/common';
import { PoolsService } from './pools.service';

@Module({
  providers: [PoolsService],
  exports: [PoolsService],
})
export class PoolsModule {}