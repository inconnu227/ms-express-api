/**
 * ⭐ Service Ratings
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Rating } from './rating.entity';
import { CreateRatingDto } from './dto/create-rating.dto';
import { Order, OrderStatus } from '../orders/order.entity';
import { User } from '../users/user.entity';

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating)
    private readonly ratingsRepo: Repository<Rating>,
    @InjectRepository(Order)
    private readonly ordersRepo: Repository<Order>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  /**
   * Créer un avis
   */
  async create(client: User, dto: CreateRatingDto): Promise<Rating> {
    // 1. Vérifier que la commande existe et appartient au client
    const order = await this.ordersRepo.findOne({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException('Commande introuvable');
    }

    if (order.clientId !== client.id) {
      throw new BadRequestException('Cette commande n\'est pas la vôtre');
    }

    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException(
        'Vous ne pouvez noter qu\'une commande livrée',
      );
    }

    if (!order.courierId) {
      throw new BadRequestException('Aucun livreur associé à cette commande');
    }

    // 2. Vérifier qu'il n'y a pas déjà un avis
    const existing = await this.ratingsRepo.findOne({
      where: { orderId: dto.orderId },
    });
    if (existing) {
      throw new ConflictException('Vous avez déjà noté cette commande');
    }

    // 3. Créer l'avis
    const rating = this.ratingsRepo.create({
      orderId: dto.orderId,
      clientId: client.id,
      courierId: order.courierId,
      stars: dto.stars,
      tags: dto.tags || [],
      comment: dto.comment,
      tip: dto.tip,
    });

    const saved = await this.ratingsRepo.save(rating);

    // 4. Recalculer la note moyenne du livreur
    await this.recalculateCourierRating(order.courierId);

    return saved;
  }

  /**
   * Mes avis (en tant que client)
   */
  async findMine(client: User): Promise<Rating[]> {
    return this.ratingsRepo.find({
      where: { clientId: client.id },
      order: { createdAt: 'DESC' },
      relations: ['courier', 'order'],
    });
  }

  /**
   * Avis reçus (en tant que livreur)
   */
  async findReceived(courier: User): Promise<Rating[]> {
    return this.ratingsRepo.find({
      where: { courierId: courier.id },
      order: { createdAt: 'DESC' },
      relations: ['client', 'order'],
    });
  }

  /**
   * Récupérer l'avis d'une commande
   */
  async findByOrder(orderId: string, user: User): Promise<Rating | null> {
    return this.ratingsRepo.findOne({
      where: { orderId },
      relations: ['client', 'courier'],
    });
  }

  /**
   * Recalculer la moyenne du livreur
   */
  private async recalculateCourierRating(courierId: string): Promise<void> {
    const result = await this.ratingsRepo
      .createQueryBuilder('rating')
      .select('AVG(rating.stars)', 'avg')
      .where('rating.courierId = :courierId', { courierId })
      .getRawOne();

    const avg = parseFloat(result?.avg) || 5.0;
    await this.usersRepo.update(courierId, {
      rating: Math.round(avg * 10) / 10,
    });
  }
}