import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NimService } from '../ai/nim.service';

@Injectable()
export class ChatService implements OnModuleInit {
  private readonly logger = new Logger(ChatService.name);

  private readonly rateLimitMax = Number(process.env.AI_RATE_LIMIT_MAX ?? 10);
  private readonly rateLimitWindowMs =
    Number(process.env.AI_RATE_LIMIT_WINDOW_MIN ?? 2) * 60 * 1000;
  private readonly userMessageTimestamps = new Map<string, number[]>();

  constructor(
    private prisma: PrismaService,
    private readonly nimService: NimService,
  ) {}

  async onModuleInit() {
    await this.ensureAiUserExists();
  }

  // List all conversations for a user (only connected users and AI bot)
  async getConversations(userId: string) {
    const acceptedConnections = await this.prisma.connection.findMany({
      where: {
        status: 'accepted',
        OR: [{ requesterId: userId }, { recipientId: userId }],
      },
    });
    const connectedUserIds = new Set<string>();
    acceptedConnections.forEach((c) => {
      connectedUserIds.add(c.requesterId === userId ? c.recipientId : c.requesterId);
    });

    const conversations = await this.prisma.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            participants: {
              where: { userId: { not: userId } },
              include: { user: true },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: {
        conversation: {
          updatedAt: 'desc',
        },
      },
    });

    const validConversations = conversations.filter((cp) => {
      if (cp.conversation.isGroup) return true;
      const otherParticipant = cp.conversation.participants[0]?.user;
      if (!otherParticipant) return false;
      if (otherParticipant.id === 'ai-vet-bot-id') return true;
      return connectedUserIds.has(otherParticipant.id);
    });

