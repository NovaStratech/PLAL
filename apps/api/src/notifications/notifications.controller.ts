import { Controller, Get, Param, Patch, Sse, UseGuards } from '@nestjs/common';
import { Observable, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

interface NotificationStreamMessage {
  count: number;
}

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser('userId') userId: string) {
    return this.notifications.list(userId);
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser('userId') userId: string) {
    const count = await this.notifications.unreadCount(userId);
    return { count };
  }

  @Sse('stream')
  stream(@CurrentUser('userId') userId: string): Observable<{ data: NotificationStreamMessage }> {
    return interval(5000).pipe(
      switchMap(async () => {
        const count = await this.notifications.unreadCount(userId);
        return { data: { count } };
      }),
    );
  }

  @Patch('read-all')
  markAllRead(@CurrentUser('userId') userId: string) {
    return this.notifications.markAllRead(userId);
  }

  @Patch(':id/read')
  markRead(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.notifications.markRead(userId, id);
  }
}
