/**
 * 🔐 DTO Connexion
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: '+22790123456', description: 'Numéro de téléphone' })
  @IsString()
  @IsNotEmpty({ message: 'Le téléphone est requis' })
  phone: string;

  @ApiProperty({ example: 'password123', description: 'Mot de passe' })
  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe est requis' })
  password: string;
}