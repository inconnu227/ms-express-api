import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { OrderStatus } from '../order.entity';

export class UpdateOrderStatusDto {
  @ApiProperty({
    enum: OrderStatus,
    example: OrderStatus.ACCEPTED,
    description: 'Nouveau statut de la commande',
  })
  @IsEnum(OrderStatus, { message: 'Statut invalide' })
  status: OrderStatus;
}