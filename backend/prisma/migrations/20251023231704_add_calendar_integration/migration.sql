-- AlterTable
ALTER TABLE "users" ADD COLUMN     "autoJoinEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "autoJoinLeadTime" INTEGER NOT NULL DEFAULT 2;

-- CreateTable
CREATE TABLE "calendar_connections" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiry" TIMESTAMP(3) NOT NULL,
    "calendarId" TEXT NOT NULL,
    "calendarEmail" TEXT NOT NULL,
    "calendarName" TEXT,
    "webhookChannelId" TEXT,
    "webhookResourceId" TEXT,
    "webhookExpiry" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "syncEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT,
    "meetingUrl" TEXT,
    "platform" TEXT,
    "botJoined" BOOLEAN NOT NULL DEFAULT false,
    "botJoinScheduledFor" TIMESTAMP(3),
    "botJoinedAt" TIMESTAMP(3),
    "calendarConnectionId" TEXT NOT NULL,
    "meetingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "calendar_connections_webhookChannelId_key" ON "calendar_connections"("webhookChannelId");

-- CreateIndex
CREATE INDEX "calendar_connections_userId_idx" ON "calendar_connections"("userId");

-- CreateIndex
CREATE INDEX "calendar_connections_provider_idx" ON "calendar_connections"("provider");

-- CreateIndex
CREATE INDEX "calendar_connections_webhookChannelId_idx" ON "calendar_connections"("webhookChannelId");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_connections_userId_provider_calendarEmail_key" ON "calendar_connections"("userId", "provider", "calendarEmail");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_events_meetingId_key" ON "calendar_events"("meetingId");

-- CreateIndex
CREATE INDEX "calendar_events_calendarConnectionId_idx" ON "calendar_events"("calendarConnectionId");

-- CreateIndex
CREATE INDEX "calendar_events_startTime_idx" ON "calendar_events"("startTime");

-- CreateIndex
CREATE INDEX "calendar_events_botJoined_idx" ON "calendar_events"("botJoined");

-- CreateIndex
CREATE INDEX "calendar_events_meetingUrl_idx" ON "calendar_events"("meetingUrl");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_events_calendarConnectionId_externalEventId_key" ON "calendar_events"("calendarConnectionId", "externalEventId");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_connections" ADD CONSTRAINT "calendar_connections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_calendarConnectionId_fkey" FOREIGN KEY ("calendarConnectionId") REFERENCES "calendar_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
