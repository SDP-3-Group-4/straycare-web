import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import type { Request } from 'express';
import { ConnectionsService } from './connections.service';

@Controller('connections')
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  @Post('request')
  async requestConnection(
    @Body('recipientId') recipientId: string,
    @Req() req: Request,
  ) {
    return this.connectionsService.requestConnection(
      req.user!.uid,
      recipientId,
    );
  }

  @Post(':requesterId/accept')
  async acceptConnection(
    @Param('requesterId') requesterId: string,
    @Req() req: Request,
  ) {
    return this.connectionsService.acceptConnection(requesterId, req.user!.uid);
  }

  @Post(':requesterId/decline')
  async declineConnection(
    @Param('requesterId') requesterId: string,
    @Req() req: Request,
  ) {
    return this.connectionsService.declineConnection(requesterId, req.user!.uid);
  }

  @Get(':userId')
  async getUserConnections(@Param('userId') userId: string) {
    return this.connectionsService.getUserConnections(userId);
  }

  @Get('status/:userId1/:userId2')
  async getConnectionStatus(
    @Param('userId1') userId1: string,
    @Param('userId2') userId2: string,
  ) {
    return this.connectionsService.getConnectionStatus(userId1, userId2);
  }

  @Delete(':userId')
  async disconnect(@Param('userId') userId: string, @Req() req: Request) {
    return this.connectionsService.disconnect(req.user!.uid, userId);
  }
}
