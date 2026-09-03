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
    const items = await this.prisma.marketplaceItem.findMany({
      orderBy: { createdAt: 'desc' },
      include: { seller: true },
    });
    return items.map((item) => ({
      ...item,
      currency:
        !item.currency ||
        item.currency.includes('α') ||
        item.currency.includes('│') ||
        item.currency.includes('º') ||
        item.currency === 'USD'
          ? '৳'
          : item.currency,
    }));
  }

  async getItemById(id: string) {
    const item = await this.prisma.marketplaceItem.findUnique({
      where: { id },
      include: { seller: true },
    });
    if (!item) return null;
    return {
      ...item,
      currency:
        !item.currency ||
        item.currency.includes('α') ||
        item.currency.includes('│') ||
        item.currency.includes('º') ||
        item.currency === 'USD'
          ? '৳'
          : item.currency,
    };
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

  async deleteOrder(id: string, userId: string) {
    return this.prisma.order.deleteMany({
      where: { id, userId },
    });
  }

  async deleteAllOrders() {
    return this.prisma.order.deleteMany({});
  }
}
