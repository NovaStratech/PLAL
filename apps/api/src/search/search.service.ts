import { Injectable } from '@nestjs/common';
import { Prisma, RecommendationVisibility } from '@prisma/client';
import { RelationalDistance, type SearchResult } from '@plal/shared';
import { PrismaService } from '../prisma/prisma.service';
import { NetworkService } from '../network/network.service';
import { haversineKm, type GeoPoint } from '../network/geocoding.service';

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

  async search(
    userId: string,
    query: string,
    city?: string,
    categoryId?: string,
    radiusKm?: number,
  ): Promise<SearchResult[]> {
    const q = query?.trim() ?? '';

    const { level1, level2 } = await this.network.buildGraph(userId);
    const reachableIds = [...level1, ...level2];
    if (reachableIds.length === 0) return [];

    // Origine = position du chercheur (pour calcul de distance / filtre rayon).
    let origin: GeoPoint | null = null;
    if (radiusKm && radiusKm > 0) {
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

    const categoryFilter: Prisma.RecommendationWhereInput = categoryId?.trim()
      ? { categoryId: categoryId.trim() }
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
      const isDirect = level1.has(ownerId);
      const visible = isDirect
        ? true // un ami direct partage avec ses amis ET amis d'amis dans les deux cas
        : reco.visibility === RecommendationVisibility.friends_of_friends;

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

  private toResult(
    reco: RecoWithRelations,
    distance: RelationalDistance,
    profile: NonNullable<RecoWithRelations['user']['profile']>,
    distanceKm: number | null = null,
  ): SearchResult {
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
      },
      distance,
      distanceKm,
    };
  }
}
