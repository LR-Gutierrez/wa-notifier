import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { SignalRService } from './signalr.service';

@Module({
  controllers: [WhatsappController],
  providers: [WhatsappService, SignalRService],
  exports: [WhatsappService],
})
export class WhatsappModule {}
