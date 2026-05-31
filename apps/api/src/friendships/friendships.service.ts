import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FriendshipStatus, NotificationType, Prisma } from '@prisma/client';
import type { Friendship as FriendshipDTO, PublicProfile } from '@plal/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFriendshipDto, RespondFriendshipDto } from './dto/friendship.dto';

type FriendshipWithUsers = Prisma.FriendshipGetPayload<{
  include: {
    requester: { include: { profile: true } };
    receiver: { include: { profile: true } };
  };
}>;

@Injectable()
export class FriendshipsService {
  constructor(private readonly prisma: PrismaService) {}

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

  /** Amis acceptés. */
  async listFriends(userId: string): Promise<FriendshipDTO[]> {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        status: FriendshipStatus.accepted,
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
    };
    return {
      id: f.id,
      status: f.status as FriendshipDTO['status'],
      requesterId: f.requesterId,
      receiverId: f.receiverId,
      friend,
      direction: isRequester ? 'outgoing' : 'incoming',
      createdAt: f.createdAt.toISOString(),
    };
  }
}
