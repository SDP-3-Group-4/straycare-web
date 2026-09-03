import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

export interface InitiatePaymentDto {
  userId: string;
  amount: number;
  paymentType: 'DONATION' | 'ORDER';
  postId?: string;
  orderId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  frontendUrl?: string;
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  private readonly storeId = process.env.SSLCOMMERZ_STORE_ID || 'testbox';
  private readonly storePassword =
    process.env.SSLCOMMERZ_STORE_PASSWORD || 'qwerty';
  private readonly isSandbox = process.env.SSLCOMMERZ_IS_SANDBOX !== 'false';
  private readonly backendUrl =
    process.env.BACKEND_URL || 'https://straycare-backend-se6q.onrender.com';
  private readonly frontendUrl =
    process.env.FRONTEND_URL || 'https://straycare-dev.web.app';

  private readonly sslSessionUrl = this.isSandbox
    ? 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php'
    : 'https://securepay.sslcommerz.com/gwprocess/v4/api.php';

  private readonly sslValidationUrl = this.isSandbox
    ? 'https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php'
    : 'https://securepay.sslcommerz.com/validator/api/validationserverAPI.php';

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Initiate SSLCommerz payment session for Donations or Orders.
   */
  async initiatePayment(dto: InitiatePaymentDto): Promise<{ gatewayUrl: string; tranId: string }> {
    const { userId, amount, paymentType, postId, orderId } = dto;

    if (!amount || amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    // Verify related entities
    let productTitle = 'StrayCare Contribution';
    if (paymentType === 'DONATION' && postId) {
      const post = await this.prisma.post.findUnique({ where: { id: postId } });
      if (!post) throw new NotFoundException('Fundraiser post not found');
      productTitle = `Fundraiser: ${post.content.substring(0, 30)}...`;
    } else if (paymentType === 'ORDER' && orderId) {
      const order = await this.prisma.order.findUnique({ where: { id: orderId } });
      if (!order) throw new NotFoundException('Marketplace order not found');
      productTitle = `Order #${orderId.substring(0, 8)}`;
    }

    const user = (userId ? await this.prisma.user.findUnique({ where: { id: userId } }) : null)
      || (await this.prisma.user.findFirst());

    // Generate unique transaction ID
    const tranId = `SC_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Record initial pending payment in database safely
    try {
      if (user) {
        await this.prisma.payment.create({
          data: {
            tranId,
            amount,
            currency: 'BDT',
            status: 'PENDING',
            paymentType,
            postId,
            orderId,
            userId: user.id,
          },
        });
      }
    } catch (dbErr: any) {
      this.logger.warn(`Could not save payment record to DB: ${dbErr.message}`);
    }

    const cusName = dto.customerName || user?.displayName || 'StrayCare Supporter';
    const cusEmail = dto.customerEmail || user?.email || 'donor@straycare.org';
    const cusPhone = dto.customerPhone || user?.phone || '01700000000';
    const cusAdd = dto.customerAddress || 'Dhaka, Bangladesh';

    // Prepare parameters for SSLCommerz
    const params = new URLSearchParams({
      store_id: this.storeId,
      store_passwd: this.storePassword,
      total_amount: amount.toFixed(2),
      currency: 'BDT',
      tran_id: tranId,
      success_url: `${this.backendUrl}/payment/success`,
      fail_url: `${this.backendUrl}/payment/fail`,
      cancel_url: `${this.backendUrl}/payment/cancel`,
      ipn_url: `${this.backendUrl}/payment/ipn`,
      shipping_method: 'NO',
      product_name: productTitle,
      product_category: paymentType,
      product_profile: 'general',
      cus_name: cusName,
      cus_email: cusEmail,
      cus_add1: cusAdd,
      cus_city: 'Dhaka',
      cus_state: 'Dhaka',
      cus_postcode: '1216',
      cus_country: 'Bangladesh',
      cus_phone: cusPhone,
      value_a: userId,
      value_b: paymentType,
      value_c: postId || orderId || '',
      value_d: dto.frontendUrl || this.frontendUrl,
    });

    this.logger.log(`Initiating SSLCommerz payment for ${tranId} (${amount} BDT)`);

    try {
      const response = await fetch(this.sslSessionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const data: any = await response.json();

      if (data?.status === 'SUCCESS' && data?.GatewayPageURL) {
        this.logger.log(`GatewayPageURL received for ${tranId}`);
        return {
          gatewayUrl: data.GatewayPageURL,
          tranId,
        };
      }

      this.logger.error(`SSLCommerz initialization failed for ${tranId}: ${JSON.stringify(data)}`);
      throw new BadRequestException(data?.failedreason || 'SSLCommerz payment initiation failed');
    } catch (error: any) {
      this.logger.error(`Error during SSLCommerz initiate: ${error.message}`);
      throw new BadRequestException(error.message || 'Payment service error');
    }
  }

  /**
   * Handle payment success callback from SSLCommerz.
   */
  async handleSuccess(body: any): Promise<string> {
    const { tran_id, val_id, amount, card_type, bank_tran_id, card_issuer } = body;
    this.logger.log(`Payment success callback received for tran_id: ${tran_id}`);

    const clientUrl = body.value_d || this.frontendUrl;
    const orderId = body.value_c || '';
    const postId = body.value_c || '';
    const paidAmount = parseFloat(amount || '0');

    let payment: any = null;
    if (tran_id) {
      try {
        payment = await this.prisma.payment.findUnique({ where: { tranId: tran_id } });
      } catch (dbErr: any) {
        this.logger.warn(`Could not lookup payment in DB: ${dbErr.message}`);
      }
    }

    // Try SSLCommerz validation API if val_id is present
    let isValid = true;
    if (val_id) {
      try {
        const validateUrl = `${this.sslValidationUrl}?val_id=${val_id}&store_id=${this.storeId}&store_passwd=${this.storePassword}&v=1&format=json`;
        const valRes = await fetch(validateUrl);
        const valData: any = await valRes.json();
        this.logger.log(`SSLCommerz validation response for ${tran_id}: status=${valData?.status}`);
        isValid =
          valData?.status === 'VALID' ||
          valData?.status === 'VALIDATED' ||
          Boolean(this.isSandbox);
      } catch (valErr: any) {
        this.logger.warn(`SSLCommerz validation API error: ${valErr.message}`);
        isValid = Boolean(this.isSandbox);
      }
    }

    if (isValid) {
      // Update Payment record if found
      if (payment) {
        try {
          await this.prisma.payment.update({
            where: { tranId: tran_id },
            data: {
              status: 'VALID',
              valId: val_id,
              cardType: card_type || 'ONLINE',
              bankTranId: bank_tran_id || tran_id,
              cardIssuer: card_issuer || 'SSLCommerz',
            },
          });
        } catch (updateErr: any) {
          this.logger.warn(`Could not update payment status: ${updateErr.message}`);
        }
      }

      // Check if this is an Order
      const actualOrderId = payment?.orderId || (body.value_b === 'ORDER' ? orderId : orderId);
      if (actualOrderId) {
        try {
          await this.prisma.order.update({
            where: { id: actualOrderId },
            data: { status: 'completed' },
          });
          this.logger.log(`Marked order ${actualOrderId} as completed.`);
        } catch (orderErr: any) {
          this.logger.warn(`Could not update order ${actualOrderId}: ${orderErr.message}`);
        }
        return `${clientUrl}/payment/status?status=success&tran_id=${tran_id || 'success'}&amount=${paidAmount}&type=order&orderId=${actualOrderId}`;
      }

      // Check if this is a Fundraiser Donation
      const actualPostId = payment?.postId || (body.value_b === 'DONATION' ? postId : postId);
      if (actualPostId) {
        try {
          const post = await this.prisma.post.findUnique({
            where: { id: actualPostId },
            include: { author: true },
          });
          if (post) {
            await this.prisma.post.update({
              where: { id: post.id },
              data: {
                raisedAmount: { increment: paidAmount },
                donorsCount: { increment: 1 },
              },
            });
            this.logger.log(`Incremented raisedAmount on post ${post.id} by ৳${paidAmount}`);
          }
        } catch (postErr: any) {
          this.logger.warn(`Could not update donation post ${actualPostId}: ${postErr.message}`);
        }
        return `${clientUrl}/payment/status?status=success&tran_id=${tran_id || 'success'}&amount=${paidAmount}&type=donation&postId=${actualPostId}`;
      }

      return `${clientUrl}/payment/status?status=success&tran_id=${tran_id || 'success'}&amount=${paidAmount}`;
    } else {
      return `${clientUrl}/payment/status?status=failed&tran_id=${tran_id || 'failed'}`;
    }
  }

  /**
   * Handle payment failure callback.
   */
  async handleFail(body: any): Promise<string> {
    const { tran_id } = body;
    this.logger.warn(`Payment failed callback for: ${tran_id}`);

    if (tran_id) {
      await this.prisma.payment.updateMany({
        where: { tranId: tran_id },
        data: { status: 'FAILED' },
      });
    }

    const clientUrl = body.value_d || this.frontendUrl;
    return `${clientUrl}/payment/status?status=failed&tran_id=${tran_id || ''}`;
  }

  /**
   * Handle payment cancellation callback.
   */
  async handleCancel(body: any): Promise<string> {
    const { tran_id } = body;
    this.logger.log(`Payment cancelled callback for: ${tran_id}`);

    if (tran_id) {
      await this.prisma.payment.updateMany({
        where: { tranId: tran_id },
        data: { status: 'CANCELLED' },
      });
    }

    const clientUrl = body.value_d || this.frontendUrl;
    return `${clientUrl}/payment/status?status=cancelled&tran_id=${tran_id || ''}`;
  }

  /**
   * Handle Instant Payment Notification (IPN).
   */
  async handleIpn(body: any): Promise<{ message: string }> {
    const { tran_id, val_id, status } = body;
    this.logger.log(`IPN received: tran_id=${tran_id}, status=${status}`);

    if (!tran_id || !val_id) {
      return { message: 'Invalid IPN payload' };
    }

    if (status === 'VALID' || status === 'VALIDATED') {
      await this.prisma.payment.updateMany({
        where: { tranId: tran_id, status: 'PENDING' },
        data: { status: 'VALID', valId: val_id },
      });
    }

    return { message: 'IPN processed' };
  }
}
