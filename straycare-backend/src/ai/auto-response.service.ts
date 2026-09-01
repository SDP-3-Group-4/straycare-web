import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NimService } from './nim.service';

export interface AutoResponseOptions {
  force?: boolean;
  waitMinutes?: number;
  limit?: number;
}

@Injectable()
export class AutoResponseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AutoResponseService.name);
  private timer?: NodeJS.Timeout;
  private startupTimer?: NodeJS.Timeout;
  private running = false;

  constructor(
    private prisma: PrismaService,
    private nimService: NimService,
    private notificationsService: NotificationsService,
  ) {}

  async onModuleInit() {
    await this.nimService.ensureAiUserExists();

    const intervalMin = Number(process.env.AI_RESPONSE_INTERVAL_MIN ?? 5);
    
    // Initial warmup scan 15s after boot
    this.startupTimer = setTimeout(() => {
      void this.checkAndRespondToRescuePosts();
    }, 15000);
    this.startupTimer.unref();

    // Recurring polling job
    this.timer = setInterval(
      () => void this.checkAndRespondToRescuePosts(),
      intervalMin * 60 * 1000,
    );
    this.timer.unref();

    this.logger.log(
      `Auto-response job scheduled every ${intervalMin}m for unanswered rescue posts.`,
    );
  }

  async onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    if (this.startupTimer) clearTimeout(this.startupTimer);
  }

  async checkAndRespondToRescuePosts(options?: AutoResponseOptions) {
    if (this.running) {
      this.logger.log('Rescue post scan is already running. Skipping concurrent trigger.');
      return { success: false, message: 'Scan already in progress', processed: 0 };
    }
    this.running = true;

    const results: Array<{ postId: string; status: string; reason?: string }> = [];

    try {
      if (!this.nimService.isConfigured) {
        this.logger.warn(
          'Skipping rescue-post check: NIM is not configured (missing NIM_API_KEY/NIM_MODEL).',
        );
        return { success: false, message: 'NIM not configured', processed: 0 };
      }

      const waitMinutes = options?.force
        ? 0
        : Number(options?.waitMinutes ?? process.env.AI_RESPONSE_WAIT_MIN ?? 30);
      const cutoff = new Date(Date.now() - waitMinutes * 60 * 1000);
      const batchLimit = Math.min(options?.limit ?? 5, 10);

      // Find unanswered rescue posts created before the cutoff
      const candidates = await this.prisma.post.findMany({
        where: {
          category: { in: ['rescue', 'RESCUE', 'Rescue'] },
          commentsCount: 0,
          aiResponseStatus: options?.force ? { in: ['pending', 'skipped'] } : 'pending',
          authorId: { not: this.nimService.botId },
          createdAt: { lte: cutoff },
        },
        orderBy: { createdAt: 'asc' },
        take: batchLimit,
      });

      if (candidates.length === 0) {
        return { success: true, message: 'No eligible rescue posts found', processed: 0, results };
      }

      this.logger.log(
        `Found ${candidates.length} unanswered rescue post(s) for AI triage review (cutoff: ${waitMinutes}m).`,
      );

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      for (const post of candidates) {
        try {
          // 1. Anti-spam check: minimum content length
          if (!post.content || post.content.trim().length < 8) {
            await this.prisma.post.update({
              where: { id: post.id },
              data: { aiResponseStatus: 'skipped', aiRespondedAt: new Date() },
            });
            this.logger.log(`Post ${post.id}: AI skipped (content too short / spam).`);
            results.push({ postId: post.id, status: 'skipped', reason: 'Content too short' });
            continue;
          }

          // 2. Anti-spam rate-limit per author: Max 2 auto-responses per author per hour
          const recentAuthorAutoResponses = await this.prisma.post.count({
            where: {
              authorId: post.authorId,
              aiResponseStatus: 'processed',
              aiRespondedAt: { gte: oneHourAgo },
            },
          });

          if (recentAuthorAutoResponses >= 2 && !options?.force) {
            this.logger.warn(
              `Post ${post.id}: Skipping auto-response (author ${post.authorId} hit hourly rate limit of 2 auto-responses).`,
            );
            await this.prisma.post.update({
              where: { id: post.id },
              data: { aiResponseStatus: 'skipped', aiRespondedAt: new Date() },
            });
            results.push({ postId: post.id, status: 'skipped', reason: 'Author hourly rate limit reached' });
            continue;
          }

          // 3. Mark as processing to prevent race conditions
          await this.prisma.post.update({
            where: { id: post.id },
            data: { aiResponseStatus: 'processing' },
          });

          // 4. Generate emergency first-aid triage advice from AI
          const advice = await this.nimService.getRescueAdvice(post.content);

          if (advice === 'NO_RESPONSE' || !advice) {
            await this.prisma.post.update({
              where: { id: post.id },
              data: { aiResponseStatus: 'skipped', aiRespondedAt: new Date() },
            });
            this.logger.log(`Post ${post.id}: AI skipped (not a rescue medical request).`);
            results.push({ postId: post.id, status: 'skipped', reason: 'AI classified as NO_RESPONSE' });
            continue;
          }

          // 5. Post the AI Vet comment
          const commentContent = `${advice}${this.nimService.disclaimer}`;
          const comment = await this.prisma.comment.create({
            data: {
              postId: post.id,
              userId: this.nimService.botId,
              content: commentContent,
            },
          });

          // 6. Update post state
          await this.prisma.post.update({
            where: { id: post.id },
            data: {
              commentsCount: { increment: 1 },
              aiResponseStatus: 'processed',
              aiRespondedAt: new Date(),
            },
          });

          // 7. Send notification to the author
          if (post.authorId !== this.nimService.botId) {
            await this.notificationsService.createNotification({
              userId: post.authorId,
              senderId: this.nimService.botId,
              type: 'comment',
              content: 'shared emergency advice on your rescue post',
              postId: post.id,
            });
          }

          this.logger.log(
            `Post ${post.id}: AI emergency triage comment posted (comment ${comment.id}).`,
          );
          results.push({ postId: post.id, status: 'processed' });
        } catch (err) {
          this.logger.error(
            `Auto-response failed for post ${post.id}: ${(err as Error).message}`,
          );
          await this.prisma.post.update({
            where: { id: post.id },
            data: { aiResponseStatus: 'pending' },
          }).catch(() => {});
          results.push({ postId: post.id, status: 'failed', reason: (err as Error).message });
        }
      }

      return {
        success: true,
        processed: results.filter((r) => r.status === 'processed').length,
        results,
      };
    } catch (err) {
      this.logger.error(`Auto-response scan failed: ${(err as Error).message}`);
      return { success: false, message: (err as Error).message, processed: 0, results };
    } finally {
      this.running = false;
    }
  }
}
