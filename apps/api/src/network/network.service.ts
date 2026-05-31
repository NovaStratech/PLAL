import { Injectable } from '@nestjs/common';
import { FriendshipStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface NetworkGraph {
  /** IDs des amis directs (niveau 1). */
  level1: Set<string>;
  /** IDs des amis d'amis (niveau 2), hors soi-même et hors amis directs. */
  level2: Set<string>;
}

/**
 * Service central du produit : calcule le réseau de confiance d'un utilisateur.
 * Le cœur de PLAL repose sur "qui dans mon réseau peut m'aider ?".
 */
@Injectable()
export class NetworkService {
  constructor(private readonly prisma: PrismaService) {}

  /** Retourne les IDs des amis directs (friendship acceptée, peu importe la direction). */
  async getDirectFriendIds(userId: string): Promise<string[]> {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        status: FriendshipStatus.accepted,
        OR: [{ requesterId: userId }, { receiverId: userId }],
      },
      select: { requesterId: true, receiverId: true },
    });

    return friendships.map((f) => (f.requesterId === userId ? f.receiverId : f.requesterId));
  }

  /** Construit le graphe : amis directs (L1) et amis d'amis (L2). */
  async buildGraph(userId: string): Promise<NetworkGraph> {
    const level1Ids = await this.getDirectFriendIds(userId);
    const level1 = new Set(level1Ids);

    if (level1Ids.length === 0) {
      return { level1, level2: new Set<string>() };
    }

    const secondDegree = await this.prisma.friendship.findMany({
      where: {
        status: FriendshipStatus.accepted,
        OR: [{ requesterId: { in: level1Ids } }, { receiverId: { in: level1Ids } }],
      },
      select: { requesterId: true, receiverId: true },
    });

    const level2 = new Set<string>();
    for (const f of secondDegree) {
      for (const id of [f.requesterId, f.receiverId]) {
        if (id !== userId && !level1.has(id)) {
          level2.add(id);
        }
      }
    }

    return { level1, level2 };
  }
}
