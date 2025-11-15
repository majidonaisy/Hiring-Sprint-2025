-- CreateTable
CREATE TABLE "assessments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "vehicleName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PICKUP_IN_PROGRESS',
    "totalDamageCost" REAL NOT NULL DEFAULT 0,
    "newDamageCost" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pickupAnalyzedAt" DATETIME,
    "returnAnalyzedAt" DATETIME,
    "completedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "photos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assessmentId" TEXT NOT NULL,
    "angle" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "storagePath" TEXT,
    "fileSize" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "photos_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "damages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assessmentId" TEXT NOT NULL,
    "angle" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "photoId" TEXT,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "boundingBoxX" INTEGER,
    "boundingBoxY" INTEGER,
    "boundingBoxWidth" INTEGER,
    "boundingBoxHeight" INTEGER,
    "estimatedCost" REAL NOT NULL DEFAULT 0,
    "aiConfidence" REAL NOT NULL DEFAULT 0,
    "isNew" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "damages_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "damages_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "photos" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "comparisons" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assessmentId" TEXT NOT NULL,
    "angle" TEXT NOT NULL,
    "pickupPhotoId" TEXT,
    "returnPhotoId" TEXT,
    "comparisonScore" REAL NOT NULL DEFAULT 0,
    "newDamagesCount" INTEGER NOT NULL DEFAULT 0,
    "newDamagesCost" REAL NOT NULL DEFAULT 0,
    "analysisData" TEXT,
    "comparedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "comparisons_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "comparisons_pickupPhotoId_fkey" FOREIGN KEY ("pickupPhotoId") REFERENCES "photos" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "comparisons_returnPhotoId_fkey" FOREIGN KEY ("returnPhotoId") REFERENCES "photos" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "assessments_vehicleId_idx" ON "assessments"("vehicleId");

-- CreateIndex
CREATE INDEX "assessments_status_idx" ON "assessments"("status");

-- CreateIndex
CREATE INDEX "photos_assessmentId_idx" ON "photos"("assessmentId");

-- CreateIndex
CREATE INDEX "photos_angle_phase_idx" ON "photos"("angle", "phase");

-- CreateIndex
CREATE UNIQUE INDEX "photos_assessmentId_angle_phase_key" ON "photos"("assessmentId", "angle", "phase");

-- CreateIndex
CREATE INDEX "damages_assessmentId_idx" ON "damages"("assessmentId");

-- CreateIndex
CREATE INDEX "damages_angle_phase_idx" ON "damages"("angle", "phase");

-- CreateIndex
CREATE INDEX "damages_isNew_idx" ON "damages"("isNew");

-- CreateIndex
CREATE INDEX "comparisons_assessmentId_idx" ON "comparisons"("assessmentId");

-- CreateIndex
CREATE INDEX "comparisons_angle_idx" ON "comparisons"("angle");

-- CreateIndex
CREATE UNIQUE INDEX "comparisons_assessmentId_angle_key" ON "comparisons"("assessmentId", "angle");
