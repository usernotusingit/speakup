-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentEmail" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Enrollment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Enrollment_studentEmail_idx" ON "Enrollment"("studentEmail");

-- CreateIndex
CREATE INDEX "Enrollment_teacherId_idx" ON "Enrollment"("teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_studentEmail_teacherId_key" ON "Enrollment"("studentEmail", "teacherId");
