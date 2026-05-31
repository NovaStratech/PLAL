import { Module } from '@nestjs/common';
import { NetworkModule } from '../network/network.module';
import { IntroductionRequestsController } from './introduction-requests.controller';
import { IntroductionRequestsService } from './introduction-requests.service';

@Module({
  imports: [NetworkModule],
  controllers: [IntroductionRequestsController],
  providers: [IntroductionRequestsService],
})
export class IntroductionRequestsModule {}
