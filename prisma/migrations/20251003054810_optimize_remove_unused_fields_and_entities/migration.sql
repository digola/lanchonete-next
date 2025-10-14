/*
  Warnings:

  - You are about to drop the `activity_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `notifications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `system_settings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `imageUrl` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryFee` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedDeliveryTime` on the `orders` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "activity_logs_createdAt_idx";

-- DropIndex
DROP INDEX "activity_logs_entityId_idx";

-- DropIndex
DROP INDEX "activity_logs_entityType_idx";

-- DropIndex
DROP INDEX "activity_logs_action_idx";

-- DropIndex
DROP INDEX "activity_logs_userId_idx";

-- DropIndex
DROP INDEX "notifications_priority_idx";

-- DropIndex
DROP INDEX "notifications_createdAt_idx";

-- DropIndex
DROP INDEX "notifications_isRead_idx";

-- DropIndex
DROP INDEX "notifications_type_idx";

-- DropIndex
DROP INDEX "notifications_userId_idx";

-- DropIndex
DROP INDEX "system_settings_category_idx";

-- DropIndex
DROP INDEX "system_settings_key_idx";

-- DropIndex
DROP INDEX "system_settings_key_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "activity_logs";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "notifications";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "system_settings";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_categories" ("color", "createdAt", "description", "id", "isActive", "name", "updatedAt") SELECT "color", "createdAt", "description", "id", "isActive", "name", "updatedAt" FROM "categories";
DROP TABLE "categories";
ALTER TABLE "new_categories" RENAME TO "categories";
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");
CREATE TABLE "new_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "total" REAL NOT NULL,
    "deliveryType" TEXT NOT NULL DEFAULT 'RETIRADA',
    "deliveryAddress" TEXT,
    "paymentMethod" TEXT NOT NULL DEFAULT 'DINHEIRO',
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "isReceived" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "tableId" TEXT,
    "finalizedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "orders_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "tables" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "orders_finalizedBy_fkey" FOREIGN KEY ("finalizedBy") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_orders" ("createdAt", "deliveryAddress", "deliveryType", "finalizedBy", "id", "isReceived", "notes", "paymentMethod", "status", "tableId", "total", "updatedAt", "userId") SELECT "createdAt", "deliveryAddress", "deliveryType", "finalizedBy", "id", "isReceived", "notes", "paymentMethod", "status", "tableId", "total", "updatedAt", "userId" FROM "orders";
DROP TABLE "orders";
ALTER TABLE "new_orders" RENAME TO "orders";
CREATE INDEX "orders_userId_idx" ON "orders"("userId");
CREATE INDEX "orders_status_idx" ON "orders"("status");
CREATE INDEX "orders_createdAt_idx" ON "orders"("createdAt");
CREATE INDEX "orders_tableId_idx" ON "orders"("tableId");
CREATE INDEX "orders_deliveryType_idx" ON "orders"("deliveryType");
CREATE INDEX "orders_finalizedBy_idx" ON "orders"("finalizedBy");
CREATE INDEX "orders_isActive_idx" ON "orders"("isActive");
CREATE INDEX "orders_status_tableId_idx" ON "orders"("status", "tableId");
CREATE INDEX "orders_userId_status_idx" ON "orders"("userId", "status");
CREATE INDEX "orders_createdAt_status_idx" ON "orders"("createdAt", "status");
CREATE INDEX "orders_tableId_status_idx" ON "orders"("tableId", "status");
CREATE INDEX "orders_isActive_status_idx" ON "orders"("isActive", "status");
CREATE INDEX "orders_userId_isActive_idx" ON "orders"("userId", "isActive");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("createdAt", "email", "id", "isActive", "name", "password", "role", "updatedAt") SELECT "createdAt", "email", "id", "isActive", "name", "password", "role", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_role_idx" ON "users"("role");
CREATE INDEX "users_isActive_idx" ON "users"("isActive");
CREATE INDEX "users_role_isActive_idx" ON "users"("role", "isActive");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "order_items_orderId_productId_idx" ON "order_items"("orderId", "productId");

-- CreateIndex
CREATE INDEX "products_categoryId_isAvailable_idx" ON "products"("categoryId", "isAvailable");

-- CreateIndex
CREATE INDEX "products_name_isAvailable_idx" ON "products"("name", "isAvailable");

-- CreateIndex
CREATE INDEX "tables_status_assignedTo_idx" ON "tables"("status", "assignedTo");
