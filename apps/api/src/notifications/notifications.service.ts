import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { NotificationItem } from '@plal/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<NotificationItem[]> {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return notifications.map((n) => ({
      id: n.id,
      type: n.type as NotificationItem['type'],
      read: n.read,
      payload: (n.payload as Record<string, unknown>) ?? {},
      createdAt: n.createdAt.toISOString(),
    }));
  }

  async markRead(userId: string, id: string): Promise<{ success: true }> {
    const notif = await this.prisma.notification.findUnique({ where: { id } });
    if (!notif) throw new NotFoundException('Notification introuvable.');
    if (notif.userId !== userId) throw new ForbiddenException('Action non autorisée.');
    await this.prisma.notification.update({ where: { id }, data: { read: true } });
    return { success: true };
  }

  async markAllRead(userId: string): Promise<{ success: true }> {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return { success: true };
  }
}
