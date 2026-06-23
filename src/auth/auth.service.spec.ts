import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthConfigService } from './auth-config.service';

describe('AuthService', () => {
  let service: AuthService;
  let authConfigService: jest.Mocked<AuthConfigService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: AuthConfigService,
          useValue: {
            getApiKey: jest.fn().mockReturnValue('valid-api-key'),
            rotateApiKey: jest.fn().mockReturnValue('new-rotated-key'),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    authConfigService = module.get(AuthConfigService);
    jwtService = module.get(JwtService);
  });

  describe('generateToken', () => {
    it('should throw UnauthorizedException when apiKey is missing', async () => {
      await expect(service.generateToken('')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when apiKey is invalid', async () => {
      await expect(service.generateToken('wrong-key')).rejects.toThrow(UnauthorizedException);
    });

    it('should return an accessToken when apiKey is valid', async () => {
      const result = await service.generateToken('valid-api-key');
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 'wa-notifier',
        type: 'internal',
      });
      expect(result).toEqual({ accessToken: 'mock-jwt-token' });
    });
  });

  describe('rotateApiKey', () => {
    it('should return the new rotated apiKey', () => {
      const result = service.rotateApiKey();
      expect(authConfigService.rotateApiKey).toHaveBeenCalled();
      expect(result).toEqual({ apiKey: 'new-rotated-key' });
    });
  });
});
