import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';

import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { SetOnlineDto } from './dto/set-online.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from './user.entity';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ─── Mon profil ─────────────────────────────
  @Get('me')
  @ApiOperation({ summary: 'Mon profil' })
  @ApiResponse({ status: 200, type: User })
  async getMe(@CurrentUser() user: User): Promise<User> {
    return this.usersService.findById(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Modifier mon profil' })
  @ApiResponse({ status: 200, type: User })
  async updateMe(
    @CurrentUser() user: User,
    @Body() dto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.updateProfile(user.id, dto);
  }

  // ─── Statut en ligne ────────────────────────
  @Patch('me/online')
  @ApiOperation({ summary: 'Activer/désactiver mon statut en ligne (livreur)' })
  @ApiResponse({ status: 200, type: User })
  async setOnline(
    @CurrentUser() user: User,
    @Body() dto: SetOnlineDto,
  ): Promise<User> {
    return this.usersService.setOnline(user.id, dto.isOnline);
  }

  // ─── Token push ─────────────────────────────
  @Patch('me/push-token')
  @ApiOperation({ summary: 'Enregistrer le token push Expo' })
  @ApiResponse({ status: 200, type: User })
  async savePushToken(
    @CurrentUser() user: User,
    @Body('token') token: string,
  ): Promise<User> {
    return this.usersService.savePushToken(user.id, token);
  }

  // ─── Livreurs ────────────────────────────────
  @Get('couriers')
  @ApiOperation({ summary: 'Lister les livreurs (mobile client)' })
  async listCouriers(@CurrentUser() user: User): Promise<User[]> {
    return this.usersService.findCouriers(user.id);
  }

  @Get('couriers/available')
  @ApiOperation({ summary: 'Livreurs en ligne disponibles' })
  async listAvailableCouriers(): Promise<User[]> {
    return this.usersService.findAvailableCouriers();
  }

  // ─── Admin ──────────────────────────────────
  @Get()
  @ApiOperation({ summary: 'Lister tous les utilisateurs (admin)' })
  async listAll(
    @CurrentUser() user: User,
    @Query('role') role?: string,
    @Query('search') search?: string,
  ): Promise<User[]> {
    if (user.role !== UserRole.ADMIN) {
      throw new Error('Accès réservé aux administrateurs');
    }
    return this.usersService.findAll({ role, search });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un utilisateur (admin)' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<User> {
    if (user.role !== UserRole.ADMIN) {
      throw new Error('Accès réservé aux administrateurs');
    }
    return this.usersService.findById(id);
  }
}