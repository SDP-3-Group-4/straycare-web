import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookmarksService {
  constructor(private prisma: PrismaService) {}

  async toggleBookmark(userId: string, postId: string) {
    const existing = await this.prisma.bookmark.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existing) {
      await this.prisma.bookmark.delete({
        where: { id: existing.id },
      });
      return { bookmarked: false };
    } else {
      await this.prisma.bookmark.create({
        data: {
          postId,
          userId,
        },
      });
      return { bookmarked: true };
    }
  }

  async getUserBookmarks(userId: string) {
    return this.prisma.bookmark.findMany({
      where: { userId },
      include: {
        post: {
          include: {
            author: true,
            _count: {
              select: { comments: true, likes: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async isBookmarked(userId: string, postId: string) {
    const existing = await this.prisma.bookmark.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });
    return { bookmarked: !!existing };
  }
}
