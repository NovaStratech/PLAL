import { randomBytes } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { AuthResponse, AuthUser } from '@plal/shared';
import { PrismaService } from '../prisma/prisma.service';
import { InvitationsService } from '../invitations/invitations.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly invitations: InvitationsService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (existing) {
      throw new ConflictException('Un compte existe déjà avec cet email.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        profile: {
          create: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            city: dto.city,
            country: dto.country,
          },
        },
      },
      include: { profile: true },
    });

    // Si l'inscription provient d'un lien d'invitation, on relie d'office
    // le nouvel inscrit à l'inviteur (amitié acceptée + notification).
    if (dto.inviteToken) {
      await this.invitations.acceptForNewUser(dto.inviteToken, user.id);
    }

    return this.buildAuthResponse(user.id, user.email, user.emailVerified, user.onboardingCompleted, user.profile);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { profile: true },
    });
    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect.');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect.');
    }

    return this.buildAuthResponse(user.id, user.email, user.emailVerified, user.onboardingCompleted, user.profile);
  }

  async me(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { profile: true },
    });
    return this.toAuthUser(user.id, user.email, user.emailVerified, user.onboardingCompleted, user.profile);
  }

  async forgotPassword(email: string): Promise<{ success: true }> {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    // On répond toujours success pour ne pas révéler l'existence d'un compte.
    if (!user) return { success: true };

    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpiresAt: expiresAt },
    });

    await this.sendTokenEmail('reset-password', user.email, token);
    return { success: true };
  }

  async resetPassword(token: string, password: string): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({ where: { passwordResetToken: token } });
    if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt <= new Date()) {
      throw new BadRequestException('Lien de réinitialisation invalide ou expiré.');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
      include: { profile: true },
    });

    return this.buildAuthResponse(
      updated.id,
      updated.email,
      updated.emailVerified,
      updated.onboardingCompleted,
      updated.profile,
    );
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: true }> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Mot de passe actuel incorrect.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    return { success: true };
  }

  async requestEmailChange(userId: string, newEmail: string): Promise<{ success: true }> {
    const normalized = newEmail.toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email: normalized } });
    if (existing) {
      throw new ConflictException('Cette adresse email est déjà utilisée.');
    }

    const token = randomBytes(32).toString('base64url');
    await this.prisma.user.update({
      where: { id: userId },
      data: { emailChangeToken: token, emailChangePending: normalized },
    });

    await this.sendTokenEmail('confirm-email', normalized, token);
    return { success: true };
  }

  async confirmEmailChange(token: string): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({ where: { emailChangeToken: token } });
    if (!user || !user.emailChangePending) {
      throw new BadRequestException('Lien de confirmation invalide.');
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        email: user.emailChangePending,
        emailChangeToken: null,
        emailChangePending: null,
        emailVerified: false,
      },
      include: { profile: true },
    });

    return this.buildAuthResponse(
      updated.id,
      updated.email,
      updated.emailVerified,
      updated.onboardingCompleted,
      updated.profile,
    );
  }

  private buildAuthResponse(
    id: string,
    email: string,
    emailVerified: boolean,
    onboardingCompleted: boolean,
    profile: ProfileLike,
  ): AuthResponse {
    const accessToken = this.jwt.sign({ sub: id, email });
    return {
      accessToken,
      user: this.toAuthUser(id, email, emailVerified, onboardingCompleted, profile),
    };
  }

  private toAuthUser(
    id: string,
    email: string,
    emailVerified: boolean,
    onboardingCompleted: boolean,
    profile: ProfileLike,
  ): AuthUser {
    return {
      id,
      email,
      emailVerified,
      onboardingCompleted,
      profile: profile
        ? {
            id: profile.id,
            firstName: profile.firstName,
            lastName: profile.lastName,
            city: profile.city,
            country: profile.country,
            photoUrl: profile.photoUrl,
            bio: profile.bio,
            phoneNumber: profile.phoneNumber,
          }
        : null,
    };
  }

  /**
   * Envoi d'un email contenant un token d'action.
   * TODO: remplacer ce mock par un vrai service d'envoi (SendGrid, Brevo, AWS SES, etc.).
   * En développement, le token est loggué pour pouvoir être utilisé facilement.
   */
  private async sendTokenEmail(
    type: 'reset-password' | 'confirm-email',
    email: string,
    token: string,
  ) {
    const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:3000';
    const path = type === 'reset-password' ? '/reset-password' : '/confirm-email';
    const url = `${webOrigin}${path}?token=${encodeURIComponent(token)}`;
    // eslint-disable-next-line no-console
    console.log(`[EMAIL ${type.toUpperCase()}] to=${email} url=${url}`);
  }
}

type ProfileLike = {
  id: string;
  firstName: string;
  lastName: string | null;
  city: string | null;
  country: string | null;
  photoUrl: string | null;
  bio: string | null;
  phoneNumber: string | null;
} | null;
