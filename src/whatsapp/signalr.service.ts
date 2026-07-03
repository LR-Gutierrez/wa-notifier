import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as signalR from '@microsoft/signalr';

@Injectable()
export class SignalRService implements OnModuleInit {
  private readonly logger = new Logger(SignalRService.name);
  private connection: signalR.HubConnection | null = null;
  private url: string;
  private secret: string;

  constructor(private readonly configService: ConfigService) {
    this.url = this.configService.get('BACKEND_WS_URL', 'http://localhost:5000/hubs/whatsapp');
    this.secret = this.configService.get('BACKEND_WS_SECRET', '');
  }

  async onModuleInit() {
    await this.connect();
  }

  private async connect() {
    try {
      const url = this.secret
        ? `${this.url}?secret=${encodeURIComponent(this.secret)}`
        : this.url;

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(url)
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      this.connection.onreconnecting((error) => {
        this.logger.warn(`SignalR reconnecting... ${error?.message ?? ''}`);
      });

      this.connection.onreconnected(() => {
        this.logger.log('SignalR reconnected');
      });

      this.connection.onclose((error) => {
        this.logger.warn(`SignalR connection closed: ${error?.message ?? 'unknown'}`);
        setTimeout(() => this.connect(), 5000);
      });

      await this.connection.start();
      this.logger.log(`SignalR connected to ${this.url}`);
    } catch (error) {
      this.logger.error(`Failed to connect to SignalR: ${(error as Error).message}`);
      setTimeout(() => this.connect(), 5000);
    }
  }

  async notifyStatus(status: { ready: boolean; status: string }) {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      return;
    }

    try {
      await this.connection.invoke('NotifyStatus', status);
    } catch (error) {
      this.logger.error(`Failed to notify status: ${(error as Error).message}`);
    }
  }

  async notifyQr(qr: string | null) {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      return;
    }

    try {
      await this.connection.invoke('NotifyQr', qr);
    } catch (error) {
      this.logger.error(`Failed to notify QR: ${(error as Error).message}`);
    }
  }

  async notifyDelivery(correlationId: string | undefined, success: boolean, error?: string) {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      return;
    }

    try {
      await this.connection.invoke('NotifyDelivery', correlationId, success, error || null);
    } catch (err) {
      this.logger.error(`Failed to notify delivery: ${(err as Error).message}`);
    }
  }
}
