import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FriendshipsService } from './friendships.service';
import { CreateFriendshipDto, RespondFriendshipDto } from './dto/friendship.dto';

@UseGuards(JwtAuthGuard)
@Controller('friendships')
export class FriendshipsController {
  constructor(private readonly friendships: FriendshipsService) {}

  @Get()
  listFriends(@CurrentUser('userId') userId: string) {
    return this.friendships.listFriends(userId);
  }

  @Get('requests/incoming')
  incoming(@CurrentUser('userId') userId: string) {
    return this.friendships.listIncomingRequests(userId);
  }

  @Get('requests/outgoing')
  outgoing(@CurrentUser('userId') userId: string) {
    return this.friendships.listOutgoingRequests(userId);
  }

  @Post()
  request(@CurrentUser('userId') userId: string, @Body() dto: CreateFriendshipDto) {
    return this.friendships.request(userId, dto);
  }

  @Patch(':id')
  respond(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: RespondFriendshipDto,
  ) {
    return this.friendships.respond(userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.friendships.remove(userId, id);
  }
}
