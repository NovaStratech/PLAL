import { Injectable } from '@nestjs/common';
import { Prisma, RecommendationVisibility } from '@prisma/client';
import { RelationalDistance, type SearchResult } from '@plal/shared';
import { PrismaService } from '../prisma/prisma.service';
import { NetworkService } from '../network/network.service';
import { haversineKm, type GeoPoint } from '../network/geocoding.service';

export interface SearchOptions {
  query?: string;
  city?: string;
  categoryId?: string;
  radiusKm?: number;
  maxDepth?: number;
  originLatitude?: number;
  originLongitude?: number;
}

type RecoWithRelations = Prisma.RecommendationGetPayload<{
  include: { category: true; user: { include: { profile: true } } };
}>;

/**
 * Recherche de confiance : ne montre QUE les recommandations du réseau
 * (amis directs + amis d'amis), jamais un annuaire public.
 *
 * Règle de visibilité (appliquée côté serveur) :
 *  - propriétaire ∈ amis directs (L1) → visible si visibility ∈ {friends, friends_of_friends}
 *  - propriétaire ∈ amis d'amis (L2)  → visible uniquement si visibility = friends_of_friends
 */
@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly network: NetworkService,
  ) {}

  async search(userId: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const {
      query: rawQuery,
      city,
      categoryId,
      radiusKm,
      maxDepth = 2,
      originLatitude,
      originLongitude,
    } = options;
    const q = rawQuery?.trim() ?? '';

    const reachable = await this.network.findReachableUsers(userId, maxDepth);
    if (reachable.size === 0) return [];

    const reachableIds = [...reachable.keys()];

    // Pré-charger les profils publics de tous les utilisateurs accessibles (pour afficher la chaîne de confiance).
    const pathUserIds = new Set<string>(reachableIds);
    const reachableProfiles = await this.prisma.profile.findMany({
      where: { userId: { in: [...pathUserIds] } },
    });
    const profileByUserId = new Map(reachableProfiles.map((p) => [p.userId, p]));

    // Origine = position fournie par le client (ville recherchée) ou position du profil.
    let origin: GeoPoint | null = null;
    if (originLatitude != null && originLongitude != null) {
      origin = { latitude: originLatitude, longitude: originLongitude };
    } else if (radiusKm && radiusKm > 0) {
      const me = await this.prisma.profile.findUnique({ where: { userId } });
      if (me?.latitude != null && me?.longitude != null) {
        origin = { latitude: me.latitude, longitude: me.longitude };
      }
    }

    const textFilter: Prisma.RecommendationWhereInput = q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { category: { name: { contains: q, mode: 'insensitive' } } },
            { category: { slug: { contains: q, mode: 'insensitive' } } },
          ],
        }
      : {};

    const cityFilter: Prisma.RecommendationWhereInput = city?.trim()
      ? { city: { contains: city.trim(), mode: 'insensitive' } }
      : {};

    const categoryIds = categoryId?.trim() ? await this.collectCategoryIds(categoryId.trim()) : [];
    const categoryFilter: Prisma.RecommendationWhereInput = categoryIds.length
      ? { categoryId: { in: categoryIds } }
      : {};

    const recos = await this.prisma.recommendation.findMany({
      where: {
        userId: { in: reachableIds },
        ...textFilter,
        ...cityFilter,
        ...categoryFilter,
      },
      include: { category: true, user: { include: { profile: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const results: SearchResult[] = [];
    for (const reco of recos) {
      const ownerId = reco.userId;
      const path = reachable.get(ownerId)!;
      // Si la recommandation est une personne/service avec visibilité restreinte,
      // seuls les amis directs la voient.
      const isPersonOrService = reco.type === 'person' || reco.type === 'service';
      const restricted =
        reco.visibility === RecommendationVisibility.friends && isPersonOrService;
      const isDirect = path.depth === 1;
      const visible = isDirect ? true : !restricted;

      if (!visible) continue;

      const profile = reco.user.profile;
      if (!profile) continue;

      let distanceKm: number | null = null;
      if (origin && reco.latitude != null && reco.longitude != null) {
        distanceKm =
          Math.round(
            haversineKm(origin, { latitude: reco.latitude, longitude: reco.longitude }) * 10,
          ) / 10;
      }

      // Filtre rayon : si un rayon est demandé et qu'on a une origine,
      // on exclut les recos hors rayon (ou sans coordonnées).
      if (origin && radiusKm && radiusKm > 0) {
        if (distanceKm == null || distanceKm > radiusKm) continue;
      }

      results.push(
        this.toResult(
          reco,
          isDirect ? RelationalDistance.DIRECT : RelationalDistance.FRIEND_OF_FRIEND,
          profile,
          distanceKm,
          path.userIds,
          path.depth,
          profileByUserId,
        ),
      );
    }

    // Amis directs d'abord, puis amis d'amis ; à distance relationnelle égale,
    // les plus proches géographiquement d'abord (quand la distance est connue).
    results.sort((a, b) => {
      if (a.distance !== b.distance) {
        return a.distance === RelationalDistance.DIRECT ? -1 : 1;
      }
      if (a.distanceKm == null && b.distanceKm == null) return 0;
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });

    return results;
  }

  private async collectCategoryIds(categoryId: string): Promise<string[]> {
    const all = await this.prisma.category.findMany({ select: { id: true, parentId: true } });
    const byParent = new Map<string, string[]>();
    for (const c of all) {
      if (c.parentId) {
        byParent.set(c.parentId, [...(byParent.get(c.parentId) ?? []), c.id]);
      }
    }

    const ids = new Set<string>([categoryId]);
    const queue = [categoryId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      const children = byParent.get(current) ?? [];
      for (const childId of children) {
        if (!ids.has(childId)) {
          ids.add(childId);
          queue.push(childId);
        }
      }
    }
    return [...ids];
  }

  private toResult(
    reco: RecoWithRelations,
    distance: RelationalDistance,
    profile: NonNullable<RecoWithRelations['user']['profile']>,
    distanceKm: number | null = null,
    path: string[] = [],
    depth = 1,
    profileByUserId?: Map<string, NonNullable<RecoWithRelations['user']['profile']>>,
  ): SearchResult {
    const pathProfiles = path
      .map((userId) => {
        const p = profileByUserId?.get(userId);
        if (!p) return null;
        return {
          userId: p.userId,
          id: p.id,
          firstName: p.firstName,
          lastName: p.lastName,
          city: p.city,
          country: p.country,
          photoUrl: p.photoUrl,
          bio: p.bio,
          phoneNumber: p.phoneNumber,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    return {
      recommendationId: reco.id,
      title: reco.title,
      description: reco.description,
      city: reco.city,
      type: reco.type as SearchResult['type'],
      category: { id: reco.category.id, slug: reco.category.slug, name: reco.category.name },
      helper: {
        userId: reco.userId,
        id: profile.id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        city: profile.city,
        country: profile.country,
        photoUrl: profile.photoUrl,
        bio: profile.bio,
        phoneNumber: profile.phoneNumber,
      },
      distance,
      distanceKm,
      path,
      depth,
      pathProfiles,
    };
  }
}
