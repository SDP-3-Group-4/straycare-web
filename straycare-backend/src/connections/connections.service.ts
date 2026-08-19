import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ConnectionsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async requestConnection(requesterId: string, recipientId: string) {
    if (requesterId === recipientId) {
      throw new BadRequestException("Cannot connect with yourself");
    }

    const existing = await this.prisma.connection.findUnique({
      where: { requesterId_recipientId: { requesterId, recipientId } },
    });

    if (existing) {
      throw new BadRequestException(`Connection is already ${existing.status}`);
    }

    const connection = await this.prisma.connection.create({
      data: {
        requesterId,
        recipientId,
        status: 'pending',
      },
    });

    // Create notification for recipient
    await this.notificationsService.createNotification({
      userId: recipientId,
      senderId: requesterId,
      type: 'connection',
      content: 'sent you a connection request.',
    });

    return connection;
  }

  async acceptConnection(requesterId: string, recipientId: string) {
    const existing = await this.prisma.connection.findUnique({
      where: { requesterId_recipientId: { requesterId, recipientId } },
    });

    if (!existing) throw new NotFoundException('Connection request not found');

    const connection = await this.prisma.connection.update({
      where: { id: existing.id },
      data: { status: 'accepted' },
    });

    // Create notification for original requester
    await this.notificationsService.createNotification({
      userId: connection.requesterId,
      senderId: connection.recipientId,
      type: 'connection_accepted',
      content: 'accepted your connection request.',
    });

    return connection;
  }

  async declineConnection(requesterId: string, recipientId: string) {
    const existing = await this.prisma.connection.findUnique({
      where: { requesterId_recipientId: { requesterId, recipientId } },
    });

    if (!existing) throw new NotFoundException('Connection request not found');

    return this.prisma.connection.update({
      where: { id: existing.id },
      data: { status: 'rejected' },
    });
  }

  async getUserConnections(userId: string) {
    return this.prisma.connection.findMany({
      where: {
        OR: [
          { requesterId: userId, status: 'accepted' },
          { recipientId: userId, status: 'accepted' },
        ],
      },
      include: {
        requester: true,
        recipient: true,
      },
    });
  }

  async getConnectionStatus(userId1: string, userId2: string) {
    const connection = await this.prisma.connection.findFirst({
      where: {
        OR: [
          { requesterId: userId1, recipientId: userId2 },
          { requesterId: userId2, recipientId: userId1 },
        ],
      },
    });

    if (!connection) {
      return { status: 'none' };
    }
    
    return { 
      status: connection.status, 
      requesterId: connection.requesterId,
      recipientId: connection.recipientId
    };
  }
}
