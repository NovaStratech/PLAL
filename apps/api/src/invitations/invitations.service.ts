import { randomBytes } from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FriendshipStatus, InvitationStatus, NotificationType, Prisma } from '@prisma/client';
import type { Invitation as InvitationDTO, InvitationPreview } from '@plal/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvitationDto } from './dto/invitation.dto';

/** Durée de validité d'un lien d'invitation. */
const INVITATION_TTL_DAYS = 14;

@Injectable()
export class InvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /** Crée un lien d'invitation partageable pour l'utilisateur courant. */
  async create(userId: string, dto: CreateInvitationDto): Promise<InvitationDTO> {
    const token = randomBytes(24).toString('base64url');
    const expiresAt = new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000);

    const invitation = await this.prisma.invitation.create({
      data: {
        inviterId: userId,
        token,
        email: dto.email,
        expiresAt,
      },
    });

    return this.toDto(invitation);
  }

  /** Liste les invitations encore en attente de l'utilisateur courant. */
  async listMine(userId: string): Promise<InvitationDTO[]> {
    const invitations = await this.prisma.invitation.findMany({
      where: { inviterId: userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return invitations.map((i) => this.toDto(i));
  }

  /** Aperçu public d'une invitation (pour la page d'inscription). */
  async preview(token: string): Promise<InvitationPreview> {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
      include: { inviter: { include: { profile: true } } },
    });

    const valid =
      !!invitation &&
      invitation.status === InvitationStatus.pending &&
      invitation.expiresAt > new Date();

    return {
      inviterFirstName: invitation?.inviter.profile?.firstName ?? '',
      valid,
    };
  }

  /**
   * Consomme une invitation au moment de l'inscription : crée l'amitié
   * (acceptée d'office) entre l'inviteur et le nouvel inscrit, marque
   * l'invitation comme acceptée et notifie l'inviteur.
   *
   * Tolérant : un token invalide/expiré n'empêche jamais l'inscription.
   */
  async acceptForNewUser(token: string, newUserId: string): Promise<void> {
    const invitation = await this.prisma.invitation.findUnique({ where: { token } });
    if (
      !invitation ||
      invitation.status !== InvitationStatus.pending ||
      invitation.expiresAt <= new Date() ||
      invitation.inviterId === newUserId
    ) {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.accepted, acceptedById: newUserId },
      });

      // Amitié directe acceptée d'office (l'invitation vaut consentement mutuel).
      const existing = await tx.friendship.findFirst({
        where: {
          OR: [
            { requesterId: invitation.inviterId, receiverId: newUserId },
            { requesterId: newUserId, receiverId: invitation.inviterId },
          ],
        },
      });
      if (existing) {
        if (existing.status !== FriendshipStatus.accepted) {
          await tx.friendship.update({
            where: { id: existing.id },
            data: { status: FriendshipStatus.accepted },
          });
        }
      } else {
        await tx.friendship.create({
          data: {
            requesterId: invitation.inviterId,
            receiverId: newUserId,
            status: FriendshipStatus.accepted,
          },
        });
      }

      const newProfile = await tx.profile.findUnique({ where: { userId: newUserId } });
      await tx.notification.create({
        data: {
          userId: invitation.inviterId,
          type: NotificationType.invitation_accepted,
          payload: {
            fromUserId: newUserId,
            fromName: newProfile?.firstName ?? 'Quelqu\'un',
          },
        },
      });
    });
  }

  private toDto(invitation: Prisma.InvitationGetPayload<object>): InvitationDTO {
    const webOrigin = this.config.get<string>('WEB_ORIGIN') ?? 'http://localhost:3000';
    return {
      id: invitation.id,
      token: invitation.token,
      email: invitation.email,
      status: invitation.status as InvitationDTO['status'],
      url: `${webOrigin}/register?invite=${invitation.token}`,
      acceptedById: invitation.acceptedById,
      expiresAt: invitation.expiresAt.toISOString(),
      createdAt: invitation.createdAt.toISOString(),
    };
  }
}
