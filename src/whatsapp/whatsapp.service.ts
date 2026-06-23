import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, LocalAuth } from 'whatsapp-web.js';

@Injectable()
export class WhatsappService implements OnModuleInit {
  private readonly logger = new Logger(WhatsappService.name);
  private client: Client;
  private isReady = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const sessionPath = this.configService.get('WA_SESSION_PATH', './wa-session');

    this.client = new Client({
      authStrategy: new LocalAuth({ dataPath: sessionPath }),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    });

    this.client.on('qr', (qr) => {
      this.isReady = false;
      this.logger.log('📱 Escanea el QR con WhatsApp:');
      const qrcode = require('qrcode-terminal');
      qrcode.generate(qr, { small: true });
    });

    this.client.on('ready', () => {
      this.isReady = true;
      this.logger.log('✅ WhatsApp client is ready!');
    });

    this.client.on('disconnected', (reason) => {
      this.isReady = false;
      this.logger.warn(`⚠️ WhatsApp disconnected: ${reason}`);
    });

    this.client.on('auth_failure', (msg) => {
      this.isReady = false;
      this.logger.error(`❌ Auth failure: ${msg}`);
    });

    try {
      await this.client.initialize();
    } catch (error) {
      this.logger.error('Failed to initialize WhatsApp client', error);
    }
  }

  getClient(): Client {
    return this.client;
  }

  getIsReady(): boolean {
    return this.isReady;
  }

  async sendMessage(phone: string, message: string): Promise<boolean> {
    if (!this.isReady) {
      throw new Error('WhatsApp client is not ready. Scan the QR code first.');
    }

    const chatId = phone.includes('@c.us') ? phone : `${phone}@c.us`;

    try {
      await this.client.sendMessage(chatId, message);
      this.logger.log(`✅ Message sent to ${phone}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Failed to send message to ${phone}`, error);
      throw error;
    }
  }
}
