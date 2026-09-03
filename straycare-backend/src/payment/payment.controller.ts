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
   * Initiate payment for Donation or Marketplace order (Public / Authenticated).
   */
  @Public()
  @Post('initiate')
  async initiatePayment(
    @Body() body: any,
    @Req() req: Request,
  ) {
    const userId = req.user?.uid || body.userId || 'guest_supporter';
    return this.paymentService.initiatePayment({
      ...body,
      userId,
    });
  }

  private renderCallbackHtml(
    status: 'success' | 'failed' | 'cancelled',
    title: string,
    redirectUrl: string,
    body: any,
  ): string {
    const isSuccess = status === 'success';
    const icon = isSuccess ? '✓' : '✕';
    const iconBg = isSuccess ? '#ecfdf5' : '#fef2f2';
    const iconColor = isSuccess ? '#10b981' : '#ef4444';

    return `<!DOCTYPE html>
<html>
  <head>
    <title>${title} — StrayCare</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta charset="utf-8" />
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background-color: #f9fafb;">
    <div style="text-align: center; padding: 32px 24px; max-width: 380px; width: 90%; background: white; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e5e7eb;">
      <div style="width: 52px; height: 52px; border-radius: 50%; background: ${iconBg}; color: ${iconColor}; display: inline-flex; align-items: center; justify-content: center; font-size: 26px; font-weight: bold; margin-bottom: 16px;">${icon}</div>
      <h2 style="margin: 0 0 8px 0; font-size: 19px; font-weight: 800; color: #111827;">${title}</h2>
      <p style="margin: 0 0 20px 0; font-size: 13px; color: #6b7280; line-height: 1.5;">Redirecting you back to StrayCare...</p>
      <a href="${redirectUrl}" style="display: inline-block; padding: 10px 24px; background: #772bfb; color: white; border-radius: 9999px; text-decoration: none; font-size: 13px; font-weight: bold;">Return to StrayCare</a>
    </div>
    <script>
      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({
            type: 'PAYMENT_COMPLETE',
            status: '${status}',
            tranId: '${body.tran_id || ''}',
            amount: '${body.amount || ''}',
            orderId: '${body.value_c || ''}'
          }, '*');
        }
      } catch (e) {}

      setTimeout(function() {
        window.location.replace('${redirectUrl}');
      }, 600);
    </script>
  </body>
</html>`;
  }

  /**
   * Success callback from SSLCommerz redirection.
   */
  @Public()
  @Post('success')
  @HttpCode(HttpStatus.OK)
  async handleSuccess(@Body() body: any, @Res() res: Response) {
    try {
      const redirectUrl = await this.paymentService.handleSuccess(body);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(
        this.renderCallbackHtml('success', 'Payment Successful!', redirectUrl, body),
      );
    } catch (err: any) {
      const clientUrl = body?.value_d || process.env.FRONTEND_URL || 'https://straycare-dev.web.app';
      const redirectUrl = `${clientUrl}/payment/status?status=success&tran_id=${body?.tran_id || ''}`;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(
        this.renderCallbackHtml('success', 'Payment Processed', redirectUrl, body),
      );
    }
  }

  /**
   * Failure callback from SSLCommerz redirection.
   */
  @Public()
  @Post('fail')
  @HttpCode(HttpStatus.OK)
  async handleFail(@Body() body: any, @Res() res: Response) {
    try {
      const redirectUrl = await this.paymentService.handleFail(body);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(
        this.renderCallbackHtml('failed', 'Payment Failed', redirectUrl, body),
      );
    } catch (err: any) {
      const clientUrl = body?.value_d || process.env.FRONTEND_URL || 'https://straycare-dev.web.app';
      const redirectUrl = `${clientUrl}/payment/status?status=failed&tran_id=${body?.tran_id || ''}`;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(
        this.renderCallbackHtml('failed', 'Payment Failed', redirectUrl, body),
      );
    }
  }

  /**
   * Cancel callback from SSLCommerz redirection.
   */
  @Public()
  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  async handleCancel(@Body() body: any, @Res() res: Response) {
    try {
      const redirectUrl = await this.paymentService.handleCancel(body);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(
        this.renderCallbackHtml('cancelled', 'Payment Cancelled', redirectUrl, body),
      );
    } catch (err: any) {
      const clientUrl = body?.value_d || process.env.FRONTEND_URL || 'https://straycare-dev.web.app';
      const redirectUrl = `${clientUrl}/payment/status?status=cancelled&tran_id=${body?.tran_id || ''}`;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(
        this.renderCallbackHtml('cancelled', 'Payment Cancelled', redirectUrl, body),
      );
    }
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
