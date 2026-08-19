import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Post()
  async createItem(@Body() data: any) {
    return this.marketplaceService.createItem({
      title: data.title,
      description: data.description,
      price: data.price,
      currency: data.currency,
      imageUrl: data.imageUrl,
      category: data.category,
      seller: { connect: { id: data.sellerId } }
    });
  }

  @Get()
  async getItems() {
    return this.marketplaceService.getItems();
  }

  @Post('order')
  async createOrder(@Body() data: { userId: string, total: number }) {
    return this.marketplaceService.createOrder(data.userId, data.total);
  }

  @Get('orders/user/:userId')
  async getOrdersByUserId(@Param('userId') userId: string) {
    return this.marketplaceService.getOrdersByUserId(userId);
  }

  @Get(':id')
  async getItemById(@Param('id') id: string) {
    return this.marketplaceService.getItemById(id);
  }
}
