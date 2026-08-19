import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class LikesService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async toggleLike(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException("Post not found");
    }

    const existing = await this.prisma.like.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existing) {
      await this.prisma.like.delete({
        where: { id: existing.id },
      });
      const updatedPost = await this.prisma.post.update({
        where: { id: postId },
        data: { likesCount: { decrement: 1 } },
      });
      return { liked: false, likesCount: updatedPost.likesCount };
    } else {
      await this.prisma.like.create({
        data: { postId, userId },
      });
      const updatedPost = await this.prisma.post.update({
        where: { id: postId },
        data: { likesCount: { increment: 1 } },
      });

      // Notify the post author
      await this.notificationsService.createNotification({
        userId: post.authorId,
        senderId: userId,
        type: 'like',
        content: 'liked your post.',
        postId: postId,
      });

      return { liked: true, likesCount: updatedPost.likesCount };
    }
  }

  async isLiked(userId: string, postId: string) {
    const existing = await this.prisma.like.findUnique({
      where: { postId_userId: { postId, userId } },
    });
    return { liked: !!existing };
  }
}
