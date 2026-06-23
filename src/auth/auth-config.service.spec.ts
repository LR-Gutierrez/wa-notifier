import { Test, TestingModule } from '@nestjs/testing';
import { AuthConfigService } from './auth-config.service';
import { existsSync, readFileSync, unlinkSync } from 'fs';
import { join } from 'path';

describe('AuthConfigService', () => {
  let service: AuthConfigService;
  const testConfigPath = join(process.cwd(), 'auth-config.json');

  beforeAll(() => {
    if (existsSync(testConfigPath)) {
      unlinkSync(testConfigPath);
    }
  });

  afterEach(() => {
    if (existsSync(testConfigPath)) {
      unlinkSync(testConfigPath);
    }
  });

  it('should create auth-config.json with a random key if file does not exist', () => {
    service = new AuthConfigService();
    expect(existsSync(testConfigPath)).toBe(true);
    const raw = readFileSync(testConfigPath, 'utf-8');
    const config = JSON.parse(raw);
    expect(config.apiKey).toBeDefined();
    expect(config.apiKey.length).toBe(64);
  });

  it('should read existing apiKey', () => {
    service = new AuthConfigService();
    const key = service.getApiKey();
    expect(key).toBeDefined();
    expect(typeof key).toBe('string');
  });

  it('should rotate the apiKey and persist it', () => {
    service = new AuthConfigService();
    const oldKey = service.getApiKey();
    const newKey = service.rotateApiKey();
    expect(newKey).not.toBe(oldKey);
    expect(newKey.length).toBe(64);
    const raw = readFileSync(testConfigPath, 'utf-8');
    const config = JSON.parse(raw);
    expect(config.apiKey).toBe(newKey);
  });
});
