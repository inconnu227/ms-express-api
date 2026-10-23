import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetOnlineDto {
  @ApiProperty({
    description: 'Statut en ligne du livreur',
    example: true,
  })
  @IsBoolean({ message: 'isOnline doit être un booléen' })
  isOnline: boolean;
}