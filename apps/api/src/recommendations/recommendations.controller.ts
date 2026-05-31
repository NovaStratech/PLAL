import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RecommendationsService } from './recommendations.service';
import { CreateRecommendationDto, UpdateRecommendationDto } from './dto/recommendation.dto';

@UseGuards(JwtAuthGuard)
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendations: RecommendationsService) {}

  @Get()
  listMine(@CurrentUser('userId') userId: string) {
    return this.recommendations.listMine(userId);
  }

  @Post()
  create(@CurrentUser('userId') userId: string, @Body() dto: CreateRecommendationDto) {
    return this.recommendations.create(userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRecommendationDto,
  ) {
    return this.recommendations.update(userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.recommendations.remove(userId, id);
  }
}
