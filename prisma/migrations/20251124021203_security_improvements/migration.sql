-- AlterTable
ALTER TABLE "StoredImage" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "notesData" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "tumblrConnectedAt" TIMESTAMP(3),
ADD COLUMN     "tumblrOAuthToken" TEXT,
ADD COLUMN     "tumblrOAuthTokenSecret" TEXT,
ADD COLUMN     "tumblrUsername" TEXT;

-- AlterTable
ALTER TABLE "UserPreferences" ADD COLUMN     "allowDuplicateImageUrls" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "blogFilterLimit" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN     "maxStoredNotes" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "slideshowAutoplay" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slideshowInterval" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "slideshowShuffle" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slideshowTransition" TEXT NOT NULL DEFAULT 'fade';

-- CreateTable
CREATE TABLE "BlogVisitHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "blogName" TEXT NOT NULL,
    "displayName" TEXT,
    "avatar" TEXT,
    "lastVisited" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visitCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogVisitHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storedImageId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "blogName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "timestamp" TIMESTAMP(3),
    "replyText" TEXT,
    "reblogParentBlog" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiCallStats" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiCallStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BlogVisitHistory_userId_idx" ON "BlogVisitHistory"("userId");

-- CreateIndex
CREATE INDEX "BlogVisitHistory_userId_lastVisited_idx" ON "BlogVisitHistory"("userId", "lastVisited");

-- CreateIndex
CREATE INDEX "BlogVisitHistory_blogName_idx" ON "BlogVisitHistory"("blogName");

-- CreateIndex
CREATE UNIQUE INDEX "BlogVisitHistory_userId_blogName_key" ON "BlogVisitHistory"("userId", "blogName");

-- CreateIndex
CREATE INDEX "Note_userId_idx" ON "Note"("userId");

-- CreateIndex
CREATE INDEX "Note_storedImageId_idx" ON "Note"("storedImageId");

-- CreateIndex
CREATE INDEX "Note_type_idx" ON "Note"("type");

-- CreateIndex
CREATE UNIQUE INDEX "ApiCallStats_date_key" ON "ApiCallStats"("date");

-- CreateIndex
CREATE INDEX "ApiCallStats_date_idx" ON "ApiCallStats"("date");

-- CreateIndex
CREATE INDEX "StoredImage_userId_url_idx" ON "StoredImage"("userId", "url");

-- CreateIndex
CREATE INDEX "StoredImage_deletedAt_idx" ON "StoredImage"("deletedAt");

-- CreateIndex
CREATE INDEX "StoredImage_userId_blogName_storedAt_idx" ON "StoredImage"("userId", "blogName", "storedAt");

-- CreateIndex
CREATE INDEX "User_tumblrUsername_idx" ON "User"("tumblrUsername");

-- AddForeignKey
ALTER TABLE "BlogVisitHistory" ADD CONSTRAINT "BlogVisitHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_storedImageId_fkey" FOREIGN KEY ("storedImageId") REFERENCES "StoredImage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
