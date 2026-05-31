import { Injectable } from '@nestjs/common';
import type { AuthUser } from '@plal/shared';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { profile: true },
    });
    return {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      onboardingCompleted: user.onboardingCompleted,
      profile: user.profile
        ? {
            id: user.profile.id,
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            city: user.profile.city,
            country: user.profile.country,
            photoUrl: user.profile.photoUrl,
            bio: user.profile.bio,
          }
        : null,
    };
  }

  async update(userId: string, dto: UpdateProfileDto): Promise<AuthUser> {
    const { onboardingCompleted, ...profileData } = dto;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(onboardingCompleted !== undefined ? { onboardingCompleted } : {}),
        profile: {
          update: profileData,
        },
      },
    });

    return this.getMe(userId);
  }
}
