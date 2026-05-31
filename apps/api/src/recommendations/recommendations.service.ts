import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  Prisma,
  RecommendationType,
  RecommendationVisibility,
} from '@prisma/client';
import type { Recommendation as RecommendationDTO } from '@plal/shared';
import { PrismaService } from '../prisma/prisma.service';
import { GeocodingService } from '../network/geocoding.service';
import { CreateRecommendationDto, UpdateRecommendationDto } from './dto/recommendation.dto';

type RecoWithCategory = Prisma.RecommendationGetPayload<{ include: { category: true } }>;

@Injectable()
export class RecommendationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geocoding: GeocodingService,
  ) {}

  async create(userId: string, dto: CreateRecommendationDto): Promise<RecommendationDTO> {
    const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
    if (!category) throw new NotFoundException('Catégorie introuvable.');

    const geo = await this.geocoding.geocodeCity(dto.city);

    const reco = await this.prisma.recommendation.create({
      data: {
        userId,
        categoryId: dto.categoryId,
        title: dto.title,
        description: dto.description,
        city: dto.city,
        latitude: geo?.latitude ?? null,
        longitude: geo?.longitude ?? null,
        type: dto.type as RecommendationType,
        visibility: (dto.visibility as RecommendationVisibility) ?? RecommendationVisibility.friends_of_friends,
      },
      include: { category: true },
    });

    return this.toDto(reco);
  }

  async listMine(userId: string): Promise<RecommendationDTO[]> {
    const recos = await this.prisma.recommendation.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
    return recos.map((r) => this.toDto(r));
  }

  async remove(userId: string, id: string): Promise<{ success: true }> {
    const reco = await this.prisma.recommendation.findUnique({ where: { id } });
    if (!reco) throw new NotFoundException('Recommandation introuvable.');
    if (reco.userId !== userId) throw new ForbiddenException('Action non autorisée.');
    await this.prisma.recommendation.delete({ where: { id } });
    return { success: true };
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateRecommendationDto,
  ): Promise<RecommendationDTO> {
    const reco = await this.prisma.recommendation.findUnique({ where: { id } });
    if (!reco) throw new NotFoundException('Recommandation introuvable.');
    if (reco.userId !== userId) throw new ForbiddenException('Action non autorisée.');

    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
      if (!category) throw new NotFoundException('Catégorie introuvable.');
    }

    const geo =
      dto.city !== undefined ? await this.geocoding.geocodeCity(dto.city) : undefined;

    const updated = await this.prisma.recommendation.update({
      where: { id },
      data: {
        categoryId: dto.categoryId,
        title: dto.title,
        description: dto.description,
        city: dto.city,
        ...(geo !== undefined
          ? { latitude: geo?.latitude ?? null, longitude: geo?.longitude ?? null }
          : {}),
        type: dto.type as RecommendationType | undefined,
        visibility: dto.visibility as RecommendationVisibility | undefined,
      },
      include: { category: true },
    });

    return this.toDto(updated);
  }

  private toDto(r: RecoWithCategory): RecommendationDTO {
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      city: r.city,
      type: r.type as RecommendationDTO['type'],
      visibility: r.visibility as RecommendationDTO['visibility'],
      category: { id: r.category.id, slug: r.category.slug, name: r.category.name },
      createdAt: r.createdAt.toISOString(),
    };
  }
}
