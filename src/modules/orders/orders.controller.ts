import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';

import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateCourierPositionDto } from './dto/update-courier-position.dto';
import { Order } from './order.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@ApiTags('Orders')
@ApiBearerAuth('access-token')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une commande' })
  @ApiResponse({ status: 201, type: Order })
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateOrderDto,
  ): Promise<Order> {
    return this.ordersService.create(user, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Mes commandes' })
  async findAll(@CurrentUser() user: User): Promise<Order[]> {
    return this.ordersService.findAll(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une commande' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<Order> {
    return this.ordersService.findOne(id, user);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Changer le statut' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: User,
  ): Promise<Order> {
    return this.ordersService.updateStatus(id, dto, user);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Annuler une commande' })
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<Order> {
    return this.ordersService.cancel(id, user);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Accepter une commande (livreur)' })
  async assignCourier(
    @Param('id') id: string,
    @Body('courierId') courierId: string,
    @CurrentUser() user: User,
  ): Promise<Order> {
    return this.ordersService.assignCourier(id, courierId, user);
  }

  // ─── Position live ──────────────────────────
  @Patch(':id/courier-position')
  @ApiOperation({ summary: 'Mettre à jour ma position (livreur)' })
  async updateCourierPosition(
    @Param('id') id: string,
    @Body() dto: UpdateCourierPositionDto,
    @CurrentUser() user: User,
  ): Promise<Order> {
    return this.ordersService.updateCourierPosition(id, dto, user);
  }

  @Get(':id/courier-position')
  @ApiOperation({ summary: 'Position du livreur (client)' })
  async getCourierPosition(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.ordersService.getCourierPosition(id, user);
  }
}