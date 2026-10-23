/**
 * 📤 DTO Réponse Auth
 */

import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/user.entity';

export class AuthResponseDto {
  @ApiProperty({ description: 'Utilisateur' })
  user: User;

  @ApiProperty({ description: 'Token d\'accès JWT' })
  accessToken: string;

  @ApiProperty({ description: 'Token de rafraîchissement JWT' })
  refreshToken: string;
}