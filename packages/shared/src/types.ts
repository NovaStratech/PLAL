import {
  FriendshipStatus,
  IntroductionRequestStatus,
  InvitationStatus,
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
  phoneNumber: string | null;
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
  parentId?: string | null;
  children?: Category[];
}

export interface CategorySuggestionResponse {
  success: true;
  message: string;
  suggestionId: string | null;
}

export interface Friendship {
  id: string;
  status: FriendshipStatus;
  requesterId: string;
  receiverId: string;
  friend: PublicProfile & { userId: string };
  direction: 'incoming' | 'outgoing';
  blockedById: string | null;
  blockedAt: string | null;
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
  distanceKm: number | null;
  /** Chemin de confiance : IDs des intermédiaires + détenteur, sans l'initiateur. */
  path: string[];
  /** Profondeur relationnelle (1 = ami direct). */
  depth: number;
  /** Profils publics des intermédiaires + détenteur, dans l'ordre du chemin. */
  pathProfiles: Array<PublicProfile & { userId: string }>;
}

export interface IntroductionStep {
  id: string;
  user: PublicProfile & { userId: string };
  status: 'pending' | 'accepted' | 'declined';
  order: number;
  responseMessage: string | null;
}

export interface IntroductionRequest {
  id: string;
  message: string;
  responseMessage: string | null;
  responseType: 'phone' | 'email' | 'social' | null;
  responseValue: string | null;
  status: IntroductionRequestStatus;
  createdAt: string;
  recommendation: Pick<Recommendation, 'id' | 'title' | 'city'> & {
    category: Category;
    helper: PublicProfile & { userId: string };
  };
  requester: PublicProfile & { userId: string };
  currentStep: IntroductionStep | null;
  steps: IntroductionStep[];
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  read: boolean;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface Invitation {
  id: string;
  token: string;
  email: string | null;
  status: InvitationStatus;
  url: string;
  acceptedById: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface InvitationPreview {
  inviterFirstName: string;
  valid: boolean;
}
