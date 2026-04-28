-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Column" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'red',
    "boardId" TEXT NOT NULL,
    "order" TEXT NOT NULL,
    CONSTRAINT "Column_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Column" ("boardId", "id", "order", "title") SELECT "boardId", "id", "order", "title" FROM "Column";
DROP TABLE "Column";
ALTER TABLE "new_Column" RENAME TO "Column";
CREATE INDEX "Column_boardId_order_idx" ON "Column"("boardId", "order");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
