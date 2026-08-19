import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { ConnectionsService } from './connections.service';

@Controller('connections')
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  @Post('request')
  async requestConnection(
    @Body('requesterId') requesterId: string,
    @Body('recipientId') recipientId: string,
  ) {
    return this.connectionsService.requestConnection(requesterId, recipientId);
  }

  @Post(':recipientId/accept')
  async acceptConnection(
    @Param('recipientId') recipientId: string,
    @Body('requesterId') requesterId: string,
  ) {
    return this.connectionsService.acceptConnection(requesterId, recipientId);
  }

  @Post(':recipientId/decline')
  async declineConnection(
    @Param('recipientId') recipientId: string,
    @Body('requesterId') requesterId: string,
  ) {
    return this.connectionsService.declineConnection(requesterId, recipientId);
  }

  @Get(':userId')
  async getUserConnections(@Param('userId') userId: string) {
    return this.connectionsService.getUserConnections(userId);
  }
}
