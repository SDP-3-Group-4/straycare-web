import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  getConversations(@Query('userId') userId: string) {
    if (!userId) throw new Error('userId query param is required');
    return this.chatService.getConversations(userId);
  }

  @Post()
  createConversation(@Body('userId') userId: string, @Body('targetUserId') targetUserId: string) {
    if (!userId || !targetUserId) throw new Error('userId and targetUserId are required');
    return this.chatService.createConversation(userId, targetUserId);
  }

  @Get(':id/messages')
  getMessages(@Param('id') id: string, @Query('userId') userId: string) {
    if (!userId) throw new Error('userId query param is required');
    return this.chatService.getMessages(userId, id);
  }

  @Post(':id/messages')
  sendMessage(
    @Param('id') id: string, 
    @Body('userId') userId: string,
    @Body('content') content: string,
    @Body('imageUrl') imageUrl?: string,
  ) {
    if (!userId) throw new Error('userId is required in body');
    return this.chatService.sendMessage(userId, id, content, imageUrl);
  }

  @Post(':id/read')
  markAsRead(@Param('id') id: string, @Body('userId') userId: string) {
    if (!userId) throw new Error('userId is required in body');
    return this.chatService.markAsRead(userId, id);
  }
}
