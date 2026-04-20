import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AlertsService } from './alerts.service';

@ApiTags('alerts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  @ApiOkResponse({ description: 'Returns alerts for the authenticated shop.' })
  findAll(@CurrentUser('shopId') shopId: string) {
    return this.alertsService.findAll(shopId);
  }

  @Patch(':id/read')
  @ApiOkResponse({ description: 'Marks an alert as read.' })
  markAsRead(
    @CurrentUser('shopId') shopId: string,
    @Param('id') alertId: string,
  ) {
    return this.alertsService.markAsRead(shopId, alertId);
  }
}
