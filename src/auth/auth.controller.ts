import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('token')
  async getToken(@Body('apiKey') apiKey: string) {
    return this.authService.generateToken(apiKey);
  }

  @Post('rotate-key')
  @UseGuards(JwtAuthGuard)
  rotateKey() {
    return this.authService.rotateApiKey();
  }
}
