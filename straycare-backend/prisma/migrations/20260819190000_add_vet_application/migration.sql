-- CreateTable
CREATE TABLE "VetApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "dob" TEXT,
    "clinic" TEXT NOT NULL,
    "nid" TEXT NOT NULL,
    "photoName" TEXT,
    "photoBase64" TEXT,
    "docName" TEXT,
    "docMimeType" TEXT,
    "docBase64" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VetApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VetApplication_userId_idx" ON "VetApplication"("userId");

-- AddForeignKey
ALTER TABLE "VetApplication" ADD CONSTRAINT "VetApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;