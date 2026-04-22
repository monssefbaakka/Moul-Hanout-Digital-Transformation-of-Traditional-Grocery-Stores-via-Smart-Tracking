import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
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
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { ProductsService } from './products.service';

@ApiTags('products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Roles(Role.OWNER)
  @Get('manage')
  @ApiOkResponse({
    description: 'Returns all products for the authenticated shop owner.',
  })
  findAllForOwner(@CurrentUser('shopId') shopId: string) {
    return this.productsService.findAllByShop(shopId);
  }

  @Get()
  @ApiOkResponse({
    description: 'Returns active products for the authenticated shop.',
  })
  findAll(@CurrentUser('shopId') shopId: string) {
    return this.productsService.findActiveByShop(shopId);
  }

  @Roles(Role.OWNER)
  @Post()
  @ApiCreatedResponse({
    description: 'Creates a product for the authenticated shop.',
  })
  @ApiConflictResponse({
    description: 'RG07 duplicate barcode within the shop.',
  })
  @ApiUnprocessableEntityResponse({ description: 'RG08 invalid pricing rule.' })
  create(@CurrentUser('shopId') shopId: string, @Body() dto: CreateProductDto) {
    return this.productsService.create(shopId, dto);
  }

  @Roles(Role.OWNER)
  @Patch(':id')
  @ApiOkResponse({
    description: 'Updates a product for the authenticated shop.',
  })
  @ApiConflictResponse({
    description: 'RG07 duplicate barcode within the shop.',
  })
  @ApiUnprocessableEntityResponse({ description: 'RG08 invalid pricing rule.' })
  update(
    @CurrentUser('shopId') shopId: string,
    @Param('id') productId: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(shopId, productId, dto);
  }
}
