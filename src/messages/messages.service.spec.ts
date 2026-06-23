import { Test, TestingModule } from '@nestjs/testing';
import { MessagesService } from './messages.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

describe('MessagesService', () => {
  let service: MessagesService;
  let whatsappService: jest.Mocked<WhatsappService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: WhatsappService,
          useValue: {
            sendMessage: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
    whatsappService = module.get(WhatsappService);
  });

  describe('send', () => {
    it('should send message without title', async () => {
      whatsappService.sendMessage.mockResolvedValue(true);

      const result = await service.send({
        phone: '584241620546',
        message: 'Test message',
      });

      expect(whatsappService.sendMessage).toHaveBeenCalledWith(
        '584241620546',
        'Test message',
      );
      expect(result).toEqual({
        success: true,
        message: 'Message sent to 584241620546',
        data: { phone: '584241620546', title: null },
      });
    });

    it('should prepend title to message when title is provided', async () => {
      whatsappService.sendMessage.mockResolvedValue(true);

      await service.send({
        phone: '584241620546',
        message: 'Test message',
        title: 'Hola Luis',
      });

      expect(whatsappService.sendMessage).toHaveBeenCalledWith(
        '584241620546',
        'Hola Luis\n\nTest message',
      );
    });

    it('should return error response when sendMessage fails', async () => {
      whatsappService.sendMessage.mockRejectedValue(new Error('Client not ready'));

      const result = await service.send({
        phone: '584241620546',
        message: 'Test message',
      });

      expect(result).toEqual({
        success: false,
        message: 'Client not ready',
        data: { phone: '584241620546', title: null },
      });
    });

    it('should include title in error response when provided', async () => {
      whatsappService.sendMessage.mockRejectedValue(new Error('Failed'));

      const result = await service.send({
        phone: '584241620546',
        message: 'Test',
        title: 'Hola',
      });

      expect(result.data).toEqual({ phone: '584241620546', title: 'Hola' });
    });
  });
});
