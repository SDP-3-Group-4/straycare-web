import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';

@Controller('bookmarks')
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Post(':postId')
  async toggleBookmark(
    @Param('postId') postId: string,
    @Body('userId') userId: string,
  ) {
    return this.bookmarksService.toggleBookmark(userId, postId);
  }

  @Get(':userId')
  async getUserBookmarks(@Param('userId') userId: string) {
    return this.bookmarksService.getUserBookmarks(userId);
  }

  @Get(':postId/status/:userId')
  async getBookmarkStatus(
    @Param('postId') postId: string,
    @Param('userId') userId: string,
  ) {
    return this.bookmarksService.isBookmarked(userId, postId);
  }
}
