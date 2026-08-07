import type {
  AuthResponse,
  AuthUser,
  Category,
  CategorySuggestionResponse,
  Friendship,
  IntroductionRequest,
  Invitation,
  InvitationPreview,
  NotificationItem,
  PublicProfile,
  Recommendation,
  SearchResult,
} from '@plal/shared';
import { api, API_URL, apiFetch } from './api';

export interface UserSearchResult {
  userId: string;
  id: string;
  firstName: string;
  lastName: string | null;
  city: string | null;
  country: string | null;
  photoUrl: string | null;
  bio: string | null;
  relation: 'self' | 'friend' | 'pending' | 'none';
  mutualFriends?: number;
}

export interface PublicUserProfile {
  profile: PublicProfile & { userId: string };
  relation: 'self' | 'friend' | 'pending' | 'none';
  mutualFriendsCount: number;
  recommendations: Recommendation[];
}

export const services = {
  // Auth
  forgotPassword: (email: string) => api.post<{ success: true }>('/auth/forgot-password', { email }, false),
  resetPassword: (token: string, password: string) =>
    api.post<AuthResponse>('/auth/reset-password', { token, password }, false),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<{ success: true }>('/auth/change-password', { currentPassword, newPassword }),
  requestEmailChange: (newEmail: string) =>
    api.post<{ success: true }>('/auth/request-email-change', { newEmail }),
  confirmEmailChange: (token: string) =>
    api.post<AuthResponse>('/auth/confirm-email-change', { token }, false),

  // Profile
  getProfile: () => api.get<AuthUser>('/profile'),
  updateProfile: (data: Partial<Record<string, unknown>>) => api.patch<AuthUser>('/profile', data),

  // Categories
  getCategories: () => api.get<Category[]>('/categories'),
  suggestCategory: (name: string, description?: string) =>
    api.post<CategorySuggestionResponse>('/categories/suggestions', { name, description }),

  // Users
  searchUsers: (q: string) => api.get<UserSearchResult[]>(`/users/search?q=${encodeURIComponent(q)}`),
  getPublicProfile: (userId: string) => api.get<PublicUserProfile>(`/users/${userId}/profile`),

  // Friendships
  getFriends: () => api.get<Friendship[]>('/friendships'),
  getIncomingRequests: () => api.get<Friendship[]>('/friendships/requests/incoming'),
  getOutgoingRequests: () => api.get<Friendship[]>('/friendships/requests/outgoing'),
  sendFriendRequest: (receiverId: string) => api.post<Friendship>('/friendships', { receiverId }),
  respondFriendRequest: (id: string, action: 'accept' | 'reject') =>
    api.patch<Friendship>(`/friendships/${id}`, { action }),
  getFriendSuggestions: () => api.get<Array<UserSearchResult & { mutualFriends?: number }>>('/friendships/suggestions'),
  removeFriend: (id: string) => api.delete<{ success: true }>(`/friendships/${id}`),
  blockFriend: (friendUserId: string) =>
    api.post<{ success: true }>(`/friendships/block?friendUserId=${encodeURIComponent(friendUserId)}`, {}),
  unblockFriend: (friendUserId: string) =>
    api.post<{ success: true }>(`/friendships/unblock?friendUserId=${encodeURIComponent(friendUserId)}`, {}),
  getBlockedFriends: () => api.get<Friendship[]>('/friendships/blocked'),

  // Recommendations
  getMyRecommendations: () => api.get<Recommendation[]>('/recommendations'),
  createRecommendation: (data: {
    categoryId: string;
    title: string;
    description?: string;
    city?: string;
    type: string;
    visibility?: string;
  }) => api.post<Recommendation>('/recommendations', data),
  updateRecommendation: (
    id: string,
    data: {
      categoryId?: string;
      title?: string;
      description?: string;
      city?: string;
      type?: string;
      visibility?: string;
    },
  ) => api.patch<Recommendation>(`/recommendations/${id}`, data),
  deleteRecommendation: (id: string) => api.delete<{ success: true }>(`/recommendations/${id}`),

  // Search
  search: (
    q: string,
    city?: string,
    categoryId?: string,
    radiusKm?: number,
    maxDepth?: number,
    origin?: { latitude: number; longitude: number } | null,
  ) =>
    api.get<SearchResult[]>(
      `/search?q=${encodeURIComponent(q)}` +
        `${city ? `&city=${encodeURIComponent(city)}` : ''}` +
        `${categoryId ? `&categoryId=${encodeURIComponent(categoryId)}` : ''}` +
        `${radiusKm ? `&radiusKm=${radiusKm}` : ''}` +
        `${maxDepth ? `&maxDepth=${maxDepth}` : ''}` +
        `${origin ? `&originLatitude=${origin.latitude}&originLongitude=${origin.longitude}` : ''}`,
    ),
  geocodeCity: (city: string) =>
    api.get<{ latitude: number | null; longitude: number | null }>(
      `/search/geocode?city=${encodeURIComponent(city)}`,
    ),

  // Introduction requests
  createIntroduction: (
    recommendationId: string,
    message: string,
    responseType?: 'phone' | 'email' | 'social',
    viaUserId?: string,
  ) =>
    api.post<IntroductionRequest>('/introduction-requests', {
      recommendationId,
      message,
      ...(responseType ? { responseType } : {}),
      ...(viaUserId ? { viaUserId } : {}),
    }),
  getReceivedIntroductions: () => api.get<IntroductionRequest[]>('/introduction-requests/received'),
  getSentIntroductions: () => api.get<IntroductionRequest[]>('/introduction-requests/sent'),
  respondIntroduction: (
    id: string,
    action: 'accept' | 'decline',
    responseMessage?: string,
    responseType?: 'phone' | 'email' | 'social',
    responseValue?: string,
  ) =>
    api.patch<IntroductionRequest>(`/introduction-requests/${id}`, {
      action,
      responseMessage,
      ...(responseType ? { responseType } : {}),
      ...(responseValue ? { responseValue } : {}),
    }),

  // Notifications
  getNotifications: () => api.get<NotificationItem[]>('/notifications'),
  getUnreadNotificationCount: () => api.get<{ count: number }>('/notifications/unread-count'),
  markNotificationRead: (id: string) => api.patch<{ success: true }>(`/notifications/${id}/read`),
  markAllNotificationsRead: () => api.patch<{ success: true }>('/notifications/read-all'),
  streamNotifications: () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('plal_token') : null;
    const url = `${API_URL}/notifications/stream?token=${token}`;
    return new EventSource(url);
  },

  // Invitations
  createInvitation: (email?: string) =>
    api.post<Invitation>('/invitations', email ? { email } : {}),
  getMyInvitations: () => api.get<Invitation[]>('/invitations'),
  getInvitationPreview: (token: string) =>
    apiFetch<InvitationPreview>(`/invitations/${encodeURIComponent(token)}`, { auth: false }),
};
