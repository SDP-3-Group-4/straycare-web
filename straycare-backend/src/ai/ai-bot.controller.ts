import { Controller, Get, Post, HttpCode } from '@nestjs/common';
import { NimService } from './nim.service';
import { AutoResponseService } from './auto-response.service';

@Controller('ai')
export class AiBotController {
  constructor(
    private readonly nimService: NimService,
    private readonly autoResponseService: AutoResponseService,
  ) {}

  @Get('bot/info')
  getBotInfo() {
    return {
      id: this.nimService.botId,
      name: this.nimService.botName,
      configured: this.nimService.isConfigured,
      model: this.nimService.isConfigured ? process.env.NIM_MODEL : null,
    };
  }

  @Post('respond-rescue')
  @HttpCode(200)
  async runRescueResponseNow() {
    await this.autoResponseService.checkAndRespondToRescuePosts();
    return { success: true };
  }
}