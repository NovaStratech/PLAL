import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { FriendshipStatus } from '@prisma/client';
import type { PublicProfile, Recommendation } from '@plal/shared';
import { PrismaService } from '../prisma/prisma.service';

export interface UserSearchResult extends PublicProfile {
  userId: string;
  relation: 'self' | 'friend' | 'pending' | 'none';
}

export interface PublicUserProfile {
  profile: PublicProfile & { userId: string };
  relation: 'self' | 'friend' | 'pending' | 'none';
  mutualFriendsCount: number;
  recommendations: Recommendation[];
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
        phoneNumber: u.profile!.phoneNumber,
        relation: relationFor(u.id),
      }));
  }

  async getPublicProfile(currentUserId: string, targetUserId: string): Promise<PublicUserProfile> {
    if (currentUserId === targetUserId) {
      throw new BadRequestException('Utilise /profile pour ton propre profil.');
    }

    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        profile: true,
        recommendations: { include: { category: true }, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!target || !target.profile) throw new NotFoundException('Profil introuvable.');

    const relation = await this.getRelation(currentUserId, targetUserId);

    // Amis en commun
    const myFriends = await this.getFriendIds(currentUserId);
    const theirFriends = await this.getFriendIds(targetUserId);
    const mutual = new Set([...myFriends].filter((id) => theirFriends.has(id)));

    return {
      profile: {
        userId: target.id,
        id: target.profile.id,
        firstName: target.profile.firstName,
        lastName: target.profile.lastName,
        city: target.profile.city,
        country: target.profile.country,
        photoUrl: target.profile.photoUrl,
        bio: target.profile.bio,
        phoneNumber: target.profile.phoneNumber,
      },
      relation,
      mutualFriendsCount: mutual.size,
      recommendations: target.recommendations.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        city: r.city,
        type: r.type as Recommendation['type'],
        visibility: r.visibility as Recommendation['visibility'],
        category: { id: r.category.id, slug: r.category.slug, name: r.category.name },
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }

  private async getRelation(currentUserId: string, targetUserId: string): Promise<PublicUserProfile['relation']> {
    if (currentUserId === targetUserId) return 'self';
    const f = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: currentUserId, receiverId: targetUserId },
          { requesterId: targetUserId, receiverId: currentUserId },
        ],
      },
    });
    if (!f) return 'none';
    if (f.status === FriendshipStatus.accepted) return 'friend';
    if (f.status === FriendshipStatus.pending) return 'pending';
    return 'none';
  }

  private async getFriendIds(userId: string): Promise<Set<string>> {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        status: FriendshipStatus.accepted,
        blockedById: null,
        OR: [{ requesterId: userId }, { receiverId: userId }],
      },
      select: { requesterId: true, receiverId: true },
    });
    return new Set(
      friendships.map((f) => (f.requesterId === userId ? f.receiverId : f.requesterId)),
    );
  }
}
