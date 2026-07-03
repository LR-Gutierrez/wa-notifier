import { Injectable, Logger } from '@nestjs/common';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(private readonly whatsappService: WhatsappService) {}

  async send(dto: SendMessageDto) {
    const { phone, message, title, correlationId } = dto;

    let formattedMessage = message;
    if (title) {
      formattedMessage = `${title}\n\n${message}`;
    }

    try {
      await this.whatsappService.sendMessage(phone, formattedMessage, correlationId);

      return {
        success: true,
        message: `Message sent to ${phone}`,
        data: {
          phone,
          title: title || null,
          correlationId: correlationId || null,
        },
      };
    } catch (error) {
      this.logger.error(`Error sending message to ${phone}`, error);

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send message',
        data: {
          phone,
          title: title || null,
          correlationId: correlationId || null,
        },
      };
    }
  }
}
