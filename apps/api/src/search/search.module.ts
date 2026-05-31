import { Module } from '@nestjs/common';
import { NetworkModule } from '../network/network.module';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [NetworkModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
