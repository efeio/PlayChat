-- DropIndex
DROP INDEX "notifications_userId_isRead_idx";

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_createdAt_idx" ON "notifications"("userId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "users_emailVerifyToken_idx" ON "users"("emailVerifyToken");

-- CreateIndex
CREATE INDEX "users_passwordResetToken_idx" ON "users"("passwordResetToken");
