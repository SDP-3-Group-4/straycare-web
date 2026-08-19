import {
  Controller,
  Get,
  Post,
  Param,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import type { Request } from 'express';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get(':userId')
  async getUserNotifications(
    @Param('userId') userId: string,
    @Req() req: Request,
  ) {
    if (userId !== req.user!.uid) {
      throw new ForbiddenException('You can only view your own notifications');
    }
    return this.notificationsService.getUserNotifications(userId);
  }

  @Post(':id/read')
  async markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Post('read-all/:userId')
  async markAllAsRead(@Param('userId') userId: string, @Req() req: Request) {
    if (userId !== req.user!.uid) {
      throw new ForbiddenException(
        'You can only mark your own notifications as read',
      );
    }
    return this.notificationsService.markAllAsRead(userId);
  }
}
