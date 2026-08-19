import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { LikesService } from './likes.service';

@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post(':postId')
  async toggleLike(
    @Param('postId') postId: string,
    @Body('userId') userId: string,
  ) {
    return this.likesService.toggleLike(userId, postId);
  }

  @Get(':postId/status/:userId')
  async getLikeStatus(
    @Param('postId') postId: string,
    @Param('userId') userId: string,
  ) {
    return this.likesService.isLiked(userId, postId);
  }
}
