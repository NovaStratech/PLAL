import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import type { NotificationItem } from '@plal/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async unreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, read: false },
    });
  }

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

  /**
   * Marque comme lues les notifications correspondant à un type et un payload.
   * Utilisé pour invalider automatiquement une notification lorsque l'action
   * associée a été traitée (ex: demande d'ami acceptée, mise en relation répondue).
   */
  async markReadByPayload(
    userId: string,
    type: NotificationType,
    payloadMatch: Record<string, unknown>,
  ): Promise<{ success: true }> {
    const notifications = await this.prisma.notification.findMany({
      where: { userId, type, read: false },
    });

    const idsToMark = notifications.filter((n) => {
      const payload = (n.payload as Record<string, unknown>) ?? {};
      return Object.entries(payloadMatch).every(([key, value]) => payload[key] === value);
    });

    if (idsToMark.length > 0) {
      await this.prisma.notification.updateMany({
        where: { id: { in: idsToMark.map((n) => n.id) } },
        data: { read: true },
      });
    }

    return { success: true };
  }
}
