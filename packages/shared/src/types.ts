import {
  FriendshipStatus,
  IntroductionRequestStatus,
  NotificationType,
  RecommendationType,
  RecommendationVisibility,
  RelationalDistance,
} from './enums';

export interface PublicProfile {
  id: string;
  firstName: string;
  lastName: string | null;
  city: string | null;
  country: string | null;
  photoUrl: string | null;
  bio: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  profile: PublicProfile | null;
  onboardingCompleted: boolean;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
}

export interface Friendship {
  id: string;
  status: FriendshipStatus;
  requesterId: string;
  receiverId: string;
  friend: PublicProfile & { userId: string };
  direction: 'incoming' | 'outgoing';
  createdAt: string;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string | null;
  city: string | null;
  type: RecommendationType;
  visibility: RecommendationVisibility;
  category: Category;
  createdAt: string;
}

export interface SearchResult {
  recommendationId: string;
  title: string;
  description: string | null;
  city: string | null;
  type: RecommendationType;
  category: Category;
  helper: PublicProfile & { userId: string };
  distance: RelationalDistance;
}

export interface IntroductionRequest {
  id: string;
  message: string;
  responseMessage: string | null;
  status: IntroductionRequestStatus;
  createdAt: string;
  recommendation: Pick<Recommendation, 'id' | 'title' | 'city'> & {
    category: Category;
  };
  requester: PublicProfile & { userId: string };
  recommender: PublicProfile & { userId: string };
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  read: boolean;
  payload: Record<string, unknown>;
  createdAt: string;
}
