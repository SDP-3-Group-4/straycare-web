import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async addComment(postId: string, userId: string, content: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const comment = await this.prisma.comment.create({
      data: {
        content,
        postId,
        userId,
      },
      include: { user: true },
    });

    await this.prisma.post.update({
      where: { id: postId },
      data: { commentsCount: { increment: 1 } },
    });

    if (post.authorId !== userId) {
      await this.notificationsService.createNotification({
        userId: post.authorId,
        senderId: userId,
        type: 'comment',
        content: 'commented on your post.',
        postId,
      });
    }

    return comment;
  }

  async getComments(postId: string, userId?: string) {
    const comments = await this.prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        likes: userId ? { where: { userId } } : false,
      },
    });

    return comments.map(c => ({
      ...c,
      isLiked: userId ? c.likes.length > 0 : false,
    }));
  }

  async updateComment(id: string, userId: string, content: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.userId !== userId) throw new UnauthorizedException('Unauthorized to edit this comment');

    return this.prisma.comment.update({
      where: { id },
      data: { content },
    });
  }

  async deleteComment(id: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.userId !== userId) throw new UnauthorizedException('Unauthorized to delete this comment');

    await this.prisma.comment.delete({ where: { id } });

    await this.prisma.post.update({
      where: { id: comment.postId },
      data: { commentsCount: { decrement: 1 } },
    });

    return { success: true };
  }

  async toggleCommentLike(id: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');

    const existing = await this.prisma.like.findUnique({
      where: { commentId_userId: { commentId: id, userId } },
    });

    if (existing) {
      await this.prisma.like.delete({ where: { id: existing.id } });
      const updated = await this.prisma.comment.update({
        where: { id },
        data: { likesCount: { decrement: 1 } },
      });
      return { liked: false, likesCount: updated.likesCount };
    } else {
      await this.prisma.like.create({
        data: { commentId: id, userId },
      });
      const updated = await this.prisma.comment.update({
        where: { id },
        data: { likesCount: { increment: 1 } },
      });

      if (comment.userId !== userId) {
        await this.notificationsService.createNotification({
          userId: comment.userId,
          senderId: userId,
          type: 'like',
          content: 'liked your comment.',
          postId: comment.postId, // we can optionally attach the post id
        });
      }

      return { liked: true, likesCount: updated.likesCount };
    }
  }
}
