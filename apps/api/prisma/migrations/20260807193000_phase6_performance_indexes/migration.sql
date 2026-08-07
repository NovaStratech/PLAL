-- CreateIndex for better notification query performance
CREATE INDEX IF NOT EXISTS "Notification_userId_read_idx" ON "Notification"("userId", "read");
CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt" DESC);

-- CreateIndex for better Recommendation query performance (search by city)
CREATE INDEX IF NOT EXISTS "Recommendation_city_idx" ON "Recommendation"("city");
CREATE INDEX IF NOT EXISTS "Recommendation_userId_createdAt_idx" ON "Recommendation"("userId", "createdAt" DESC);

-- CreateIndex for better Friendship query performance
CREATE INDEX IF NOT EXISTS "Friendship_requesterId_status_idx" ON "Friendship"("requesterId", "status");
CREATE INDEX IF NOT EXISTS "Friendship_receiverId_status_idx" ON "Friendship"("receiverId", "status");

-- CreateIndex for IntroductionRequest pagination
CREATE INDEX IF NOT EXISTS "IntroductionRequest_requesterId_createdAt_idx" ON "IntroductionRequest"("requesterId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "IntroductionRequest_status_createdAt_idx" ON "IntroductionRequest"("status", "createdAt" DESC);

-- CreateIndex for Invitation expiration checks
CREATE INDEX IF NOT EXISTS "Invitation_status_expiresAt_idx" ON "Invitation"("status", "expiresAt");

-- CreateIndex for Profile lookups by email via User
CREATE INDEX IF NOT EXISTS "User_email_emailVerified_idx" ON "User"("email", "emailVerified");
