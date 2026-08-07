import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('search')
  search(@CurrentUser('userId') userId: string, @Query('q') q = '') {
    return this.users.search(userId, q);
  }

  @Get(':id/profile')
  getPublicProfile(
    @CurrentUser('userId') userId: string,
    @Param('id') targetUserId: string,
  ) {
    return this.users.getPublicProfile(userId, targetUserId);
  }
}
