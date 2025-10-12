-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "reference" TEXT,
    "userId" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stock_movements_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "stock_movements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "categoryId" TEXT NOT NULL,
    "preparationTime" INTEGER NOT NULL DEFAULT 15,
    "allergens" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "imageUrl" TEXT,
    "stockQuantity" INTEGER DEFAULT 0,
    "minStockLevel" INTEGER DEFAULT 5,
    "trackStock" BOOLEAN NOT NULL DEFAULT false,
    "maxStockLevel" INTEGER DEFAULT 100,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_products" ("allergens", "categoryId", "createdAt", "description", "id", "imageUrl", "isAvailable", "name", "preparationTime", "price", "updatedAt") SELECT "allergens", "categoryId", "createdAt", "description", "id", "imageUrl", "isAvailable", "name", "preparationTime", "price", "updatedAt" FROM "products";
DROP TABLE "products";
ALTER TABLE "new_products" RENAME TO "products";
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");
CREATE INDEX "products_isAvailable_idx" ON "products"("isAvailable");
CREATE INDEX "products_price_idx" ON "products"("price");
CREATE INDEX "products_name_idx" ON "products"("name");
CREATE INDEX "products_categoryId_isAvailable_idx" ON "products"("categoryId", "isAvailable");
CREATE INDEX "products_name_isAvailable_idx" ON "products"("name", "isAvailable");
CREATE INDEX "products_trackStock_idx" ON "products"("trackStock");
CREATE INDEX "products_stockQuantity_idx" ON "products"("stockQuantity");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "stock_movements_productId_idx" ON "stock_movements"("productId");

-- CreateIndex
CREATE INDEX "stock_movements_type_idx" ON "stock_movements"("type");

-- CreateIndex
CREATE INDEX "stock_movements_createdAt_idx" ON "stock_movements"("createdAt");

-- CreateIndex
CREATE INDEX "stock_movements_userId_idx" ON "stock_movements"("userId");

-- CreateIndex
CREATE INDEX "stock_movements_productId_createdAt_idx" ON "stock_movements"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "stock_movements_type_createdAt_idx" ON "stock_movements"("type", "createdAt");
