import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.OWNER)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('daily-sales')
  dailySales(@Query('date') date: string) {
    return this.reportsService.dailySales(date ?? new Date().toISOString().slice(0, 10));
  }

  @Get('top-products')
  topProducts(@Query('limit') limit?: number) {
    return this.reportsService.topProducts(limit);
  }

  @Get('cashier-performance')
  cashierPerformance(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.cashierPerformance(startDate, endDate);
  }

  @Get('inventory')
  inventory() {
    return this.reportsService.inventorySummary();
  }
}
