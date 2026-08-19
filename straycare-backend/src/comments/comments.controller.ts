import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { CommentsService } from './comments.service';
import { Public } from '../auth/public.decorator';

@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('posts/:postId/comments')
  async addComment(
    @Param('postId') postId: string,
    @Body('content') content: string,
    @Req() req: Request,
  ) {
    return this.commentsService.addComment(postId, req.user!.uid, content);
  }

  @Public()
  @Get('posts/:postId/comments')
  async getComments(
    @Param('postId') postId: string,
    @Query('userId') userId?: string,
  ) {
    return this.commentsService.getComments(postId, userId);
  }

  @Put('comments/:id')
  async updateComment(
    @Param('id') id: string,
    @Body('content') content: string,
    @Req() req: Request,
  ) {
    return this.commentsService.updateComment(id, req.user!.uid, content);
  }

  @Delete('comments/:id')
  async deleteComment(@Param('id') id: string, @Req() req: Request) {
    return this.commentsService.deleteComment(id, req.user!.uid);
  }

  @Post('comments/:id/like')
  async toggleCommentLike(@Param('id') id: string, @Req() req: Request) {
    return this.commentsService.toggleCommentLike(id, req.user!.uid);
  }
}
