-- CreateEnum
CREATE TYPE "MoodType" AS ENUM ('HAPPY', 'SAD', 'ANXIOUS', 'NEUTRAL', 'STRESSED');

-- CreateEnum
CREATE TYPE "TrainingStatus" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "member_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatar" TEXT,
    "moodToday" "MoodType" NOT NULL DEFAULT 'NEUTRAL',
    "journalEntries" INTEGER NOT NULL DEFAULT 0,
    "supportSessions" INTEGER NOT NULL DEFAULT 0,
    "consecutiveDays" INTEGER NOT NULL DEFAULT 0,
    "lastActive" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bio" TEXT,
    "preferredTopics" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listener_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatar" TEXT,
    "totalConversations" INTEGER NOT NULL DEFAULT 0,
    "activeNow" BOOLEAN NOT NULL DEFAULT false,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "responseTime" INTEGER NOT NULL DEFAULT 0,
    "availability" JSONB NOT NULL DEFAULT '[]',
    "specialties" JSONB NOT NULL DEFAULT '[]',
    "bio" TEXT,
    "trainingStatus" "TrainingStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listener_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demo_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "profile" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demo_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "member_profiles_userId_key" ON "member_profiles"("userId");

-- CreateIndex
CREATE INDEX "member_profiles_userId_idx" ON "member_profiles"("userId");

-- CreateIndex
CREATE INDEX "member_profiles_lastActive_idx" ON "member_profiles"("lastActive");

-- CreateIndex
CREATE UNIQUE INDEX "listener_profiles_userId_key" ON "listener_profiles"("userId");

-- CreateIndex
CREATE INDEX "listener_profiles_userId_idx" ON "listener_profiles"("userId");

-- CreateIndex
CREATE INDEX "listener_profiles_activeNow_idx" ON "listener_profiles"("activeNow");

-- CreateIndex
CREATE INDEX "listener_profiles_trainingStatus_idx" ON "listener_profiles"("trainingStatus");

-- CreateIndex
CREATE UNIQUE INDEX "demo_users_email_key" ON "demo_users"("email");

-- CreateIndex
CREATE INDEX "demo_users_email_idx" ON "demo_users"("email");
