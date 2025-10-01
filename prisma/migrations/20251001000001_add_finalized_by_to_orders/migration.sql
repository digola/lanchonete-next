-- AlterTable
ALTER TABLE "orders" ADD COLUMN "finalizedBy" TEXT;

-- CreateIndex
CREATE INDEX "orders_finalizedBy_idx" ON "orders"("finalizedBy");
