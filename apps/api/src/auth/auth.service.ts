import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { AuthResponse, AuthUser } from '@plal/shared';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
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
          }
        : null,
    };
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
} | null;
