/*
  Warnings:

  - You are about to drop the column `isFavorite` on the `Movie` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Movie" DROP COLUMN "isFavorite",
ADD COLUMN     "isFavourite" BOOLEAN NOT NULL DEFAULT false;
