import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  ForbiddenException,
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
import {
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { multerConfig } from '../../config/multer.config';
import { Express } from 'express';


@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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

  @Patch('me/online')
  @ApiOperation({ summary: 'Activer/désactiver mon statut en ligne (livreur)' })
  @ApiResponse({ status: 200, type: User })
  async setOnline(
    @CurrentUser() user: User,
    @Body() dto: SetOnlineDto,
  ): Promise<User> {
    return this.usersService.setOnline(user.id, dto.isOnline);
  }

  @Patch('me/push-token')
  @ApiOperation({ summary: 'Enregistrer le token push Expo' })
  @ApiResponse({ status: 200, type: User })
  async savePushToken(
    @CurrentUser() user: User,
    @Body('token') token: string,
  ): Promise<User> {
    return this.usersService.savePushToken(user.id, token);
  }

   @Patch('me/kyc')
  @ApiOperation({ summary: 'Uploader les documents KYC (livreur)' })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'idCard', maxCount: 1 },
        { name: 'license', maxCount: 1 },
      ],
      multerConfig,
    ),
  )
  async uploadKyc(
    @CurrentUser() user: User,
    @UploadedFiles()
    files: {
      idCard?: Express.Multer.File[];
      license?: Express.Multer.File[];
    },
  ): Promise<User> {
    if (!files?.idCard?.[0] || !files?.license?.[0]) {
      throw new BadRequestException(
        'La CNI et le Permis sont obligatoires.',
      );
    }

    // Construire les URLs publiques des fichiers
    const baseUrl = process.env.BASE_URL || 'https://ms-express-api.onrender.com';
    const idCardUrl = `${baseUrl}/uploads/kyc/${files.idCard[0].filename}`;
    const licenseUrl = `${baseUrl}/uploads/kyc/${files.license[0].filename}`;

    return this.usersService.saveKyc(user.id, idCardUrl, licenseUrl);
  }


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

  @Get()
  @ApiOperation({ summary: 'Lister tous les utilisateurs (admin)' })
  async listAll(
    @CurrentUser() user: User,
    @Query('role') role?: string,
    @Query('search') search?: string,
  ): Promise<User[]> {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Accès réservé aux administrateurs');
    }
    return this.usersService.findAll({ role, search });
  }

  // ─── NOUVELLE ROUTE : Approuver un livreur ───
  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approuver un livreur (admin)' })
  @ApiResponse({ status: 200, type: User })
  async approveCourier(
    @Param('id') id: string,
    @CurrentUser() admin: User,
  ): Promise<User> {
    if (admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Accès réservé aux administrateurs');
    }
    return this.usersService.approveCourier(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un utilisateur (admin)' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<User> {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Accès réservé aux administrateurs');
    }
    return this.usersService.findById(id);
  }
}