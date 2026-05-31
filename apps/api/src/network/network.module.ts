import { Module } from '@nestjs/common';
import { NetworkService } from './network.service';
import { GeocodingService } from './geocoding.service';

@Module({
  providers: [NetworkService, GeocodingService],
  exports: [NetworkService, GeocodingService],
})
export class NetworkModule {}
