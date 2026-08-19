import { Controller, Post, Get, Param, Req } from '@nestjs/common';
import type { Request } from 'express';
import { LikesService } from './likes.service';

@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post(':postId')
  async toggleLike(@Param('postId') postId: string, @Req() req: Request) {
    return this.likesService.toggleLike(req.user!.uid, postId);
  }

  @Get(':postId/status/:userId')
  async getLikeStatus(
    @Param('postId') postId: string,
    @Param('userId') userId: string,
  ) {
    return this.likesService.isLiked(userId, postId);
  }
}
