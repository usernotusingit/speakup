-- CreateTable
CREATE TABLE "LessonNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "bookId" INTEGER NOT NULL,
    "lessonId" INTEGER NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LessonNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "LessonNote_userId_idx" ON "LessonNote"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonNote_userId_bookId_lessonId_key" ON "LessonNote"("userId", "bookId", "lessonId");
