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
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@ApiTags('categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOkResponse({
    description: 'Returns active categories for the authenticated shop.',
  })
  findAll(@CurrentUser('shopId') shopId: string) {
    return this.categoriesService.findActiveByShop(shopId);
  }

  @Roles(Role.OWNER)
  @Post()
  @ApiCreatedResponse({
    description: 'Creates a category for the authenticated shop.',
  })
  create(
    @CurrentUser('shopId') shopId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(shopId, dto);
  }

  @Roles(Role.OWNER)
  @Patch(':id')
  @ApiOkResponse({
    description: 'Updates a category for the authenticated shop.',
  })
  update(
    @CurrentUser('shopId') shopId: string,
    @Param('id') categoryId: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(shopId, categoryId, dto);
  }

  @Roles(Role.OWNER)
  @Patch(':id/deactivate')
  @ApiOkResponse({
    description: 'Soft-deletes a category for the authenticated shop.',
  })
  deactivate(
    @CurrentUser('shopId') shopId: string,
    @Param('id') categoryId: string,
  ) {
    return this.categoriesService.deactivate(shopId, categoryId);
  }
}
