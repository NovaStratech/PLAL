import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  IntroductionRequestStatus,
  IntroductionResponseType,
  IntroductionStepStatus,
  NotificationType,
  Prisma,
} from '@prisma/client';

function toResponseTypeEnum(value?: 'phone' | 'email' | 'social') {
  return value ? IntroductionResponseType[value] : null;
}
import type { IntroductionRequest as IntroDTO, PublicProfile } from '@plal/shared';
import { PrismaService } from '../prisma/prisma.service';
import { NetworkService } from '../network/network.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateIntroductionRequestDto,
  RespondIntroductionRequestDto,
} from './dto/introduction-request.dto';

type IntroWithRelations = Prisma.IntroductionRequestGetPayload<{
  include: {
    requester: { include: { profile: true } };
    recommendation: { include: { category: true; user: { include: { profile: true } } } };
    steps: { include: { user: { include: { profile: true } } } };
    currentStep: { include: { user: { include: { profile: true } } } };
  };
}>;

@Injectable()
export class IntroductionRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly network: NetworkService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateIntroductionRequestDto): Promise<IntroDTO> {
    const reco = await this.prisma.recommendation.findUnique({
      where: { id: dto.recommendationId },
      include: { user: { include: { profile: true } } },
    });
    if (!reco) throw new NotFoundException('Recommandation introuvable.');
    if (reco.userId === userId) {
      throw new BadRequestException('Tu ne peux pas demander une mise en relation sur ta propre recommandation.');
    }

    // Sécurité : la recommandation doit appartenir au réseau du demandeur.
    const path = await this.network.findShortestPath(userId, reco.userId, 4);
    if (!path) {
      throw new ForbiddenException('Cette recommandation n\'est pas accessible depuis ton réseau.');
    }

    // Si viaUserId est fourni, il doit être un intermédiaire valide sur le chemin.
    // Sinon, la demande démarre au premier intermédiaire de la chaîne de confiance.
    const viaUserId = dto.viaUserId;
    if (viaUserId && !path.userIds.includes(viaUserId)) {
      throw new BadRequestException('Intermédiaire invalide.');
    }
    const startIndex = viaUserId ? path.userIds.indexOf(viaUserId) : 0;

    const created = await this.prisma.$transaction(async (tx) => {
      const request = await tx.introductionRequest.create({
        data: {
          requesterId: userId,
          recommendationId: reco.id,
          message: dto.message,
          ...(dto.responseType ? { responseType: toResponseTypeEnum(dto.responseType) } : {}),
        },
        include: this.include(),
      });

      // Créer les étapes de validation pour chaque intermédiaire jusqu'à la cible.
      const steps: Awaited<ReturnType<typeof tx.introductionStep.create>>[] = [];
      for (let i = 0; i < path.userIds.length; i++) {
        const step = await tx.introductionStep.create({
          data: {
            introductionRequestId: request.id,
            userId: path.userIds[i],
            order: i + 1,
          },
        });
        steps.push(step);
      }

      // La première étape active est celle de l'intermédiaire choisi, ou la première étape de la chaîne.
      const currentStepId = steps[startIndex].id;
      await tx.introductionRequest.update({
        where: { id: request.id },
        data: { currentStepId },
        include: this.include(),
      });

      return await tx.introductionRequest.findUnique({
        where: { id: request.id },
        include: this.include(),
      });
    });

    const targetUserId = path.userIds[startIndex];
    await this.notify(targetUserId, NotificationType.introduction_request, userId, {
      recommendation: reco.title,
    });

