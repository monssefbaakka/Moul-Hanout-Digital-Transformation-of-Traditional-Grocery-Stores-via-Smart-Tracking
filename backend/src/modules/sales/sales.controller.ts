import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
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
import { CreateSaleDto, GetSalesQueryDto } from './dto/sale.dto';
import { SalesService } from './sales.service';

@ApiTags('sales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Roles(Role.OWNER, Role.CASHIER)
  @Get()
  @ApiOkResponse({ description: 'Returns a paginated sales list for the authenticated shop.' })
  findAll(@CurrentUser('shopId') shopId: string, @Query() query: GetSalesQueryDto) {
    return this.salesService.findAll(shopId, query);
  }

  @Roles(Role.OWNER, Role.CASHIER)
  @Post()
  @ApiCreatedResponse({ description: 'Creates a sale, payment, and stock movements.' })
  @ApiUnprocessableEntityResponse({
    description: 'One or more products are missing or do not have enough stock.',
  })
  create(
    @CurrentUser('shopId') shopId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateSaleDto,
  ) {
    return this.salesService.create(shopId, userId, dto);
  }
}
