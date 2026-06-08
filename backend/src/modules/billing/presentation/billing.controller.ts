import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { BillingService } from '../application/billing.service';
import { CreateInvoiceDto } from '../application/dto/create-invoice.dto';
import { RecordPaymentDto } from '../application/dto/record-payment.dto';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { UserContext } from '../../../core/interfaces/request-with-user.interface';

@Controller('billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('invoices')
  async createInvoice(@CurrentUser() user: UserContext, @Body() createDto: CreateInvoiceDto) {
    return this.billingService.createInvoice(user.tenantId, createDto);
  }

  @Get('invoices')
  async findAllInvoices(@CurrentUser() user: UserContext) {
    return this.billingService.findAllInvoices(user.tenantId);
  }

  @Get('invoices/:id')
  async findInvoiceById(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return this.billingService.findInvoiceById(user.tenantId, id);
  }

  @Post('invoices/:id/payment')
  async recordPayment(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() paymentDto: RecordPaymentDto,
  ) {
    return this.billingService.recordPayment(user.tenantId, id, paymentDto.amount);
  }
}
