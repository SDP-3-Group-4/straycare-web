import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { PaymentService, InitiatePaymentDto } from './payment.service';
import { Public } from '../auth/public.decorator';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Initiate payment for Donation or Marketplace order (Authenticated).
   */
  @Post('initiate')
  async initiatePayment(
    @Body() body: Omit<InitiatePaymentDto, 'userId'>,
    @Req() req: Request,
  ) {
    const userId = req.user!.uid;
    return this.paymentService.initiatePayment({
      ...body,
      userId,
    });
  }

  /**
   * Success callback from SSLCommerz redirection.
   */
  @Public()
  @Post('success')
  @HttpCode(HttpStatus.OK)
  async handleSuccess(@Body() body: any, @Res() res: Response) {
    const redirectUrl = await this.paymentService.handleSuccess(body);
    return res.redirect(redirectUrl);
  }

  /**
   * Failure callback from SSLCommerz redirection.
   */
  @Public()
  @Post('fail')
  @HttpCode(HttpStatus.OK)
  async handleFail(@Body() body: any, @Res() res: Response) {
    const redirectUrl = await this.paymentService.handleFail(body);
    return res.redirect(redirectUrl);
  }

  /**
   * Cancel callback from SSLCommerz redirection.
   */
  @Public()
  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  async handleCancel(@Body() body: any, @Res() res: Response) {
    const redirectUrl = await this.paymentService.handleCancel(body);
    return res.redirect(redirectUrl);
  }

  /**
   * Instant Payment Notification (IPN) server-to-server webhook.
   */
  @Public()
  @Post('ipn')
  @HttpCode(HttpStatus.OK)
  async handleIpn(@Body() body: any) {
    return this.paymentService.handleIpn(body);
  }
}
