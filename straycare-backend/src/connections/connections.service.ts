import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ConnectionsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async requestConnection(requesterId: string, recipientId: string) {
    if (requesterId === recipientId) {
      throw new BadRequestException('Cannot connect with yourself');
    }

    const existing = await this.prisma.connection.findUnique({
      where: { requesterId_recipientId: { requesterId, recipientId } },
    });

    if (existing) {
      throw new BadRequestException(`Connection is already ${existing.status}`);
    }

    const connection = await this.prisma.connection.create({
      data: {
        requesterId,
        recipientId,
        status: 'pending',
      },
    });

    // Create notification for recipient
    await this.notificationsService.createNotification({
      userId: recipientId,
      senderId: requesterId,
      type: 'connection',
      content: 'sent you a connection request.',
    });

    return connection;
  }

  async acceptConnection(requesterId: string, recipientId: string) {
    const existing = await this.prisma.connection.findUnique({
      where: { requesterId_recipientId: { requesterId, recipientId } },
    });

    if (!existing) throw new NotFoundException('Connection request not found');

    const connection = await this.prisma.connection.update({
      where: { id: existing.id },
      data: { status: 'accepted' },
    });

    // Update recipient's connection request notification to accepted
    await this.prisma.notification.updateMany({
      where: {
        userId: recipientId,
        senderId: requesterId,
        type: 'connection',
      },
      data: {
        type: 'connection_accepted',
        content: 'is now connected with you.',
        isRead: true,
      },
    });

    // Create notification for original requester
    await this.notificationsService.createNotification({
      userId: connection.requesterId,
      senderId: connection.recipientId,
      type: 'connection_accepted',
      content: 'accepted your connection request.',
    });

    return connection;
  }

  async declineConnection(requesterId: string, recipientId: string) {
    const existing = await this.prisma.connection.findUnique({
      where: { requesterId_recipientId: { requesterId, recipientId } },
    });

    if (!existing) throw new NotFoundException('Connection request not found');

    const connection = await this.prisma.connection.update({
      where: { id: existing.id },
      data: { status: 'rejected' },
    });

    // Update recipient's connection request notification
    await this.prisma.notification.updateMany({
      where: {
        userId: recipientId,
        senderId: requesterId,
        type: 'connection',
      },
      data: {
        type: 'connection_declined',
        content: 'connection request was removed.',
        isRead: true,
      },
    });

    return connection;
  }

  async getUserConnections(userId: string) {
    return this.prisma.connection.findMany({
      where: {
        OR: [
          { requesterId: userId, status: 'accepted' },
          { recipientId: userId, status: 'accepted' },
        ],
      },
      include: {
        requester: true,
        recipient: true,
      },
    });
  }

  async getConnectionStatus(userId1: string, userId2: string) {
    const connection = await this.prisma.connection.findFirst({
      where: {
        OR: [
          { requesterId: userId1, recipientId: userId2 },
          { requesterId: userId2, recipientId: userId1 },
        ],
      },
    });

    if (!connection) {
      return { status: 'none' };
    }

    return {
      status: connection.status,
      requesterId: connection.requesterId,
      recipientId: connection.recipientId,
    };
  }

  async disconnect(userId1: string, userId2: string) {
    const connection = await this.prisma.connection.findFirst({
      where: {
        OR: [
          { requesterId: userId1, recipientId: userId2 },
          { requesterId: userId2, recipientId: userId1 },
        ],
      },
    });
    if (!connection) throw new NotFoundException('Connection not found');
    return this.prisma.connection.delete({ where: { id: connection.id } });
  }

  // ==========================================
  // GRAPH-BASED NETWORK & TRAVERSAL ALGORITHMS
  // ==========================================

  /**
   * Find mutual connections between user1 and user2 (Intersection of 1st-degree graph edges)
   */
  async getMutualConnections(userId1: string, userId2: string) {
    if (!userId1 || !userId2 || userId1 === userId2) {
      return { count: 0, mutuals: [] };
    }

    // 1st-degree connections of User 1
    const user1Conns = await this.prisma.connection.findMany({
      where: {
        status: 'accepted',
        OR: [{ requesterId: userId1 }, { recipientId: userId1 }],
      },
    });
    const user1FriendIds = new Set(
      user1Conns.map((c) =>
        c.requesterId === userId1 ? c.recipientId : c.requesterId,
      ),
    );

    // 1st-degree connections of User 2
    const user2Conns = await this.prisma.connection.findMany({
      where: {
        status: 'accepted',
        OR: [{ requesterId: userId2 }, { recipientId: userId2 }],
      },
    });
    const mutualIds = user2Conns
      .map((c) => (c.requesterId === userId2 ? c.recipientId : c.requesterId))
      .filter((id) => user1FriendIds.has(id));

    if (mutualIds.length === 0) {
      return { count: 0, mutuals: [] };
    }

    const mutuals = await this.prisma.user.findMany({
      where: { id: { in: mutualIds } },
      select: {
        id: true,
        displayName: true,
        handle: true,
        photoUrl: true,
        isVet: true,
        verifiedStatus: true,
        location: true,
      },
    });

    return {
      count: mutuals.length,
      mutuals,
    };
  }

  /**
   * 2nd-degree network discovery algorithm ("People You May Know in the Rescue Network")
   * Traverses 2 hops from the user, calculates mutual bridges, and ranks by graph centrality.
   */
  async getNetworkSuggestions(userId: string, limit: number = 8) {
    if (!userId) return [];

    // Step 1: Direct 1st-degree connections and pending connections
    const directConns = await this.prisma.connection.findMany({
      where: {
        OR: [{ requesterId: userId }, { recipientId: userId }],
      },
    });

    const directFriendIds = new Set<string>();
    const excludedIds = new Set<string>([userId]);

    for (const c of directConns) {
      const friendId = c.requesterId === userId ? c.recipientId : c.requesterId;
      excludedIds.add(friendId);
      if (c.status === 'accepted') {
        directFriendIds.add(friendId);
      }
    }

    // Step 2: 2nd-degree traversal across friends' connections
    const candidateMutualMap = new Map<string, string[]>(); // CandidateId -> Array of mutual friend IDs

    if (directFriendIds.size > 0) {
      const friendsOfFriends = await this.prisma.connection.findMany({
        where: {
          status: 'accepted',
          OR: [
            { requesterId: { in: Array.from(directFriendIds) } },
            { recipientId: { in: Array.from(directFriendIds) } },
          ],
        },
      });

      for (const c of friendsOfFriends) {
        const p1 = c.requesterId;
        const p2 = c.recipientId;

        const isP1Friend = directFriendIds.has(p1);
        const isP2Friend = directFriendIds.has(p2);

        if (isP1Friend && !excludedIds.has(p2)) {
          const list = candidateMutualMap.get(p2) || [];
          if (!list.includes(p1)) list.push(p1);
          candidateMutualMap.set(p2, list);
        }

        if (isP2Friend && !excludedIds.has(p1)) {
          const list = candidateMutualMap.get(p1) || [];
          if (!list.includes(p2)) list.push(p2);
          candidateMutualMap.set(p1, list);
        }
      }
    }

    // Step 3: Sort candidate IDs by mutual connections count descending
    const sortedCandidateIds = Array.from(candidateMutualMap.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, limit)
      .map(([id]) => id);

    let candidates: any[] = [];
    if (sortedCandidateIds.length > 0) {
      const users = await this.prisma.user.findMany({
        where: { id: { in: sortedCandidateIds } },
        select: {
          id: true,
          displayName: true,
          handle: true,
          photoUrl: true,
          bio: true,
          location: true,
          isVet: true,
          verifiedStatus: true,
          topContributor: true,
        },
      });

      // Also fetch details for the mutual bridge users
      const allMutualIds = new Set<string>();
      sortedCandidateIds.forEach((cId) => {
        candidateMutualMap.get(cId)?.forEach((mId) => allMutualIds.add(mId));
      });

      const mutualBridgeUsers = await this.prisma.user.findMany({
        where: { id: { in: Array.from(allMutualIds) } },
        select: { id: true, displayName: true, photoUrl: true },
      });
      const mutualUserMap = new Map(mutualBridgeUsers.map((u) => [u.id, u]));

      candidates = sortedCandidateIds
        .map((cId) => {
          const user = users.find((u) => u.id === cId);
          if (!user) return null;
          const mutualIds = candidateMutualMap.get(cId) || [];
          const mutuals = mutualIds
            .map((mId) => mutualUserMap.get(mId))
            .filter(Boolean);

          return {
            ...user,
            degree: 2,
            mutualCount: mutualIds.length,
            mutuals,
          };
        })
        .filter(Boolean);
    }

    // Step 4: Backfill with active rescuers / verified vets if fewer than limit
    if (candidates.length < limit) {
      const needed = limit - candidates.length;
      const existingIds = new Set([
        ...Array.from(excludedIds),
        ...candidates.map((c) => c.id),
      ]);

      const backfillUsers = await this.prisma.user.findMany({
        where: {
          id: { notIn: Array.from(existingIds) },
        },
        take: needed,
        orderBy: [{ verifiedStatus: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          displayName: true,
          handle: true,
          photoUrl: true,
          bio: true,
          location: true,
          isVet: true,
          verifiedStatus: true,
          topContributor: true,
        },
      });

      candidates.push(
        ...backfillUsers.map((u) => ({
          ...u,
          degree: 3,
          mutualCount: 0,
          mutuals: [],
        })),
      );
    }

    return candidates;
  }

  /**
   * Determine degrees of separation between two graph nodes
   */
  async getGraphDegree(userId1: string, userId2: string) {
    if (userId1 === userId2) return { degree: 0, label: 'You' };

    const direct = await this.getConnectionStatus(userId1, userId2);
    if (direct.status === 'accepted') {
      return { degree: 1, label: '1st Degree Connection' };
    }

    const mutuals = await this.getMutualConnections(userId1, userId2);
    if (mutuals.count > 0) {
      return {
        degree: 2,
        label: '2nd Degree Network',
        mutualCount: mutuals.count,
        mutuals: mutuals.mutuals.slice(0, 3),
      };
    }

    return { degree: 3, label: 'Rescue Network' };
  }
}
