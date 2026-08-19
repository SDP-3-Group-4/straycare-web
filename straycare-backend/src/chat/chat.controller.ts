import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  getConversations(@Query('userId') userId: string, @Req() req: Request) {
    if (userId !== req.user!.uid) {
      throw new ForbiddenException(
        'You can only access your own conversations',
      );
    }
    return this.chatService.getConversations(userId);
  }

  @Post()
  createConversation(
    @Body('targetUserId') targetUserId: string,
    @Req() req: Request,
  ) {
    if (!targetUserId)
      throw new BadRequestException('targetUserId is required');
    return this.chatService.createConversation(req.user!.uid, targetUserId);
  }

  @Get(':id/messages')
  getMessages(
    @Param('id') id: string,
    @Query('userId') userId: string,
    @Req() req: Request,
  ) {
    if (userId !== req.user!.uid) {
      throw new ForbiddenException('You can only read your own messages');
    }
    return this.chatService.getMessages(userId, id);
  }

  @Post(':id/messages')
  sendMessage(
    @Param('id') id: string,
    @Body('content') content: string,
    @Req() req: Request,
    @Body('imageUrl') imageUrl?: string,
  ) {
    if (!content) throw new BadRequestException('content is required');
    return this.chatService.sendMessage(req.user!.uid, id, content, imageUrl);
  }

  @Post(':id/read')
  markAsRead(@Param('id') id: string, @Req() req: Request) {
    return this.chatService.markAsRead(req.user!.uid, id);
  }
}
