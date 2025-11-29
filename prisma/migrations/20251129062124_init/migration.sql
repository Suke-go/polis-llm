-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "prompt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Story" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "sf_story_ja" TEXT NOT NULL,
    "policy_story_ja" TEXT NOT NULL,
    "status_story_approved" BOOLEAN NOT NULL DEFAULT false,
    "image_url" TEXT,
    "status_image_generated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proposition" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "ja_text" TEXT NOT NULL,
    "en_text" TEXT,
    "back_translated_ja" TEXT,
    "translation_diff_score" DOUBLE PRECISION,
    "status_edit_approved" BOOLEAN NOT NULL DEFAULT false,
    "status_aps_approved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Proposition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Statement" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "propositionId" TEXT NOT NULL,
    "text_ja" TEXT NOT NULL,
    "text_en" TEXT,
    "selected_for_voting" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Statement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "participantId" TEXT NOT NULL,
    "statementId" TEXT NOT NULL,
    "vote" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("participantId","statementId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Story_sessionId_key" ON "Story"("sessionId");

-- CreateIndex
CREATE INDEX "Statement_sessionId_idx" ON "Statement"("sessionId");

-- CreateIndex
CREATE INDEX "Statement_propositionId_idx" ON "Statement"("propositionId");

-- CreateIndex
CREATE UNIQUE INDEX "Statement_sessionId_propositionId_key" ON "Statement"("sessionId", "propositionId");

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposition" ADD CONSTRAINT "Proposition_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Statement" ADD CONSTRAINT "Statement_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Statement" ADD CONSTRAINT "Statement_propositionId_fkey" FOREIGN KEY ("propositionId") REFERENCES "Proposition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_statementId_fkey" FOREIGN KEY ("statementId") REFERENCES "Statement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
