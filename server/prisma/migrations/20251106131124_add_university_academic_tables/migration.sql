-- CreateTable
CREATE TABLE "university_degree_levels" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "degreeLevel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "university_degree_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "university_fields" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "universityDegreeLevelId" TEXT NOT NULL,
    "degreeLevel" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "university_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "university_programs" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "universityDegreeLevelId" TEXT NOT NULL,
    "universityFieldId" TEXT NOT NULL,
    "degreeLevel" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "programName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "university_programs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "university_degree_levels_universityId_degreeLevel_key" ON "university_degree_levels"("universityId", "degreeLevel");

-- CreateIndex
CREATE UNIQUE INDEX "university_fields_universityId_degreeLevel_fieldName_key" ON "university_fields"("universityId", "degreeLevel", "fieldName");

-- CreateIndex
CREATE UNIQUE INDEX "university_programs_universityId_degreeLevel_fieldName_prog_key" ON "university_programs"("universityId", "degreeLevel", "fieldName", "programName");

-- AddForeignKey
ALTER TABLE "university_degree_levels" ADD CONSTRAINT "university_degree_levels_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "university_fields" ADD CONSTRAINT "university_fields_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "university_fields" ADD CONSTRAINT "university_fields_universityDegreeLevelId_fkey" FOREIGN KEY ("universityDegreeLevelId") REFERENCES "university_degree_levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "university_programs" ADD CONSTRAINT "university_programs_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "university_programs" ADD CONSTRAINT "university_programs_universityDegreeLevelId_fkey" FOREIGN KEY ("universityDegreeLevelId") REFERENCES "university_degree_levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "university_programs" ADD CONSTRAINT "university_programs_universityFieldId_fkey" FOREIGN KEY ("universityFieldId") REFERENCES "university_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;
