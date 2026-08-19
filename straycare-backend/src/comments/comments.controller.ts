import { Controller, Post, Get, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { CommentsService } from './comments.service';

@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('posts/:postId/comments')
  async addComment(
    @Param('postId') postId: string,
    @Body('userId') userId: string,
    @Body('content') content: string,
  ) {
    return this.commentsService.addComment(postId, userId, content);
  }

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
    @Body('userId') userId: string,
    @Body('content') content: string,
  ) {
    return this.commentsService.updateComment(id, userId, content);
  }

  @Delete('comments/:id')
  async deleteComment(
    @Param('id') id: string,
    @Body('userId') userId: string,
  ) {
    return this.commentsService.deleteComment(id, userId);
  }

  @Post('comments/:id/like')
  async toggleCommentLike(
    @Param('id') id: string,
    @Body('userId') userId: string,
  ) {
    return this.commentsService.toggleCommentLike(id, userId);
  }
}
