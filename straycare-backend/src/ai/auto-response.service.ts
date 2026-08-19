import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NimService } from './nim.service';

@Injectable()
export class AutoResponseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AutoResponseService.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    private prisma: PrismaService,
    private nimService: NimService,
    private notificationsService: NotificationsService,
  ) {}

  async onModuleInit() {
    await this.nimService.ensureAiUserExists();

    const intervalMin = Number(process.env.AI_RESPONSE_INTERVAL_MIN ?? 10);
    this.timer = setInterval(
      () => void this.checkAndRespondToRescuePosts(),
      intervalMin * 60 * 1000,
    );
    this.timer.unref();

    this.logger.log(
      `Auto-response job scheduled every ${intervalMin}m for rescue posts.`,
    );
  }

  async onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async checkAndRespondToRescuePosts() {
    if (this.running) return;
    this.running = true;

    try {
      if (!this.nimService.isConfigured) {
        this.logger.warn(
          'Skipping rescue-post check: NIM is not configured (missing NIM_API_KEY/NIM_MODEL).',
        );
        return;
      }

      const waitMinutes = Number(process.env.AI_RESPONSE_WAIT_MIN ?? 30);
      const cutoff = new Date(Date.now() - waitMinutes * 60 * 1000);

      const candidates = await this.prisma.post.findMany({
        where: {
          category: 'rescue',
          commentsCount: 0,
          aiResponseStatus: 'pending',
          createdAt: { lt: cutoff },
        },
        orderBy: { createdAt: 'asc' },
        take: 3,
      });

      if (candidates.length === 0) return;
      this.logger.log(
        `Found ${candidates.length} unanswered rescue post(s) for AI review.`,
      );

      for (const post of candidates) {
        try {
          const advice = await this.nimService.getRescueAdvice(post.content);

          if (advice === 'NO_RESPONSE' || !advice) {
            await this.prisma.post.update({
              where: { id: post.id },
              data: { aiResponseStatus: 'skipped', aiRespondedAt: new Date() },
            });
            this.logger.log(`Post ${post.id}: AI skipped (not a rescue help request).`);
            continue;
          }

          const comment = await this.prisma.comment.create({
            data: {
              postId: post.id,
              userId: this.nimService.botId,
              content: advice + this.nimService.disclaimer,
            },
          });

          await this.prisma.post.update({
            where: { id: post.id },
            data: {
              commentsCount: { increment: 1 },
              aiResponseStatus: 'processed',
              aiRespondedAt: new Date(),
            },
          });

          if (post.authorId !== this.nimService.botId) {
            await this.notificationsService.createNotification({
              userId: post.authorId,
              senderId: this.nimService.botId,
              type: 'comment',
              content: 'shared advice on your rescue post',
              postId: post.id,
            });
          }

          this.logger.log(`Post ${post.id}: AI comment posted (comment ${comment.id}).`);
        } catch (err) {
          this.logger.error(
            `Auto-response failed for post ${post.id}: ${(err as Error).message}`,
          );
        }
      }
    } catch (err) {
      this.logger.error(
        `Auto-response scan failed: ${(err as Error).message}`,
      );
    } finally {
      this.running = false;
    }
  }
}