import { Controller, Get, Post, UseGuards, Logger } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { WhatsappService } from './whatsapp.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('whatsapp')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(private readonly whatsappService: WhatsappService) {}

  @Get('qr')
  async getQr(): Promise<{ qr: string | null }> {
    const qrString = this.whatsappService.getQr();
    if (!qrString) {
      return { qr: null };
    }

    try {
      const qrDataUrl = await QRCode.toDataURL(qrString);
      return { qr: qrDataUrl };
    } catch (error) {
      this.logger.error('Error generating QR image', error);
      return { qr: null };
    }
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  getStatus(): { ready: boolean; status: string } {
    return this.whatsappService.getStatus();
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(): Promise<{ success: boolean }> {
    await this.whatsappService.logout();
    return { success: true };
  }

  @Post('restart')
  @UseGuards(JwtAuthGuard)
  async restart(): Promise<{ success: boolean }> {
    this.whatsappService.restart().catch((err) => {
      this.logger.error('Error restarting WhatsApp client', err);
    });
    return { success: true };
  }
}
