import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.ensureAiUserExists();
  }

  // List all conversations for a user
  async getConversations(userId: string) {
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

    return conversations.map((cp) => {
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
      };
    });
  }

  // Create a new direct conversation or return existing
  async createConversation(userId: string, targetUserId: string) {
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
  async sendMessage(userId: string, conversationId: string, content: string, imageUrl?: string) {
    // Create message
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content,
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

    // AI Vet Mock logic
    await this.handleAIMockReply(conversationId);

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

  // Mock AI response
  private async handleAIMockReply(conversationId: string) {
    const aiUser = await this.prisma.user.findUnique({ where: { email: 'ai-vet@straycare.org' } });
    if (!aiUser) return;

    // Check if the AI is a participant
    const isAiParticipant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: aiUser.id } },
    });

    if (isAiParticipant) {
      setTimeout(async () => {
        await this.prisma.message.create({
          data: {
            conversationId,
            senderId: aiUser.id,
            content: 'Hello! I am the AI Vet Assistant. I am analyzing your request and will get back to you shortly. Feel free to attach any relevant pictures.',
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
      }, 2000);
    }
  }

  // Setup mock AI User
  async ensureAiUserExists() {
    const aiEmail = 'ai-vet@straycare.org';
    const existing = await this.prisma.user.findUnique({ where: { email: aiEmail } });
    if (!existing) {
      await this.prisma.user.create({
        data: {
          id: 'ai-vet-bot-id',
          email: aiEmail,
          displayName: 'AI Vet Assistant',
          handle: 'ai_vet',
          photoUrl: 'https://cdn-icons-png.flaticon.com/512/8649/8649603.png',
          isVet: true,
          bio: 'Automated Veterinary Assistant',
        },
      });
    }
  }
}
