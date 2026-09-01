import { Controller, Get, Post, HttpCode, Query, Body } from '@nestjs/common';
import { NimService } from './nim.service';
import { AutoResponseService } from './auto-response.service';
import { Public } from '../auth/public.decorator';

@Controller('ai')
export class AiBotController {
  constructor(
    private readonly nimService: NimService,
    private readonly autoResponseService: AutoResponseService,
  ) {}

  @Public()
  @Get('bot/info')
  getBotInfo() {
    return {
      id: this.nimService.botId,
      name: this.nimService.botName,
      configured: this.nimService.isConfigured,
      model: this.nimService.isConfigured ? (process.env.NIM_MODEL ?? 'openai/gpt-oss-20b') : null,
      rescueModel: this.nimService.isConfigured ? (process.env.NIM_RESCUE_MODEL ?? 'openai/gpt-oss-20b') : null,
      waitMinutes: Number(process.env.AI_RESPONSE_WAIT_MIN ?? 30),
      intervalMinutes: Number(process.env.AI_RESPONSE_INTERVAL_MIN ?? 5),
    };
  }

  @Public()
  @Get('respond-rescue')
  @Post('respond-rescue')
  @HttpCode(200)
  async runRescueResponseNow(
    @Query('force') forceQuery?: string,
    @Query('waitMin') waitMinQuery?: string,
    @Body() body?: { force?: boolean; waitMinutes?: number; limit?: number },
  ) {
    const force = forceQuery === 'true' || forceQuery === '1' || body?.force === true;
    const waitMinutes = waitMinQuery ? Number(waitMinQuery) : body?.waitMinutes;
    const limit = body?.limit;

    return this.autoResponseService.checkAndRespondToRescuePosts({
      force,
      waitMinutes,
      limit,
    });
  }
}
