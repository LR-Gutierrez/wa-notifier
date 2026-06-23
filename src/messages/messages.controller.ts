import { Controller, Post, Body } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('send')
  async send(@Body() dto: SendMessageDto) {
    return this.messagesService.send(dto);
  }
}
