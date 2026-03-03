import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { StockService, AdjustStockDto } from './stock.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role, StockStatus } from '../../common/enums';

@ApiTags('stock')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  findAll(@Query('status') status?: StockStatus) {
    return this.stockService.findAll(status);
  }

  @Get('low-stock')
  findLowStock() { return this.stockService.findLowStock(); }

  @Get('expired')
  findExpired() { return this.stockService.findExpired(); }

  @Roles(Role.OWNER)
  @Post('adjust')
  adjust(@Body() dto: AdjustStockDto) {
    return this.stockService.adjust(dto);
  }
}
