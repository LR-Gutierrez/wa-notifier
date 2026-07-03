import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10,15}$/, {
    message: 'phone must be a valid phone number (10-15 digits, no + or special chars)',
  })
  phone: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  correlationId?: string;
}
