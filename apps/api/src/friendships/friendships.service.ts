import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FriendshipStatus, NotificationType, Prisma } from '@prisma/client';
import type { Friendship as FriendshipDTO, PublicProfile } from '@plal/shared';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateFriendshipDto, RespondFriendshipDto } from './dto/friendship.dto';

export interface FriendSuggestion {
  userId: string;
  id: string;
  firstName: string;
  lastName: string | null;
  city: string | null;
  country: string | null;
  photoUrl: string | null;
  bio: string | null;
  phoneNumber: string | null;
  relation: 'none';
  mutualFriends: number;
}

type FriendshipWithUsers = Prisma.FriendshipGetPayload<{
  include: {
    requester: { include: { profile: true } };
    receiver: { include: { profile: true } };
  };
}>;

@Injectable()
export class FriendshipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async request(userId: string, dto: CreateFriendshipDto): Promise<FriendshipDTO> {
    if (dto.receiverId === userId) {
      throw new BadRequestException('Tu ne peux pas t\'ajouter toi-même.');
    }

    const receiver = await this.prisma.user.findUnique({ where: { id: dto.receiverId } });
    if (!receiver) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    // Une relation existe-t-elle déjà dans un sens ou l'autre ?
    const existing = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, receiverId: dto.receiverId },
          { requesterId: dto.receiverId, receiverId: userId },
        ],
      },
    });

    if (existing) {
      if (existing.status === FriendshipStatus.accepted) {
        throw new BadRequestException('Vous êtes déjà amis.');
      }
      if (existing.status === FriendshipStatus.pending) {
        throw new BadRequestException('Une demande est déjà en attente.');
      }
      // rejected -> on réactive en repartant de l'utilisateur courant
      const reactivated = await this.prisma.friendship.update({
        where: { id: existing.id },
        data: { requesterId: userId, receiverId: dto.receiverId, status: FriendshipStatus.pending },
        include: this.includeUsers(),
      });
      await this.notify(dto.receiverId, NotificationType.friend_request, userId);
      return this.toDto(reactivated, userId);
    }

    const created = await this.prisma.friendship.create({
      data: { requesterId: userId, receiverId: dto.receiverId, status: FriendshipStatus.pending },
      include: this.includeUsers(),
    });

    await this.notify(dto.receiverId, NotificationType.friend_request, userId);
    return this.toDto(created, userId);
  }

  async respond(userId: string, id: string, dto: RespondFriendshipDto): Promise<FriendshipDTO> {
    const friendship = await this.prisma.friendship.findUnique({ where: { id } });
    if (!friendship) throw new NotFoundException('Demande introuvable.');
    if (friendship.receiverId !== userId) {
      throw new ForbiddenException('Tu ne peux répondre qu\'aux demandes reçues.');
    }
    if (friendship.status !== FriendshipStatus.pending) {
      throw new BadRequestException('Cette demande a déjà été traitée.');
    }

    const status = dto.action === 'accept' ? FriendshipStatus.accepted : FriendshipStatus.rejected;
    const updated = await this.prisma.friendship.update({
      where: { id },
      data: { status },
      include: this.includeUsers(),
    });

    if (status === FriendshipStatus.accepted) {
      await this.notify(friendship.requesterId, NotificationType.friend_request_accepted, userId);
      // Invalider la notification de demande d'ami reçue par l'accepteur.
      await this.notifications.markReadByPayload(userId, NotificationType.friend_request, {
        fromUserId: friendship.requesterId,
      });
    }

    return this.toDto(updated, userId);
  }

  async remove(userId: string, id: string): Promise<{ success: true }> {
    const friendship = await this.prisma.friendship.findUnique({ where: { id } });
    if (!friendship) throw new NotFoundException('Relation introuvable.');
    if (friendship.requesterId !== userId && friendship.receiverId !== userId) {
      throw new ForbiddenException('Action non autorisée.');
    }
    await this.prisma.friendship.delete({ where: { id } });
    return { success: true };
  }

  async block(userId: string, friendUserId: string): Promise<{ success: true }> {
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        status: FriendshipStatus.accepted,
        OR: [
          { requesterId: userId, receiverId: friendUserId },
          { requesterId: friendUserId, receiverId: userId },
        ],
      },
    });
    if (!friendship) throw new BadRequestException('Vous devez être amis pour bloquer.');

    await this.prisma.friendship.update({
      where: { id: friendship.id },
      data: {
        status: FriendshipStatus.rejected,
        blockedById: userId,
        blockedAt: new Date(),
      },
    });
    return { success: true };
  }

  async unblock(userId: string, friendUserId: string): Promise<{ success: true }> {
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        blockedById: userId,
        OR: [
          { requesterId: userId, receiverId: friendUserId },
          { requesterId: friendUserId, receiverId: userId },
        ],
      },
    });
    if (!friendship) throw new NotFoundException('Blocage introuvable.');

    await this.prisma.friendship.update({
      where: { id: friendship.id },
      data: {
        status: FriendshipStatus.accepted,
        blockedById: null,
        blockedAt: null,
      },
    });
    return { success: true };
  }

  async listBlocked(userId: string): Promise<FriendshipDTO[]> {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        blockedById: userId,
        status: FriendshipStatus.rejected,
      },
      include: this.includeUsers(),
      orderBy: { blockedAt: 'desc' },
    });
    return friendships.map((f) => this.toDto(f, userId));
  }

  /**
   * Suggère des amis d'amis avec qui l'utilisateur n'est pas encore connecté.
   * Classement : nombre d'amis en commun décroissant.
   */
  async suggestFriends(userId: string): Promise<FriendSuggestion[]> {
    const myFriendIds = await this.getDirectFriendIds(userId);
    if (myFriendIds.length === 0) return [];

    const secondDegree = await this.prisma.friendship.findMany({
      where: {
        status: FriendshipStatus.accepted,
        blockedById: null,
        OR: [{ requesterId: { in: myFriendIds } }, { receiverId: { in: myFriendIds } }],
      },
      select: { requesterId: true, receiverId: true },
    });

    const counts = new Map<string, number>();
    for (const f of secondDegree) {
      for (const id of [f.requesterId, f.receiverId]) {
        if (id === userId || myFriendIds.includes(id)) continue;
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
    }

    if (counts.size === 0) return [];

    const userIds = [...counts.keys()];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      include: { profile: true },
    });

    return users
      .filter((u) => u.profile)
      .map((u) => ({
        userId: u.id,
        id: u.profile!.id,
        firstName: u.profile!.firstName,
        lastName: u.profile!.lastName,
        city: u.profile!.city,
        country: u.profile!.country,
        photoUrl: u.profile!.photoUrl,
        bio: u.profile!.bio,
        phoneNumber: u.profile!.phoneNumber,
        relation: 'none' as const,
        mutualFriends: counts.get(u.id) ?? 0,
      }))
      .sort((a, b) => b.mutualFriends - a.mutualFriends)
      .slice(0, 10);
  }

  /** Amis acceptés. */
  async listFriends(userId: string): Promise<FriendshipDTO[]> {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        status: FriendshipStatus.accepted,
        blockedById: null,
        OR: [{ requesterId: userId }, { receiverId: userId }],
      },
      include: this.includeUsers(),
      orderBy: { updatedAt: 'desc' },
    });
    return friendships.map((f) => this.toDto(f, userId));
  }

  /** Demandes d'ami reçues en attente. */
  async listIncomingRequests(userId: string): Promise<FriendshipDTO[]> {
    const friendships = await this.prisma.friendship.findMany({
      where: { receiverId: userId, status: FriendshipStatus.pending },
      include: this.includeUsers(),
      orderBy: { createdAt: 'desc' },
    });
    return friendships.map((f) => this.toDto(f, userId));
  }

  /** Demandes d'ami envoyées en attente. */
  async listOutgoingRequests(userId: string): Promise<FriendshipDTO[]> {
    const friendships = await this.prisma.friendship.findMany({
      where: { requesterId: userId, status: FriendshipStatus.pending },
      include: this.includeUsers(),
      orderBy: { createdAt: 'desc' },
    });
    return friendships.map((f) => this.toDto(f, userId));
  }

  private includeUsers() {
    return {
      requester: { include: { profile: true } },
      receiver: { include: { profile: true } },
    } as const;
  }

  private async notify(userId: string, type: NotificationType, fromUserId: string) {
    const fromProfile = await this.prisma.profile.findUnique({ where: { userId: fromUserId } });
    await this.prisma.notification.create({
      data: {
        userId,
        type,
        payload: { fromUserId, fromName: fromProfile?.firstName ?? 'Quelqu\'un' },
      },
    });
  }

  private toDto(f: FriendshipWithUsers, currentUserId: string): FriendshipDTO {
    const isRequester = f.requesterId === currentUserId;
    const other = isRequester ? f.receiver : f.requester;
    const profile = other.profile!;
    const friend: PublicProfile & { userId: string } = {
      userId: other.id,
      id: profile.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      city: profile.city,
      country: profile.country,
      photoUrl: profile.photoUrl,
      bio: profile.bio,
      phoneNumber: profile.phoneNumber,
    };
    return {
      id: f.id,
      status: f.status as FriendshipDTO['status'],
      requesterId: f.requesterId,
      receiverId: f.receiverId,
      friend,
      direction: isRequester ? 'outgoing' : 'incoming',
      blockedById: f.blockedById,
      blockedAt: f.blockedAt?.toISOString() ?? null,
      createdAt: f.createdAt.toISOString(),
    };
  }

  private async getDirectFriendIds(userId: string): Promise<string[]> {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        status: FriendshipStatus.accepted,
        blockedById: null,
        OR: [{ requesterId: userId }, { receiverId: userId }],
      },
      select: { requesterId: true, receiverId: true },
    });
    return friendships.map((f) => (f.requesterId === userId ? f.receiverId : f.requesterId));
  }
}
