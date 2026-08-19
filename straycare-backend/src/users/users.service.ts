import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createUser(data: Prisma.UserCreateInput) {
    const existing = await this.prisma.user.findUnique({
      where: { id: data.id },
    });
    if (existing) return existing;
    return this.prisma.user.create({
      data: {
        ...data,
        lastSeenAt: new Date(),
      },
    });
  }

  async touchPresence(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { lastSeenAt: new Date() },
    });
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        displayName: true,
        handle: true,
        photoUrl: true,
        verifiedStatus: true,
      },
    });
  }

  async getUser(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        posts: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { posts: true, comments: true },
        },
      },
    });
  }

  async updateUser(id: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }
}
