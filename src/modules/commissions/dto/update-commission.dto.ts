import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsArray, IsUUID } from 'class-validator';
import { CommissionStatus } from '../commission.entity';

export class UpdateCommissionDto {
  @ApiProperty({ enum: CommissionStatus, example: CommissionStatus.PAID })
  @IsEnum(CommissionStatus)
  status: CommissionStatus;

  @ApiProperty({ description: 'Méthode de paiement', required: false })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiProperty({ description: 'Note admin', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkPayDto {
  @ApiProperty({ description: 'IDs des commissions à marquer payées' })
  @IsArray()
  @IsUUID('4', { each: true })
  commissionIds: string[];

  @ApiProperty({ description: 'Méthode de paiement', required: false })
  @IsOptional()
  @IsString()
  paymentMethod?: string;
}