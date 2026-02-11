-- CreateTable
CREATE TABLE "WorkingDay" (
    "id" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "WorkingDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DayOff" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,

    CONSTRAINT "DayOff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkingDay_dayOfWeek_key" ON "WorkingDay"("dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "DayOff_date_key" ON "DayOff"("date");
