import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { StockInDto, StockOutDto } from './dto/inventory.dto';
import { InventoryService } from './inventory.service';

@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiOkResponse({ description: 'Returns inventory items for the authenticated shop.' })
  findAll(@CurrentUser('shopId') shopId: string) {
    return this.inventoryService.findInventory(shopId);
  }

  @Roles(Role.OWNER)
  @Post('stock-in')
  @ApiCreatedResponse({ description: 'Adds stock to a product and records a stock movement.' })
  stockIn(
    @CurrentUser('shopId') shopId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: StockInDto,
  ) {
    return this.inventoryService.stockIn(shopId, userId, dto);
  }

  @Roles(Role.OWNER)
  @Post('stock-out')
  @ApiCreatedResponse({
    description: 'Removes stock from a product and records a stock movement.',
  })
  @ApiUnprocessableEntityResponse({
    description: 'Cannot remove more stock than is currently available.',
  })
  stockOut(
    @CurrentUser('shopId') shopId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: StockOutDto,
  ) {
    return this.inventoryService.stockOut(shopId, userId, dto);
  }

  @Roles(Role.OWNER)
  @Get('expiring-soon')
  @ApiOkResponse({ description: 'Returns products that expire within the next 5 days.' })
  findExpiringSoon(@CurrentUser('shopId') shopId: string) {
    return this.inventoryService.findExpiringSoon(shopId);
  }

  @Roles(Role.OWNER)
  @Get('movements')
  @ApiOkResponse({ description: 'Returns recent stock movement history for the shop.' })
  findMovements(@CurrentUser('shopId') shopId: string) {
    return this.inventoryService.findRecentMovements(shopId);
  }
}