    return validConversations.map((cp) => {
      const conv = cp.conversation;
      const otherParticipant = conv.participants[0]?.user;
      const latestMessage = conv.messages[0];

      return {
        id: conv.id,
        name: conv.isGroup ? conv.name : otherParticipant?.displayName,
        avatar: conv.isGroup ? null : otherParticipant?.photoUrl,
        unread: cp.unreadCount,
        isGroup: conv.isGroup,
        latestMessage: latestMessage?.content,
        latestMessageTime: latestMessage?.createdAt,
        otherUserId: otherParticipant?.id,
        otherLastSeenAt: otherParticipant?.lastSeenAt,
      };
    });
  }

  // Create a new direct conversation or return existing (only between connected users or AI bot)
  async createConversation(userId: string, targetUserId: string) {
    if (targetUserId !== 'ai-vet-bot-id') {
      const isConnected = await this.prisma.connection.findFirst({
        where: {
          status: 'accepted',
          OR: [
            { requesterId: userId, recipientId: targetUserId },
            { requesterId: targetUserId, recipientId: userId },
          ],
        },
      });

      if (!isConnected) {
        throw new HttpException(
          'Chats are only available between connected users. Please connect with this user first.',
          HttpStatus.FORBIDDEN,
        );
      }
    }

    // Check if direct conversation already exists
    const existing = await this.prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: targetUserId } } },
        ],
      },
    });

    if (existing) {
      return existing;
    }

    // Create new conversation
    return this.prisma.conversation.create({
      data: {
        isGroup: false,
        participants: {
          create: [{ userId }, { userId: targetUserId }],
        },
      },
    });
  }

  // Fetch messages for a conversation
  async getMessages(userId: string, conversationId: string) {
    // Ensure user is part of the conversation
    const isParticipant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
    });

    if (!isParticipant) throw new NotFoundException('Conversation not found');

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: { displayName: true, photoUrl: true },
        },
      },
    });

    // Mark as read
    await this.markAsRead(userId, conversationId);

    return messages;
  }

  // Send a message
  async sendMessage(
    userId: string,
    conversationId: string,
    content: string,
    imageUrl?: string,
  ) {
    // Enforce per-user message rate limit (cost-abuse guardrail)
    this.assertWithinRateLimit(userId);

    const normalizedContent = content.normalize('NFC');
    // Create message
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: normalizedContent,
        imageUrl,
      },
      include: {
        sender: {
          select: { displayName: true, photoUrl: true },
        },
      },
    });

    // Update conversation updatedAt
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Increment unread count for other participants
    await this.prisma.conversationParticipant.updateMany({
      where: {
        conversationId,
        userId: { not: userId },
      },
      data: {
        unreadCount: { increment: 1 },
      },
    });

    // AI Vet reply (real NIM backend)
    await this.handleAiReply(conversationId, content);

    return message;
  }

  async markAsRead(userId: string, conversationId: string) {
    return this.prisma.conversationParticipant.update({
      where: {
        conversationId_userId: { conversationId, userId },
      },
      data: {
        unreadCount: 0,
        lastReadAt: new Date(),
      },
    });
  }

  async deleteConversation(userId: string, conversationId: string) {
    const isParticipant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!isParticipant) throw new NotFoundException('Conversation not found');
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    if (conv.isGroup) {
      await this.prisma.conversationParticipant.delete({
        where: { conversationId_userId: { conversationId, userId } },
      });
      const remaining = await this.prisma.conversationParticipant.count({ where: { conversationId } });
      if (remaining === 0) await this.prisma.conversation.delete({ where: { id: conversationId } });
    } else {
      await this.prisma.conversation.delete({ where: { id: conversationId } });
    }
    return { success: true };
  }

  async clearConversation(userId: string, conversationId: string) {
    const isParticipant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!isParticipant) throw new NotFoundException('Conversation not found');
    await this.prisma.message.deleteMany({ where: { conversationId } });
    await this.prisma.conversationParticipant.updateMany({
      where: { conversationId },
      data: { unreadCount: 0 },
    });
    await this.prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
    return { success: true };
  }

  async blockUser(userId: string, conversationId: string) {
    const isParticipant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!isParticipant) throw new NotFoundException('Conversation not found');
    await this.deleteConversation(userId, conversationId);
    return { success: true, blocked: true };
  }

  // Sliding-window rate limit: max N user messages per user per window
  private assertWithinRateLimit(userId: string) {
    const now = Date.now();
    const timestamps = (this.userMessageTimestamps.get(userId) ?? []).filter(
      (t) => now - t < this.rateLimitWindowMs,
    );

    if (timestamps.length >= this.rateLimitMax) {
      this.logger.warn(
        `Rate limit hit for user ${userId}: ${this.rateLimitMax} messages within ${this.rateLimitWindowMs / 60000} min`,
      );
      throw new HttpException(
        `Rate limit exceeded: maximum ${this.rateLimitMax} messages within ${this.rateLimitWindowMs / 60000} minute(s). Please wait a moment before sending more.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    timestamps.push(now);
    this.userMessageTimestamps.set(userId, timestamps);

    // Lazy cleanup so the map never grows unbounded
    if (this.userMessageTimestamps.size > 5000) {
      for (const [id, times] of this.userMessageTimestamps) {
        if (times.length === 0) this.userMessageTimestamps.delete(id);
      }
    }
  }

  // Generate AI Vet reply via NVIDIA NIM when the AI user is a participant
  private async handleAiReply(conversationId: string, userContent: string) {
    const aiUser = await this.prisma.user.findUnique({
      where: { id: this.nimService.botId },
    });
    if (!aiUser) return;

    // Check if the AI is a participant
    const isAiParticipant =
      await this.prisma.conversationParticipant.findUnique({
        where: { conversationId_userId: { conversationId, userId: aiUser.id } },
      });

    if (!isAiParticipant) return;
    if (!this.nimService.isConfigured) {
      this.logger.warn('NIM not configured; skipping AI vet reply.');
      return;
    }

    setTimeout(async () => {
      try {
        // Build recent history so the bot keeps conversational context
        const historyMessages = await this.prisma.message.findMany({
          where: { conversationId },
          orderBy: { createdAt: 'desc' },
          take: 10,
        });

        const history = historyMessages
          .slice()
          .reverse()
          .slice(-6)
          .map((m) => ({
            role:
              m.senderId === aiUser.id
                ? ('assistant' as const)
                : ('user' as const),
            content: m.content,
          }));

        const reply = await this.nimService.chatWithHistory(
          userContent,
          history.filter((h) => h.content !== userContent),
        );
        const aiMessage = await this.prisma.message.create({
          data: {
            conversationId,
            senderId: aiUser.id,
            content: reply,
          },
        });

        await this.prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });

        await this.prisma.conversationParticipant.updateMany({
          where: {
            conversationId,
            userId: { not: aiUser.id },
          },
          data: {
            unreadCount: { increment: 1 },
          },
        });

        this.logger.log(
          `AI reply sent to conversation ${conversationId}: ${aiMessage.id}`,
        );
      } catch (err) {
        this.logger.error(
          `AI reply failed for conversation ${conversationId}: ${(err as Error).message}`,
        );
      }
    }, 1500);
  }

  // Setup AI Bot user (delegated to NimService for a single source of truth)
  async ensureAiUserExists() {
    return this.nimService.ensureAiUserExists();
  }
}
