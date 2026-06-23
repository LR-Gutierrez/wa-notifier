import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthConfigService } from './auth-config.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authConfigService: AuthConfigService,
  ) {}

  async generateToken(apiKey: string): Promise<{ accessToken: string }> {
    const validApiKey = this.authConfigService.getApiKey();

    if (!apiKey || !validApiKey || apiKey !== validApiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    const payload = { sub: 'wa-notifier', type: 'internal' };
    const accessToken = await this.jwtService.signAsync(payload);

    return { accessToken };
  }

  rotateApiKey(): { apiKey: string } {
    const apiKey = this.authConfigService.rotateApiKey();
    return { apiKey };
  }
}
