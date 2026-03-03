import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService, CreateCategoryDto } from './categories.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums';

@ApiTags('categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Roles(Role.OWNER)
  @Post()
  create(@Body() dto: CreateCategoryDto) { return this.categoriesService.create(dto); }

  @Get()
  findAll() { return this.categoriesService.findAll(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.categoriesService.findOne(id); }

  @Roles(Role.OWNER)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateCategoryDto>) {
    return this.categoriesService.update(id, dto);
  }

  @Roles(Role.OWNER)
  @Delete(':id')
  remove(@Param('id') id: string) { return this.categoriesService.remove(id); }
}
