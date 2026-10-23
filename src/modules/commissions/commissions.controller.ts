import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { CommissionsService } from './commissions.service';
import {
  UpdateCommissionDto,
  BulkPayDto,
} from './dto/update-commission.dto';
import { Commission, CommissionStatus } from './commission.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/user.entity';
import { ForbiddenException } from '@nestjs/common';

@ApiTags('Commissions')
@ApiBearerAuth('access-token')
@Controller('commissions')
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  // ─── ADMIN : vue globale ─────────────────────
  @Get('summary')
  @ApiOperation({ summary: 'Résumé de tous les livreurs (admin)' })
  async getSummary(@CurrentUser() user: User) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Réservé aux administrateurs');
    }
    return this.commissionsService.getAllCouriersSummary();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Stats globales (admin)' })
  async getStats(@CurrentUser() user: User) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Réservé aux administrateurs');
    }
    return this.commissionsService.getGlobalStats();
  }

  // ─── LIVREUR : mes commissions ───────────────
  @Get('mine')
  @ApiOperation({ summary: 'Mes commissions (livreur)' })
  async getMine(@CurrentUser() user: User) {
    return this.commissionsService.getMyCommissions(user.id);
  }

  // ─── ADMIN : détail d'un livreur ─────────────
  @Get('courier/:courierId')
  @ApiOperation({ summary: 'Détail commissions d\'un livreur (admin)' })
  async getCourierDetails(
    @Param('courierId') courierId: string,
    @CurrentUser() user: User,
    @Query('status') status?: CommissionStatus,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Réservé aux administrateurs');
    }
    return this.commissionsService.getCourierDetails(courierId, {
      status,
      from,
      to,
    });
  }

  // ─── ADMIN : marquer payée ───────────────────
  @Patch(':id/status')
  @ApiOperation({ summary: 'Mettre à jour le statut d\'une commission' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCommissionDto,
    @CurrentUser() user: User,
  ): Promise<Commission> {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Réservé aux administrateurs');
    }
    return this.commissionsService.updateStatus(id, dto);
  }

  // ─── ADMIN : paiement en masse ───────────────
  @Post('bulk-pay')
  @ApiOperation({ summary: 'Marquer plusieurs commissions comme payées' })
  async bulkPay(
    @Body() dto: BulkPayDto,
    @CurrentUser() user: User,
  ) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Réservé aux administrateurs');
    }
    return this.commissionsService.bulkPay(
      dto.commissionIds,
      dto.paymentMethod,
    );
  }

  // ─── ADMIN : payer tout pour un livreur ──────
  @Post('pay-all/:courierId')
  @ApiOperation({ summary: 'Payer toutes les commissions pending d\'un livreur' })
  async payAll(
    @Param('courierId') courierId: string,
    @Body('paymentMethod') paymentMethod: string,
    @CurrentUser() user: User,
  ) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Réservé aux administrateurs');
    }
    return this.commissionsService.payAllForCourier(courierId, paymentMethod);
  }
}