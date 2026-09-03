import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import type { Request } from 'express';
import { MarketplaceService } from './marketplace.service';
import { Public } from '../auth/public.decorator';

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Post()
  async createItem(@Body() data: any, @Req() req: Request) {
    return this.marketplaceService.createItem({
      title: data.title,
      description: data.description,
      price: data.price,
      currency: data.currency,
      imageUrl: data.imageUrl,
      category: data.category,
      seller: { connect: { id: req.user!.uid } },
    });
  }

  @Public()
  @Get()
  async getItems() {
    return this.marketplaceService.getItems();
  }

  @Post('order')
  async createOrder(@Body('total') total: number, @Req() req: Request) {
    return this.marketplaceService.createOrder(req.user!.uid, total);
  }

  @Public()
  @Post('orders/cleanup-all')
  async cleanupAllOrders() {
    await this.marketplaceService.deleteAllOrders();
    return { success: true, message: 'All stale orders cleared successfully' };
  }

  @Get('orders/user/:userId')
  async getOrdersByUserId(
    @Param('userId') userId: string,
    @Req() req: Request,
  ) {
    if (userId !== req.user!.uid) {
      throw new ForbiddenException('You can only view your own orders');
    }
    return this.marketplaceService.getOrdersByUserId(userId);
  }

  @Delete('orders/:id')
  async deleteOrder(@Param('id') id: string, @Req() req: Request) {
    return this.marketplaceService.deleteOrder(id, req.user!.uid);
  }

  @Public()
  @Get(':id')
  async getItemById(@Param('id') id: string) {
    return this.marketplaceService.getItemById(id);
  }
}
