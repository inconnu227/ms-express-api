import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  Max,
  Matches,
  MaxLength,
} from 'class-validator';
import { ServiceType, PaymentMethod } from '../order.entity';

export class CreateOrderDto {
  @ApiProperty({ enum: ServiceType, example: ServiceType.COURSIER })
  @IsEnum(ServiceType, { message: 'Type de service invalide' })
  serviceType: ServiceType;

  // ─── Récupération ─────────────────────────────
  @ApiProperty({
    description: 'Label court du lieu de récupération',
    example: 'Maison',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le label de récupération est requis' })
  @MaxLength(100)
  pickupLabel: string;

  @ApiProperty({
    description: 'Adresse complète de récupération',
    example: 'Avenue de la Mairie, Niamey',
  })
  @IsString()
  @IsNotEmpty({ message: 'L\'adresse de récupération est requise' })
  @MaxLength(255)
  pickupAddress: string;

  @ApiProperty({ example: 13.5116, required: false })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  pickupLat?: number;

  @ApiProperty({ example: 2.1254, required: false })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  pickupLng?: number;

  @ApiProperty({ example: '+22790123456' })
  @IsString()
  @Matches(/^\+?[0-9]{8,15}$/, {
    message: 'Téléphone de récupération invalide',
  })
  pickupPhone: string;

  // ─── Livraison ────────────────────────────────
  @ApiProperty({
    description: 'Label court du lieu de livraison',
    example: 'Bureau',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le label de livraison est requis' })
  @MaxLength(100)
  dropoffLabel: string;

  @ApiProperty({
    description: 'Adresse complète de livraison',
    example: 'Quartier Plateau, Niamey',
  })
  @IsString()
  @IsNotEmpty({ message: 'L\'adresse de livraison est requise' })
  @MaxLength(255)
  dropoffAddress: string;

  @ApiProperty({ example: 13.5151, required: false })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  dropoffLat?: number;

  @ApiProperty({ example: 2.1185, required: false })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  dropoffLng?: number;

  @ApiProperty({ example: '+22798765432' })
  @IsString()
  @Matches(/^\+?[0-9]{8,15}$/, {
    message: 'Téléphone de livraison invalide',
  })
  dropoffPhone: string;

  // ─── Détails ─────────────────────────────────
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiProperty({ example: 3.2, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  distance?: number;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.MOBILE_MONEY })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}