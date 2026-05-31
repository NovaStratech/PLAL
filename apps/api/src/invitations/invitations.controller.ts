import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/invitation.dto';

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitations: InvitationsService) {}

  /** Aperçu public d'une invitation (page d'inscription, sans authentification). */
  @Get(':token')
  preview(@Param('token') token: string) {
    return this.invitations.preview(token);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  listMine(@CurrentUser('userId') userId: string) {
    return this.invitations.listMine(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser('userId') userId: string, @Body() dto: CreateInvitationDto) {
    return this.invitations.create(userId, dto);
  }
}
