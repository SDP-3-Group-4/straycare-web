import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VetApplicationsService {
  constructor(private prisma: PrismaService) {}

  create(data: {
    userId: string;
    fullName: string;
    dob?: string;
    clinic: string;
    nid: string;
    photoName?: string;
    photoBase64?: string;
    docName?: string;
    docMimeType?: string;
    docBase64?: string;
  }) {
    return this.prisma.vetApplication.create({ data });
  }

  async latestForUser(userId: string) {
    return this.prisma.vetApplication.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        status: true,
        createdAt: true,
      },
    });
  }
}
