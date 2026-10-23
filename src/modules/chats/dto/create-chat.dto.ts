import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsOptional } from 'class-validator';

export class CreateChatDto {
  @ApiProperty({ description: 'ID du livreur' })
  @IsUUID()
  courierId: string;

  @ApiProperty({ description: 'ID de la commande', required: false })
  @IsOptional()
  @IsUUID()
  orderId?: string;
}