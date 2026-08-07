import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProfilesModule } from './profiles/profiles.module';
import { NetworkModule } from './network/network.module';
import { FriendshipsModule } from './friendships/friendships.module';
import { CategoriesModule } from './categories/categories.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { SearchModule } from './search/search.module';
import { IntroductionRequestsModule } from './introduction-requests/introduction-requests.module';
import { NotificationsModule } from './notifications/notifications.module';
import { InvitationsModule } from './invitations/invitations.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 60,
      },
      {
        name: 'auth',
        ttl: 60000,
        limit: 10,
      },
      {
        name: 'invitations',
        ttl: 60000,
        limit: 20,
      },
    ]),
    PrismaModule,
    NetworkModule,
    AuthModule,
    UsersModule,
    ProfilesModule,
    FriendshipsModule,
    CategoriesModule,
    RecommendationsModule,
    SearchModule,
    IntroductionRequestsModule,
    NotificationsModule,
    InvitationsModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
