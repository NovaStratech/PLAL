import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CategoriesService } from './categories.service';
import { CreateCategorySuggestionDto } from './dto/category-suggestion.dto';

@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  list() {
    return this.categories.list();
  }

  @Post('suggestions')
  suggest(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateCategorySuggestionDto,
  ) {
    return this.categories.suggest(userId, dto);
  }
}
