import { Injectable, Logger } from '@nestjs/common';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import * as crypto from 'crypto';

interface AuthConfig {
  apiKey: string;
}

@Injectable()
export class AuthConfigService {
  private readonly logger = new Logger(AuthConfigService.name);
  private readonly configPath = join(process.cwd(), 'auth-config.json');
  private config: AuthConfig;

  constructor() {
    this.load();
  }

  private load(): void {
    const envApiKey = process.env.WA_NOTIFIER_API_KEY;
    if (envApiKey) {
      this.config = { apiKey: envApiKey };
      this.logger.log('Using API key from WA_NOTIFIER_API_KEY env var');
      return;
    }

    if (!existsSync(this.configPath)) {
      const defaultKey = crypto.randomBytes(32).toString('hex');
      this.config = { apiKey: defaultKey };
      this.persist();
      this.logger.log('auth-config.json created with a random API key');
      return;
    }

    const raw = readFileSync(this.configPath, 'utf-8');
    this.config = JSON.parse(raw);
  }

  private persist(): void {
    writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
  }

  getApiKey(): string {
    return this.config.apiKey;
  }

  rotateApiKey(): string {
    const newKey = crypto.randomBytes(32).toString('hex');
    this.config.apiKey = newKey;
    this.persist();
    this.logger.warn('API key has been rotated');
    return newKey;
  }
}
