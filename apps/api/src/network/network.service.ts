import { Injectable } from '@nestjs/common';
import { FriendshipStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface NetworkGraph {
  /** IDs des amis directs (niveau 1). */
  level1: Set<string>;
  /** IDs des amis d'amis (niveau 2), hors soi-même et hors amis directs. */
  level2: Set<string>;
}

export interface NetworkPath {
  /** Chemin complet de l'initiateur jusqu'au détenteur de la recommandation. */
  userIds: string[];
  /** Profondeur = nombre de sauts depuis l'initiateur. */
  depth: number;
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
        blockedById: null,
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

  /**
   * Trouve le chemin le plus court entre l'utilisateur et un membre de son réseau.
   * Retourne null si targetUserId n'est pas accessible (hors réseau ou soi-même).
   * Le chemin retourné exclut l'utilisateur initiateur et contient la cible.
   */
  async findShortestPath(
    fromUserId: string,
    targetUserId: string,
    maxDepth: number,
  ): Promise<NetworkPath | null> {
    if (fromUserId === targetUserId) return null;

    const queue: { userId: string; path: string[] }[] = [
      { userId: fromUserId, path: [] },
    ];
    const visited = new Set<string>([fromUserId]);

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.path.length >= maxDepth) continue;

      const friends = await this.getDirectFriendIds(current.userId);
      for (const friendId of friends) {
        if (visited.has(friendId)) continue;
        const newPath = [...current.path, friendId];
        if (friendId === targetUserId) {
          return { userIds: newPath, depth: newPath.length };
        }
        visited.add(friendId);
        queue.push({ userId: friendId, path: newPath });
      }
    }

    return null;
  }

  /**
   * Retourne tous les IDs accessibles jusqu'à une profondeur donnée,
   * ainsi que les profondeurs associées.
   */
  async findReachableUsers(
    userId: string,
    maxDepth: number,
  ): Promise<Map<string, NetworkPath>> {
    const result = new Map<string, NetworkPath>();
    if (maxDepth < 1) return result;

    const queue: { userId: string; path: string[] }[] = [
      { userId, path: [] },
    ];
    const visited = new Set<string>([userId]);

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.path.length >= maxDepth) continue;

      const friends = await this.getDirectFriendIds(current.userId);
      for (const friendId of friends) {
        if (visited.has(friendId)) continue;
        visited.add(friendId);
        const newPath = [...current.path, friendId];
        result.set(friendId, { userIds: newPath, depth: newPath.length });
        queue.push({ userId: friendId, path: newPath });
      }
    }

    return result;
  }
}
