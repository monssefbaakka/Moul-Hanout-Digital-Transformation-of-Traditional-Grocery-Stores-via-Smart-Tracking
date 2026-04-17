import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(Role.OWNER)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Roles(Role.OWNER)
  @Patch(':id/deactivate')
  deactivate(
    @CurrentUser('shopId') shopId: string,
    @Param('id') userId: string,
  ) {
    return this.usersService.deactivate(shopId, userId);
  }
}
