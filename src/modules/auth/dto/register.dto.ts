/**
 * 📝 DTO Inscription
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  IsEmail,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Awa', description: 'Prénom' })
  @IsString()
  @IsNotEmpty({ message: 'Le prénom est requis' })
  @MinLength(2, { message: 'Le prénom doit contenir au moins 2 caractères' })
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Diallo', description: 'Nom' })
  @IsString()
  @IsNotEmpty({ message: 'Le nom est requis' })
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  @MaxLength(50)
  lastName: string;

  @ApiProperty({ example: '+22790123456', description: 'Numéro de téléphone' })
  @IsString()
  @IsNotEmpty({ message: 'Le téléphone est requis' })
  @Matches(/^\+?[0-9]{8,15}$/, {
    message: 'Numéro de téléphone invalide (8 à 15 chiffres)',
  })
  phone: string;

  @ApiProperty({ example: 'password123', description: 'Mot de passe (min 6 caractères)' })
  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe est requis' })
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
  @MaxLength(100)
  password: string;

  @ApiProperty({ example: 'awa@example.com', required: false })
  @IsOptional()
  @IsEmail({}, { message: 'Email invalide' })
  email?: string;
}