-- AlterTable
ALTER TABLE "User" ADD COLUMN "lastSeenAt" DATETIME;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AccessLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "userId" TEXT,
    "event" TEXT NOT NULL DEFAULT 'login',
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AccessLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_AccessLog" ("createdAt", "email", "id", "userId") SELECT "createdAt", "email", "id", "userId" FROM "AccessLog";
DROP TABLE "AccessLog";
ALTER TABLE "new_AccessLog" RENAME TO "AccessLog";
CREATE INDEX "AccessLog_email_createdAt_idx" ON "AccessLog"("email", "createdAt");
CREATE INDEX "AccessLog_createdAt_idx" ON "AccessLog"("createdAt");
CREATE INDEX "AccessLog_event_createdAt_idx" ON "AccessLog"("event", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
