-- CreateIndex
CREATE INDEX "alerts_shopId_isRead_idx" ON "alerts"("shopId", "isRead");

-- CreateIndex
CREATE INDEX "products_shopId_idx" ON "products"("shopId");

-- CreateIndex
CREATE INDEX "products_shopId_isActive_idx" ON "products"("shopId", "isActive");

-- CreateIndex
CREATE INDEX "sales_shopId_idx" ON "sales"("shopId");

-- CreateIndex
CREATE INDEX "sales_shopId_soldAt_idx" ON "sales"("shopId", "soldAt");

-- CreateIndex
CREATE INDEX "sales_shopId_status_soldAt_idx" ON "sales"("shopId", "status", "soldAt");

-- CreateIndex
CREATE INDEX "sessions_userId_expiresAt_idx" ON "sessions"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "stock_movements_productId_createdAt_idx" ON "stock_movements"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "user_shop_roles_shopId_idx" ON "user_shop_roles"("shopId");
