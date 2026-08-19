import {
  Controller,
  Post,
  Get,
  Param,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import type { Request } from 'express';
import { BookmarksService } from './bookmarks.service';

@Controller('bookmarks')
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Post(':postId')
  async toggleBookmark(@Param('postId') postId: string, @Req() req: Request) {
    return this.bookmarksService.toggleBookmark(req.user!.uid, postId);
  }

  @Get(':userId')
  async getUserBookmarks(@Param('userId') userId: string, @Req() req: Request) {
    if (userId !== req.user!.uid) {
      throw new ForbiddenException('You can only view your own bookmarks');
    }
    return this.bookmarksService.getUserBookmarks(userId);
  }

  @Get(':postId/status/:userId')
  async getBookmarkStatus(
    @Param('postId') postId: string,
    @Param('userId') userId: string,
    @Req() req: Request,
  ) {
    if (userId !== req.user!.uid) {
      throw new ForbiddenException(
        'You can only check your own bookmark status',
      );
    }
    return this.bookmarksService.isBookmarked(userId, postId);
  }
}
