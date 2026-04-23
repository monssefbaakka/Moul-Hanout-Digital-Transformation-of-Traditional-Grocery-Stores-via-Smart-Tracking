import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  GetInventoryReportQueryDto,
  GetSalesReportQueryDto,
} from './dto/report.dto';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Roles(Role.OWNER)
  @Get('dashboard')
  @ApiOkResponse({
    description:
      'Aggregated operational dashboard data for today, low-stock products, and products expiring within five days.',
  })
  getDashboard(@CurrentUser('shopId') shopId: string) {
    return this.reportsService.getDashboard(shopId);
  }

  @Roles(Role.OWNER)
  @Get('sales')
  @ApiOkResponse({
    description: 'Sales grouped by day for the given date range.',
  })
  getSalesReport(
    @CurrentUser('shopId') shopId: string,
    @Query() query: GetSalesReportQueryDto,
  ) {
    return this.reportsService.getSalesReport(shopId, query);
  }

  @Roles(Role.OWNER)
  @Get('inventory')
  @ApiOkResponse({
    description: 'Low-stock products and products expiring within N days.',
  })
  getInventoryReport(
    @CurrentUser('shopId') shopId: string,
    @Query() query: GetInventoryReportQueryDto,
  ) {
    return this.reportsService.getInventoryReport(shopId, query);
  }

  @Roles(Role.OWNER)
  @Get('sales/export')
  @ApiProduces('text/csv')
  @ApiOkResponse({
    description: 'CSV file of daily sales for the given date range.',
  })
  async exportSalesCsv(
    @CurrentUser('shopId') shopId: string,
    @Query() query: GetSalesReportQueryDto,
    @Res() res: Response,
  ) {
    const csv = await this.reportsService.exportSalesCsv(shopId, query);
    const from = query.from ?? 'debut';
    const to = query.to ?? 'fin';
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="ventes-${from}-${to}.csv"`,
    });
    res.send(csv);
  }
}
