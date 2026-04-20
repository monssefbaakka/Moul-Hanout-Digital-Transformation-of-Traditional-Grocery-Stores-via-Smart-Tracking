import { Module } from '@nestjs/common';
import { AlertsController } from './alerts.controller';
import { ALERTS_PORT } from './alerts.port';
import { AlertsService } from './alerts.service';

@Module({
  controllers: [AlertsController],
  providers: [
    AlertsService,
    {
      provide: ALERTS_PORT,
      useExisting: AlertsService,
    },
  ],
  exports: [ALERTS_PORT],
})
export class AlertsModule {}
