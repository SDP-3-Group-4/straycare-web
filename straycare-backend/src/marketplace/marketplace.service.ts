import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class MarketplaceService {
  constructor(private prisma: PrismaService) {}

  async createItem(data: Prisma.MarketplaceItemCreateInput) {
    return this.prisma.marketplaceItem.create({ data });
  }

  async getItems() {
    return this.prisma.marketplaceItem.findMany({
      orderBy: { createdAt: 'desc' },
      include: { seller: true },
    });
  }

  async getItemById(id: string) {
    return this.prisma.marketplaceItem.findUnique({
      where: { id },
      include: { seller: true },
    });
  }

  async createOrder(userId: string, total: number) {
    return this.prisma.order.create({
      data: {
        userId,
        total,
        status: 'pending',
      },
    });
  }

  async getOrdersByUserId(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
