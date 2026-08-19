import { Module } from '@nestjs/common';
import { NimService } from './nim.service';
import { AutoResponseService } from './auto-response.service';
import { AiBotController } from './ai-bot.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [AiBotController],
  providers: [NimService, AutoResponseService],
  exports: [NimService, AutoResponseService],
})
export class AiModule {}
