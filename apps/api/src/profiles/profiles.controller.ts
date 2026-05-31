import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProfilesService } from './profiles.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}

  @Get()
  getMe(@CurrentUser('userId') userId: string) {
    return this.profiles.getMe(userId);
  }

  @Patch()
  update(@CurrentUser('userId') userId: string, @Body() dto: UpdateProfileDto) {
    return this.profiles.update(userId, dto);
  }
}