    return this.toDto(created!);
  }

  async respond(
    userId: string,
    id: string,
    dto: RespondIntroductionRequestDto,
  ): Promise<IntroDTO> {
    const intro = await this.prisma.introductionRequest.findUnique({
      where: { id },
      include: this.include(),
    });
    if (!intro) throw new NotFoundException('Demande introuvable.');
    if (intro.status !== IntroductionRequestStatus.pending) {
      throw new BadRequestException('Cette demande a déjà été traitée.');
    }
    if (!intro.currentStep || intro.currentStep.userId !== userId) {
      throw new ForbiddenException('Tu ne peux répondre qu\'aux demandes reçues.');
    }

    const action = dto.action;

    const updated = await this.prisma.$transaction(async (tx) => {
      // Marquer l'étape actuelle comme traitée.
      const stepStatus =
        action === 'accept'
          ? IntroductionStepStatus.accepted
          : IntroductionStepStatus.declined;
      await tx.introductionStep.update({
        where: { id: intro.currentStepId! },
        data: { status: stepStatus, responseMessage: dto.responseMessage },
      });

      if (action === 'decline') {
        return tx.introductionRequest.update({
          where: { id },
          data: { status: IntroductionRequestStatus.declined },
          include: this.include(),
        });
      }

      // Accepté : y a-t-il une étape suivante ?
      const nextStep = await tx.introductionStep.findFirst({
        where: {
          introductionRequestId: id,
          order: { gt: intro.currentStep!.order },
          status: IntroductionStepStatus.pending,
        },
        orderBy: { order: 'asc' },
      });

      if (nextStep) {
        // On avance la demande à l'étape suivante.
        return tx.introductionRequest.update({
          where: { id },
          data: { currentStepId: nextStep.id },
          include: this.include(),
        });
      }

      // Dernière étape : la demande est acceptée définitivement.
      const responseType = dto.responseType
        ? IntroductionResponseType[dto.responseType]
        : null;
      return tx.introductionRequest.update({
        where: { id },
        data: {
          status: IntroductionRequestStatus.accepted,
          responseMessage: dto.responseMessage,
          ...(responseType ? { responseType } : {}),
          ...(dto.responseValue ? { responseValue: dto.responseValue } : {}),
        },
        include: this.include(),
      });
    });

    // Notifier l'initiateur en cas d'acceptation/decline final.
    const isFinal =
      updated.status === IntroductionRequestStatus.accepted ||
      updated.status === IntroductionRequestStatus.declined;
    if (isFinal) {
      await this.notify(
        intro.requesterId,
        updated.status === IntroductionRequestStatus.accepted
          ? NotificationType.introduction_accepted
          : NotificationType.introduction_declined,
        userId,
      );
    } else {
      // Notifier le prochain intermédiaire.
      await this.notify(
        updated.currentStep!.userId,
        NotificationType.introduction_request,
        intro.requesterId,
        { recommendation: intro.recommendation.title },
      );
    }

    // Invalider la notification de demande reçue par le répondant.
    await this.notifications.markReadByPayload(userId, NotificationType.introduction_request, {
      fromUserId: intro.requesterId,
    });

    return this.toDto(updated);
  }

  async listReceived(userId: string): Promise<IntroDTO[]> {
    const intros = await this.prisma.introductionRequest.findMany({
      where: {
        status: IntroductionRequestStatus.pending,
        currentStep: { userId },
      },
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
      recommendation: { include: { category: true, user: { include: { profile: true } } } },
      steps: { orderBy: { order: 'asc' } as const, include: { user: { include: { profile: true } } } },
      currentStep: { include: { user: { include: { profile: true } } } },
    } as const satisfies Prisma.IntroductionRequestInclude;
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
    user: { id: string; profile: { id: string; firstName: string; lastName: string | null; city: string | null; country: string | null; photoUrl: string | null; bio: string | null; phoneNumber: string | null } | null },
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
      phoneNumber: p.phoneNumber,
    };
  }

  private toDto(i: IntroWithRelations): IntroDTO {
    return {
      id: i.id,
      message: i.message,
      responseMessage: i.responseMessage,
      status: i.status as IntroDTO['status'],
      responseType: i.responseType as IntroDTO['responseType'],
      responseValue: i.responseValue,
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
        helper: this.profileToPublic(i.recommendation.user),
      },
      requester: this.profileToPublic(i.requester),
      currentStep: i.currentStep
        ? {
            id: i.currentStep.id,
            user: this.profileToPublic(i.currentStep.user),
            status: i.currentStep.status as IntroductionStepStatus,
            order: i.currentStep.order,
            responseMessage: i.currentStep.responseMessage,
          }
        : null,
      steps: i.steps.map((s) => ({
        id: s.id,
        user: this.profileToPublic(s.user),
        status: s.status as IntroDTO['steps'][number]['status'],
        order: s.order,
        responseMessage: s.responseMessage,
      })),
    };
  }
}
