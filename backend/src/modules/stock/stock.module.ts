import { Module } from '@nestjs/common';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';
import { StockExpiryJob } from './jobs/stock-expiry.job';

@Module({
  controllers: [StockController],
  providers: [StockService, StockExpiryJob],
  exports: [StockService],
})
export class StockModule {}
