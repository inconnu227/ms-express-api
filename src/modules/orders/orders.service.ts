/**
 * 📦 Service Orders
 * ────────────────
 * Logique métier des commandes + Notifications Push.
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

import { Order, OrderStatus, PaymentMethod } from './order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateCourierPositionDto } from './dto/update-courier-position.dto';
import { User, UserRole } from '../users/user.entity';
import { UsersRepository } from '../users/users.repository'; // ⬅️ Ajouté
import { CommissionsService } from '../commissions/commissions.service';
import { calculatePrice } from '../../common/utils/pricing';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private expo = new Expo(); // ⬅️ Instance Expo pour les notifications

  constructor(
    @InjectRepository(Order)
    private readonly ordersRepo: Repository<Order>,
    private readonly commissionsService: CommissionsService,
    private readonly usersRepo: UsersRepository, // ⬅️ Injecté pour trouver les livreurs
  ) {}

  // ─── Helpers ────────────────────────────────
  private generateReference(): string {
    const ts = Date.now().toString(36).toUpperCase().slice(-4);
    const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `MS-${ts}${rand}`;
  }

  private getServiceMeta(type: string) {
    const map: Record<string, { title: string; emoji: string }> = {
      coursier: { title: 'Coursier', emoji: '🛵' },
      pharmacie: { title: 'Pharmacie', emoji: '💊' },
      boulangerie: { title: 'Boulangerie', emoji: '🥐' },
      supermarche: { title: 'Supermarché', emoji: '🛒' },
      taxi: { title: 'Taxi', emoji: '🚕' },
      shop: { title: 'Boutique', emoji: '🛍️' },
    };
    return map[type] || { title: type, emoji: '📦' };
  }

  // ─── Créer une commande ─────────────────────
  async create(client: User, dto: CreateOrderDto): Promise<Order> {
    const meta = this.getServiceMeta(dto.serviceType);
    const distance = dto.distance || 0;
    const price = calculatePrice(distance);

    const order = this.ordersRepo.create({
      reference: this.generateReference(),
      clientId: client.id,
      serviceType: dto.serviceType,
      serviceTitle: meta.title,
      serviceEmoji: meta.emoji,
      pickupLabel: dto.pickupLabel,
      pickupAddress: dto.pickupAddress,
      pickupLat: dto.pickupLat,
      pickupLng: dto.pickupLng,
      pickupPhone: dto.pickupPhone,
      dropoffLabel: dto.dropoffLabel,
      dropoffAddress: dto.dropoffAddress,
      dropoffLat: dto.dropoffLat,
      dropoffLng: dto.dropoffLng,
      dropoffPhone: dto.dropoffPhone,
      notes: dto.notes,
      distance,
      totalPrice: price,
      paymentMethod: dto.paymentMethod || PaymentMethod.MOBILE_MONEY,
      status: OrderStatus.SEARCHING,
    });

    const saved = await this.ordersRepo.save(order);
    this.logger.log(`📦 Commande créée : ${saved.reference}`);

    // 📲 NOTIFICATION PUSH AUX LIVREURS EN LIGNE
    try {
      const couriers = await this.usersRepo.findAll({
        where: {
          role: UserRole.COURIER,
          isOnline: true,
          isApproved: true, // Uniquement les livreurs approuvés
        },
      });

      const pushMessages: ExpoPushMessage[] = [];

      for (const courier of couriers) {
        if (
          courier.expoPushToken &&
          Expo.isExpoPushToken(courier.expoPushToken)
        ) {
          pushMessages.push({
            to: courier.expoPushToken,
            sound: 'default',
            title: '📦 Nouvelle course disponible !',
            body: `Distance: ${distance} km • Prix: ${price.toLocaleString(
              'fr-FR',
            )} FCFA`,
            data: { type: 'new_order', orderId: saved.id },
            priority: 'high',
            channelId: 'orders', // Canal Android
          });
        }
      }

      if (pushMessages.length > 0) {
        await this.expo.sendPushNotificationsAsync(pushMessages);
        this.logger.log(
          `📲 Notifications envoyées à ${pushMessages.length} livreur(s)`,
        );
      }
    } catch (error) {
      this.logger.error('❌ Erreur envoi notifications push :', error);
    }

    return saved;
  }

  // ─── Lister les commandes ───────────────────
  async findAll(user: User): Promise<Order[]> {
    const qb = this.ordersRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.client', 'client')
      .leftJoinAndSelect('order.courier', 'courier')
      .orderBy('order.createdAt', 'DESC');

    if (user.role === UserRole.ADMIN) {
      return qb.getMany();
    }

    if (user.role === UserRole.COURIER) {
      qb.where(
        'order.courierId = :userId OR (order.status = :searching AND order.courierId IS NULL)',
        { userId: user.id, searching: OrderStatus.SEARCHING },
      );
      return qb.getMany();
    }

    qb.where('order.clientId = :userId', { userId: user.id });
    return qb.getMany();
  }

  // ─── Détail ─────────────────────────────────
  async findOne(id: string, user: User): Promise<Order> {
    const order = await this.ordersRepo.findOne({
      where: { id },
      relations: ['client', 'courier'],
    });

    if (!order) {
      throw new NotFoundException('Commande introuvable');
    }

    const isOwner = order.clientId === user.id;
    const isCourier = order.courierId === user.id;
    const isAdmin = user.role === UserRole.ADMIN;
    const isAvailableForCourier =
      user.role === UserRole.COURIER &&
      order.status === OrderStatus.SEARCHING &&
      !order.courierId;

    if (!isOwner && !isCourier && !isAdmin && !isAvailableForCourier) {
      throw new ForbiddenException('Accès refusé');
    }

    return order;
  }

  // ─── Changer le statut ──────────────────────
  async updateStatus(
    id: string,
    dto: UpdateOrderStatusDto,
    user: User,
  ): Promise<Order> {
    const order = await this.findOne(id, user);

    this.validateStatusTransition(order.status, dto.status);

    const previousStatus = order.status;
    order.status = dto.status;

    if (dto.status === OrderStatus.DELIVERED) {
      order.deliveredAt = new Date();
    } else if (dto.status === OrderStatus.CANCELLED) {
      order.cancelledAt = new Date();
    }

    const saved = await this.ordersRepo.save(order);

    // Création commission
    if (
      dto.status === OrderStatus.DELIVERED &&
      previousStatus !== OrderStatus.DELIVERED
    ) {
      try {
        await this.commissionsService.createForOrder(saved);
      } catch (e) {
        this.logger.error('❌ Erreur création commission:', e);
      }
    }

    this.logger.log(`🔄 Commande ${saved.reference} → ${dto.status}`);
    return saved;
  }

  // ─── Accepter une commande ──────────────────
  async assignCourier(
    id: string,
    courierId: string,
    user: User,
  ): Promise<Order> {
    const order = await this.ordersRepo.findOne({
      where: { id },
      relations: ['client', 'courier'],
    });

    if (!order) throw new NotFoundException('Commande introuvable');

    if (order.status !== OrderStatus.SEARCHING) {
      throw new BadRequestException('Cette commande n\'est plus disponible');
    }

    if (order.courierId) {
      throw new BadRequestException(
        'Cette commande a déjà été acceptée par un autre livreur',
      );
    }

    if (user.role !== UserRole.COURIER && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Seuls les livreurs peuvent accepter des commandes',
      );
    }

    order.courierId = courierId || user.id;
    order.status = OrderStatus.ACCEPTED;
    order.acceptedAt = new Date();

    // Position initiale = position du pickup
    order.courierLat = order.pickupLat;
    order.courierLng = order.pickupLng;
    order.courierLastUpdate = new Date();

    const saved = await this.ordersRepo.save(order);
    this.logger.log(
      `✅ Commande ${saved.reference} acceptée par ${user.firstName}`,
    );

    return saved;
  }

  // ─── Annuler ────────────────────────────────
  async cancel(id: string, user: User): Promise<Order> {
    const order = await this.findOne(id, user);

    if (
      [OrderStatus.DELIVERED, OrderStatus.CANCELLED].includes(order.status)
    ) {
      throw new BadRequestException(
        'Cette commande ne peut plus être annulée',
      );
    }

    order.status = OrderStatus.CANCELLED;
    order.cancelledAt = new Date();
    return this.ordersRepo.save(order);
  }

  // ═══ POSITION LIVE DU LIVREUR ═══════════════

  async updateCourierPosition(
    id: string,
    dto: UpdateCourierPositionDto,
    user: User,
  ): Promise<Order> {
    const order = await this.findOne(id, user);

    if (order.courierId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Vous n\'êtes pas le livreur de cette commande');
    }

    order.courierLat = dto.lat;
    order.courierLng = dto.lng;
    order.courierLastUpdate = new Date();

    return this.ordersRepo.save(order);
  }

  async getCourierPosition(
    id: string,
    user: User,
  ): Promise<{
    lat: number;
    lng: number;
    updatedAt: string;
    status: OrderStatus;
  }> {
    const order = await this.findOne(id, user);

    if (!order.courierId) {
      throw new BadRequestException('Aucun livreur assigné');
    }

    if (!order.courierLat || !order.courierLng) {
      return {
        lat: order.pickupLat || 13.5116,
        lng: order.pickupLng || 2.1254,
        updatedAt: new Date().toISOString(),
        status: order.status,
      };
    }

    return {
      lat: order.courierLat,
      lng: order.courierLng,
      updatedAt: order.courierLastUpdate?.toISOString() || new Date().toISOString(),
      status: order.status,
    };
  }

  // ─── Validation transitions ─────────────────
  private validateStatusTransition(
    current: OrderStatus,
    next: OrderStatus,
  ): void {
    const allowed: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.SEARCHING]: [OrderStatus.ACCEPTED, OrderStatus.CANCELLED],
      [OrderStatus.ACCEPTED]: [OrderStatus.PICKUP, OrderStatus.CANCELLED],
      [OrderStatus.PICKUP]: [OrderStatus.TRANSIT, OrderStatus.CANCELLED],
      [OrderStatus.TRANSIT]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    if (!allowed[current].includes(next)) {
      throw new BadRequestException(
        `Transition invalide : ${current} → ${next}`,
      );
    }
  }
}