import type {
  AuthUser,
  Category,
  Friendship,
  IntroductionRequest,
  NotificationItem,
  Recommendation,
  SearchResult,
} from '@plal/shared';
import { api } from './api';

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
}

export const services = {
  // Profile
  getProfile: () => api.get<AuthUser>('/profile'),
  updateProfile: (data: Partial<Record<string, unknown>>) => api.patch<AuthUser>('/profile', data),

  // Categories
  getCategories: () => api.get<Category[]>('/categories'),

  // Users
  searchUsers: (q: string) => api.get<UserSearchResult[]>(`/users/search?q=${encodeURIComponent(q)}`),

  // Friendships
  getFriends: () => api.get<Friendship[]>('/friendships'),
  getIncomingRequests: () => api.get<Friendship[]>('/friendships/requests/incoming'),
  getOutgoingRequests: () => api.get<Friendship[]>('/friendships/requests/outgoing'),
  sendFriendRequest: (receiverId: string) => api.post<Friendship>('/friendships', { receiverId }),
  respondFriendRequest: (id: string, action: 'accept' | 'reject') =>
    api.patch<Friendship>(`/friendships/${id}`, { action }),
  removeFriend: (id: string) => api.delete<{ success: true }>(`/friendships/${id}`),

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
  deleteRecommendation: (id: string) => api.delete<{ success: true }>(`/recommendations/${id}`),

  // Search
  search: (q: string, city?: string) =>
    api.get<SearchResult[]>(`/search?q=${encodeURIComponent(q)}${city ? `&city=${encodeURIComponent(city)}` : ''}`),

  // Introduction requests
  createIntroduction: (recommendationId: string, message: string) =>
    api.post<IntroductionRequest>('/introduction-requests', { recommendationId, message }),
  getReceivedIntroductions: () => api.get<IntroductionRequest[]>('/introduction-requests/received'),
  getSentIntroductions: () => api.get<IntroductionRequest[]>('/introduction-requests/sent'),
  respondIntroduction: (id: string, action: 'accept' | 'decline', responseMessage?: string) =>
    api.patch<IntroductionRequest>(`/introduction-requests/${id}`, { action, responseMessage }),

  // Notifications
  getNotifications: () => api.get<NotificationItem[]>('/notifications'),
  markNotificationRead: (id: string) => api.patch<{ success: true }>(`/notifications/${id}/read`),
  markAllNotificationsRead: () => api.patch<{ success: true }>('/notifications/read-all'),
};
