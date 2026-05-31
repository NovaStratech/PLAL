import { Injectable } from '@nestjs/common';
import { FriendshipStatus } from '@prisma/client';
import type { PublicProfile } from '@plal/shared';
import { PrismaService } from '../prisma/prisma.service';

export interface UserSearchResult extends PublicProfile {
  userId: string;
  relation: 'self' | 'friend' | 'pending' | 'none';
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Recherche d'utilisateurs par prénom, nom ou email — pour envoyer une demande d'ami. */
  async search(currentUserId: string, query: string): Promise<UserSearchResult[]> {
    const q = query.trim();
    if (q.length < 2) return [];

    const users = await this.prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { profile: { firstName: { contains: q, mode: 'insensitive' } } },
          { profile: { lastName: { contains: q, mode: 'insensitive' } } },
        ],
      },
      include: { profile: true },
      take: 20,
    });

    const friendships = await this.prisma.friendship.findMany({
      where: {
        OR: [{ requesterId: currentUserId }, { receiverId: currentUserId }],
      },
    });

    const relationFor = (otherId: string): UserSearchResult['relation'] => {
      const f = friendships.find(
        (x) =>
          (x.requesterId === currentUserId && x.receiverId === otherId) ||
          (x.receiverId === currentUserId && x.requesterId === otherId),
      );
      if (!f) return 'none';
      if (f.status === FriendshipStatus.accepted) return 'friend';
      if (f.status === FriendshipStatus.pending) return 'pending';
      return 'none';
    };

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
        relation: relationFor(u.id),
      }));
  }
}
