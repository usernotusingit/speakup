-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentEmail" TEXT NOT NULL,
    "studentName" TEXT,
    "teacherId" TEXT NOT NULL,
    "start" DATETIME NOT NULL,
    "end" DATETIME NOT NULL,
    "summary" TEXT NOT NULL DEFAULT 'English Class',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "googleEventId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Booking_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Booking_teacherId_status_idx" ON "Booking"("teacherId", "status");

-- CreateIndex
CREATE INDEX "Booking_studentEmail_status_idx" ON "Booking"("studentEmail", "status");

-- CreateIndex
CREATE INDEX "Booking_teacherId_start_idx" ON "Booking"("teacherId", "start");
