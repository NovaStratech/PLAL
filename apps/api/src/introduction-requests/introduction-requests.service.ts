import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IntroductionRequestStatus, NotificationType, Prisma } from '@prisma/client';
import type { IntroductionRequest as IntroDTO, PublicProfile } from '@plal/shared';
import { PrismaService } from '../prisma/prisma.service';
import { NetworkService } from '../network/network.service';
import {
  CreateIntroductionRequestDto,
  RespondIntroductionRequestDto,
} from './dto/introduction-request.dto';

type IntroWithRelations = Prisma.IntroductionRequestGetPayload<{
  include: {
    requester: { include: { profile: true } };
    recommender: { include: { profile: true } };
    recommendation: { include: { category: true } };
  };
}>;

@Injectable()
export class IntroductionRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly network: NetworkService,
  ) {}

  async create(userId: string, dto: CreateIntroductionRequestDto): Promise<IntroDTO> {
    const reco = await this.prisma.recommendation.findUnique({
      where: { id: dto.recommendationId },
    });
    if (!reco) throw new NotFoundException('Recommandation introuvable.');
    if (reco.userId === userId) {
      throw new BadRequestException('Tu ne peux pas demander une mise en relation sur ta propre recommandation.');
    }

    // Sécurité : la recommandation doit appartenir au réseau (L1 ou L2) du demandeur.
    const { level1, level2 } = await this.network.buildGraph(userId);
    if (!level1.has(reco.userId) && !level2.has(reco.userId)) {
      throw new ForbiddenException('Cette recommandation n\'est pas accessible depuis ton réseau.');
    }

    const created = await this.prisma.introductionRequest.create({
      data: {
        requesterId: userId,
        recommenderId: reco.userId,
        recommendationId: reco.id,
        message: dto.message,
      },
      include: this.include(),
    });

    await this.notify(reco.userId, NotificationType.introduction_request, userId, {
      recommendation: reco.title,
    });

    return this.toDto(created);
  }

  async respond(
    userId: string,
    id: string,
    dto: RespondIntroductionRequestDto,
  ): Promise<IntroDTO> {
    const intro = await this.prisma.introductionRequest.findUnique({ where: { id } });
    if (!intro) throw new NotFoundException('Demande introuvable.');
    if (intro.recommenderId !== userId) {
      throw new ForbiddenException('Tu ne peux répondre qu\'aux demandes reçues.');
    }
    if (intro.status !== IntroductionRequestStatus.pending) {
      throw new BadRequestException('Cette demande a déjà été traitée.');
    }

    const status =
      dto.action === 'accept'
        ? IntroductionRequestStatus.accepted
        : IntroductionRequestStatus.declined;

    const updated = await this.prisma.introductionRequest.update({
      where: { id },
      data: { status, responseMessage: dto.responseMessage },
      include: this.include(),
    });

    await this.notify(
      intro.requesterId,
      status === IntroductionRequestStatus.accepted
        ? NotificationType.introduction_accepted
        : NotificationType.introduction_declined,
      userId,
    );

    return this.toDto(updated);
  }

  async listReceived(userId: string): Promise<IntroDTO[]> {
    const intros = await this.prisma.introductionRequest.findMany({
      where: { recommenderId: userId },
      include: this.include(),
      orderBy: { createdAt: 'desc' },
    });
    return intros.map((i) => this.toDto(i));
  }

  async listSent(userId: string): Promise<IntroDTO[]> {
    const intros = await this.prisma.introductionRequest.findMany({
      where: { requesterId: userId },
      include: this.include(),
      orderBy: { createdAt: 'desc' },
    });
    return intros.map((i) => this.toDto(i));
  }

  private include() {
    return {
      requester: { include: { profile: true } },
      recommender: { include: { profile: true } },
      recommendation: { include: { category: true } },
    } as const;
  }

  private async notify(
    userId: string,
    type: NotificationType,
    fromUserId: string,
    extra: Record<string, unknown> = {},
  ) {
    const fromProfile = await this.prisma.profile.findUnique({ where: { userId: fromUserId } });
    await this.prisma.notification.create({
      data: {
        userId,
        type,
        payload: { fromUserId, fromName: fromProfile?.firstName ?? 'Quelqu\'un', ...extra },
      },
    });
  }

  private profileToPublic(
    user: IntroWithRelations['requester'],
  ): PublicProfile & { userId: string } {
    const p = user.profile!;
    return {
      userId: user.id,
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      city: p.city,
      country: p.country,
      photoUrl: p.photoUrl,
      bio: p.bio,
    };
  }

  private toDto(i: IntroWithRelations): IntroDTO {
    return {
      id: i.id,
      message: i.message,
      responseMessage: i.responseMessage,
      status: i.status as IntroDTO['status'],
      createdAt: i.createdAt.toISOString(),
      recommendation: {
        id: i.recommendation.id,
        title: i.recommendation.title,
        city: i.recommendation.city,
        category: {
          id: i.recommendation.category.id,
          slug: i.recommendation.category.slug,
          name: i.recommendation.category.name,
        },
      },
      requester: this.profileToPublic(i.requester),
      recommender: this.profileToPublic(i.recommender),
    };
  }
}
