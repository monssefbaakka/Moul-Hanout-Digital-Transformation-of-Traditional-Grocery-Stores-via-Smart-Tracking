import { Module } from '@nestjs/common';
import { AlertsController } from './alerts.controller';
import { ALERTS_PORT } from './alerts.port';
import { AlertsEmailNotifierService } from './alerts-email-notifier.service';
import { AlertsService } from './alerts.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MailModule],
  controllers: [AlertsController],
  providers: [
    AlertsService,
    AlertsEmailNotifierService,
    {
      provide: ALERTS_PORT,
      useExisting: AlertsService,
    },
  ],
  exports: [ALERTS_PORT],
})
export class AlertsModule {}
