import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

// Simple Haversine distance in km
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async createPost(data: Prisma.PostCreateInput) {
    return this.prisma.post.create({
      data,
      include: { author: true },
    });
  }

  async getPosts(tab?: string, userId?: string, lat?: number, lng?: number) {
    let posts = await this.prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: true,
        _count: {
          select: { comments: true, likes: true },
        },
      },
    });

    if (tab === 'nearby') {
      let referenceLat = lat;
      let referenceLng = lng;

      // Fallback to user's saved location if browser location is not provided
      if (
        userId &&
        (referenceLat === undefined || referenceLng === undefined)
      ) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
        });
        if (user && user.latitude != null && user.longitude != null) {
          referenceLat = user.latitude;
          referenceLng = user.longitude;
        }
      }

      if (referenceLat !== undefined && referenceLng !== undefined) {
        // Filter posts within 100km radius
        posts = posts.filter((post) => {
          if (post.latitude == null || post.longitude == null) return false;
          const dist = getDistance(
            referenceLat,
            referenceLng,
            post.latitude,
            post.longitude,
          );
          // Attach distance temporarily for sorting
          (post as any).distance = dist;
          return dist <= 100; // 100 km radius filter
        });

        // Sort by distance
        posts.sort((a: any, b: any) => a.distance - b.distance);
      }
    }

    return posts;
  }

  async getPostById(id: string) {
    return this.prisma.post.findUnique({
      where: { id },
      include: {
        author: true,
        comments: {
          include: { user: true },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { likes: true },
        },
      },
    });
  }

  async updatePost(id: string, authorId: string, data: any) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== authorId)
      throw new NotFoundException('Unauthorized to edit this post');

    return this.prisma.post.update({
      where: { id },
      data: {
        content: data.content,
        location: data.location,
        latitude: data.latitude,
        longitude: data.longitude,
      },
    });
  }

  async deletePost(id: string, authorId: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== authorId)
      throw new NotFoundException('Unauthorized to delete this post');

    return this.prisma.post.delete({
      where: { id },
    });
  }

  async donateToPost(id: string, userId: string, amount: number) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: { author: true },
    });
    if (!post) throw new NotFoundException('Post not found');

    // Update post amounts
    const updatedPost = await this.prisma.post.update({
      where: { id },
      data: {
        raisedAmount: { increment: amount },
        donorsCount: { increment: 1 },
      },
    });

    // Send notification to the author if it's not their own donation
    if (post.authorId !== userId) {
      const donor = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      await this.notificationsService.createNotification({
        userId: post.authorId,
        type: 'donation',
        content: `${donor?.displayName || 'Someone'} donated ৳${amount} to your fundraiser "${post.content.substring(0, 20)}..."`,
        senderId: userId,
        postId: post.id,
      });
    }

    return updatedPost;
  }
}
