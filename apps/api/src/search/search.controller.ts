import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SearchService } from './search.service';

@UseGuards(JwtAuthGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Get()
  run(
    @CurrentUser('userId') userId: string,
    @Query('q') q = '',
    @Query('city') city?: string,
  ) {
    return this.search.search(userId, q, city);
  }
}
