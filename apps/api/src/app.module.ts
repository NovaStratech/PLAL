import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
  ],
})
export class AppModule {}
