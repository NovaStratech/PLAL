import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IntroductionRequestsService } from './introduction-requests.service';
import {
  CreateIntroductionRequestDto,
  RespondIntroductionRequestDto,
} from './dto/introduction-request.dto';

@UseGuards(JwtAuthGuard)
@Controller('introduction-requests')
export class IntroductionRequestsController {
  constructor(private readonly intros: IntroductionRequestsService) {}

  @Get('received')
  received(@CurrentUser('userId') userId: string) {
    return this.intros.listReceived(userId);
  }

  @Get('sent')
  sent(@CurrentUser('userId') userId: string) {
    return this.intros.listSent(userId);
  }

  @Post()
  create(@CurrentUser('userId') userId: string, @Body() dto: CreateIntroductionRequestDto) {
    return this.intros.create(userId, dto);
  }

  @Patch(':id')
  respond(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: RespondIntroductionRequestDto,
  ) {
    return this.intros.respond(userId, id, dto);
  }
}
