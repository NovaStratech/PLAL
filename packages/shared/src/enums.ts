// Enums partagés entre l'API et le frontend.

export enum FriendshipStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export enum RecommendationType {
  PERSON = 'person',
  PLACE = 'place',
  ACTIVITY = 'activity',
  SERVICE = 'service',
}

export enum RecommendationVisibility {
  FRIENDS = 'friends',
  FRIENDS_OF_FRIENDS = 'friends_of_friends',
}

export enum IntroductionRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
}

export enum NotificationType {
  FRIEND_REQUEST = 'friend_request',
  FRIEND_REQUEST_ACCEPTED = 'friend_request_accepted',
  INTRODUCTION_REQUEST = 'introduction_request',
  INTRODUCTION_ACCEPTED = 'introduction_accepted',
  INTRODUCTION_DECLINED = 'introduction_declined',
}

/** Distance relationnelle dans le réseau. */
export enum RelationalDistance {
  DIRECT = 'direct', // ami direct (niveau 1)
  FRIEND_OF_FRIEND = 'friend_of_friend', // ami d'ami (niveau 2)
}

export const RECOMMENDATION_TYPE_LABELS: Record<RecommendationType, string> = {
  [RecommendationType.PERSON]: 'Personne',
  [RecommendationType.PLACE]: 'Lieu',
  [RecommendationType.ACTIVITY]: 'Activité',
  [RecommendationType.SERVICE]: 'Service',
};

export const RELATIONAL_DISTANCE_LABELS: Record<RelationalDistance, string> = {
  [RelationalDistance.DIRECT]: 'Ami direct',
  [RelationalDistance.FRIEND_OF_FRIEND]: "Ami d'ami",
};
