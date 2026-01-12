import { IsString, IsNumber, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PayDunyaWebhookDto {
  @ApiProperty({
    description: 'PayDunya invoice/transaction token',
    example: 'abcd1234-efgh-5678-ijkl-9012mnop3456',
  })
  @IsString()
  @IsOptional()
  invoice_token?: string;

  @ApiProperty({
    description: 'Alternative token field',
    example: 'abcd1234-efgh-5678-ijkl-9012mnop3456',
  })
  @IsString()
  @IsOptional()
  token?: string;

  @ApiProperty({
    description: 'Transaction ID',
    example: 'TXN-1234567890-abcd',
  })
  @IsString()
  @IsOptional()
  transaction_id?: string;

  @ApiProperty({
    description: 'Payment status (completed, failed, cancelled, pending)',
    example: 'completed',
  })
  @IsString()
  status: string;

  @ApiProperty({
    description: 'Payment amount',
    example: 50.00,
  })
  @IsNumber()
  @IsOptional()
  amount?: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'XOF',
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({
    description: 'Customer email',
    example: 'customer@example.com',
  })
  @IsString()
  @IsOptional()
  customer_email?: string;

  @ApiProperty({
    description: 'Customer name',
    example: 'John Doe',
  })
  @IsString()
  @IsOptional()
  customer_name?: string;

  @ApiProperty({
    description: 'Custom data (may contain user_id)',
    example: { user_id: 'uuid-here' },
  })
  @IsObject()
  @IsOptional()
  custom_data?: any;

  @ApiProperty({
    description: 'Full response data from PayDunya',
  })
  @IsObject()
  @IsOptional()
  data?: any;
}
