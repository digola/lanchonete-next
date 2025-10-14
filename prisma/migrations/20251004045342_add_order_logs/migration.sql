-- CreateTable
CREATE TABLE "order_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "field" TEXT,
    "reason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "order_logs_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "order_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "order_logs_orderId_idx" ON "order_logs"("orderId");

-- CreateIndex
CREATE INDEX "order_logs_userId_idx" ON "order_logs"("userId");

-- CreateIndex
CREATE INDEX "order_logs_createdAt_idx" ON "order_logs"("createdAt");

-- CreateIndex
CREATE INDEX "order_logs_action_idx" ON "order_logs"("action");

-- CreateIndex
CREATE INDEX "order_logs_orderId_createdAt_idx" ON "order_logs"("orderId", "createdAt");
