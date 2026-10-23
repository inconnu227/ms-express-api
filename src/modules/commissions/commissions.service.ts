/**
 * 💰 Service Commissions
 * ────────────────────
 * Gère la commission de 35% due par chaque livreur.
 */

import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';

import {
  Commission,
  CommissionStatus,
} from './commission.entity';
import { Order } from '../orders/order.entity';
import { User } from '../users/user.entity';
import { UpdateCommissionDto } from './dto/update-commission.dto';

export const COMMISSION_RATE = 0.35; // 35%

@Injectable()
export class CommissionsService {
  private readonly logger = new Logger(CommissionsService.name);

  constructor(
    @InjectRepository(Commission)
    private readonly commissionsRepo: Repository<Commission>,
    @InjectRepository(Order)
    private readonly ordersRepo: Repository<Order>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  /**
   * Créer une commission pour une commande livrée
   * (appelé automatiquement par OrdersService)
   */
  async createForOrder(order: Order): Promise<Commission | null> {
    if (!order.courierId) {
      this.logger.warn(`⚠️ Commande ${order.reference} sans livreur`);
      return null;
    }

    // Vérifier qu'il n'y a pas déjà une commission
    const existing = await this.commissionsRepo.findOne({
      where: { orderId: order.id },
    });
    if (existing) {
      this.logger.log(`↻ Commission existante pour ${order.reference}`);
      return existing;
    }

    const amount = Math.round(order.totalPrice * COMMISSION_RATE);

    const commission = this.commissionsRepo.create({
      courierId: order.courierId,
      orderId: order.id,
      orderReference: order.reference,
      orderTotal: order.totalPrice,
      rate: COMMISSION_RATE * 100,
      amount,
      status: CommissionStatus.PENDING,
      deliveredAt: order.deliveredAt || new Date(),
    });

    const saved = await this.commissionsRepo.save(commission);
    this.logger.log(
      `💰 Commission créée : ${order.reference} → ${amount} FCFA`,
    );

    return saved;
  }

  /**
   * Vue globale des commissions pour tous les livreurs
   */
  async getAllCouriersSummary(): Promise<any[]> {
    // Récupérer tous les livreurs uniques ayant au moins une commission
    const couriers = await this.commissionsRepo
      .createQueryBuilder('c')
      .select('c.courierId', 'courierId')
      .addSelect('COUNT(c.id)', 'totalCount')
      .addSelect(
        `SUM(CASE WHEN c.status = 'pending' THEN c.amount ELSE 0 END)`,
        'pendingAmount',
      )
      .addSelect(
        `SUM(CASE WHEN c.status = 'paid' THEN c.amount ELSE 0 END)`,
        'paidAmount',
      )
      .addSelect('SUM(c.amount)', 'totalAmount')
      .groupBy('c.courierId')
      .getRawMany();

    // Enrichir avec les infos utilisateur
    const results = await Promise.all(
      couriers.map(async (row) => {
        const user = await this.usersRepo.findOne({
          where: { id: row.courierId },
        });

        if (!user) return null;

        // Calculer les commissions du jour et de la semaine
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);
        weekStart.setHours(0, 0, 0, 0);

        const todaySum = await this.commissionsRepo
          .createQueryBuilder('c')
          .select('SUM(c.amount)', 'sum')
          .where('c.courierId = :id', { id: user.id })
          .andWhere('c.status = :s', { s: CommissionStatus.PENDING })
          .andWhere('c.deliveredAt >= :d', { d: todayStart })
          .getRawOne();

        const weekSum = await this.commissionsRepo
          .createQueryBuilder('c')
          .select('SUM(c.amount)', 'sum')
          .where('c.courierId = :id', { id: user.id })
          .andWhere('c.status = :s', { s: CommissionStatus.PENDING })
          .andWhere('c.deliveredAt >= :d', { d: weekStart })
          .getRawOne();

        return {
          courier: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            email: user.email,
            avatar: user.avatar,
            rating: user.rating,
          },
          totalCount: parseInt(row.totalCount, 10),
          pendingAmount: parseInt(row.pendingAmount, 10) || 0,
          paidAmount: parseInt(row.paidAmount, 10) || 0,
          totalAmount: parseInt(row.totalAmount, 10) || 0,
          todayPending: parseInt(todaySum?.sum, 10) || 0,
          weekPending: parseInt(weekSum?.sum, 10) || 0,
        };
      }),
    );

    // Trier par montant dû (pending) descendant
    return results
      .filter((r) => r !== null)
      .sort((a, b) => b!.pendingAmount - a!.pendingAmount);
  }

  /**
   * Détail d'un livreur (ses commissions)
   */
  async getCourierDetails(
    courierId: string,
    options?: {
      status?: CommissionStatus;
      from?: string;
      to?: string;
    },
  ): Promise<{
    courier: User;
    commissions: Commission[];
    summary: {
      totalCount: number;
      pendingAmount: number;
      paidAmount: number;
      totalAmount: number;
      todayPending: number;
      weekPending: number;
    };
  }> {
    const courier = await this.usersRepo.findOne({
      where: { id: courierId },
    });
    if (!courier) {
      throw new NotFoundException('Livreur introuvable');
    }

    const qb = this.commissionsRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.order', 'order')
      .where('c.courierId = :id', { id: courierId })
      .orderBy('c.deliveredAt', 'DESC');

    if (options?.status) {
      qb.andWhere('c.status = :status', { status: options.status });
    }

    if (options?.from) {
      qb.andWhere('c.deliveredAt >= :from', { from: new Date(options.from) });
    }

    if (options?.to) {
      qb.andWhere('c.deliveredAt <= :to', { to: new Date(options.to) });
    }

    const commissions = await qb.getMany();

    // Calculer les résumés
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const pending = commissions.filter(
      (c) => c.status === CommissionStatus.PENDING,
    );
    const paid = commissions.filter((c) => c.status === CommissionStatus.PAID);

    const todayPending = pending
      .filter((c) => new Date(c.deliveredAt) >= todayStart)
      .reduce((s, c) => s + c.amount, 0);

    const weekPending = pending
      .filter((c) => new Date(c.deliveredAt) >= weekStart)
      .reduce((s, c) => s + c.amount, 0);

    return {
      courier,
      commissions,
      summary: {
        totalCount: commissions.length,
        pendingAmount: pending.reduce((s, c) => s + c.amount, 0),
        paidAmount: paid.reduce((s, c) => s + c.amount, 0),
        totalAmount: commissions.reduce((s, c) => s + c.amount, 0),
        todayPending,
        weekPending,
      },
    };
  }

  /**
   * Mes commissions (pour le livreur connecté)
   */
  async getMyCommissions(courierId: string): Promise<any> {
    return this.getCourierDetails(courierId);
  }

  /**
   * Marquer une commission comme payée
   */
  async updateStatus(
    commissionId: string,
    dto: UpdateCommissionDto,
  ): Promise<Commission> {
    const commission = await this.commissionsRepo.findOne({
      where: { id: commissionId },
    });
    if (!commission) {
      throw new NotFoundException('Commission introuvable');
    }

    commission.status = dto.status;
    commission.paymentMethod = dto.paymentMethod;
    commission.notes = dto.notes;

    if (dto.status === CommissionStatus.PAID) {
      commission.paidAt = new Date();
    }

    return this.commissionsRepo.save(commission);
  }

  /**
   * Paiement en masse (plusieurs commissions d'un coup)
   */
  async bulkPay(
    commissionIds: string[],
    paymentMethod?: string,
  ): Promise<{ count: number }> {
    const commissions = await this.commissionsRepo.find({
      where: { id: In(commissionIds) },
    });

    const now = new Date();
    commissions.forEach((c) => {
      c.status = CommissionStatus.PAID;
      c.paidAt = now;
      if (paymentMethod) c.paymentMethod = paymentMethod;
    });

    await this.commissionsRepo.save(commissions);

    this.logger.log(`💰 ${commissions.length} commissions payées`);

    return { count: commissions.length };
  }

  /**
   * Payer toutes les commissions pending d'un livreur
   */
  async payAllForCourier(
    courierId: string,
    paymentMethod?: string,
  ): Promise<{ count: number; amount: number }> {
    const commissions = await this.commissionsRepo.find({
      where: {
        courierId,
        status: CommissionStatus.PENDING,
      },
    });

    const total = commissions.reduce((s, c) => s + c.amount, 0);
    const now = new Date();

    commissions.forEach((c) => {
      c.status = CommissionStatus.PAID;
      c.paidAt = now;
      if (paymentMethod) c.paymentMethod = paymentMethod;
    });

    await this.commissionsRepo.save(commissions);

    this.logger.log(
      `💰 Livreur ${courierId} : ${commissions.length} commissions payées (${total} FCFA)`,
    );

    return { count: commissions.length, amount: total };
  }

  /**
   * Stats globales pour le dashboard
   */
  async getGlobalStats(): Promise<any> {
    const pending = await this.commissionsRepo
      .createQueryBuilder('c')
      .select('SUM(c.amount)', 'sum')
      .addSelect('COUNT(c.id)', 'count')
      .where('c.status = :s', { s: CommissionStatus.PENDING })
      .getRawOne();

    const paid = await this.commissionsRepo
      .createQueryBuilder('c')
      .select('SUM(c.amount)', 'sum')
      .addSelect('COUNT(c.id)', 'count')
      .where('c.status = :s', { s: CommissionStatus.PAID })
      .getRawOne();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const today = await this.commissionsRepo
      .createQueryBuilder('c')
      .select('SUM(c.amount)', 'sum')
      .addSelect('COUNT(c.id)', 'count')
      .where('c.status = :s', { s: CommissionStatus.PENDING })
      .andWhere('c.deliveredAt >= :d', { d: todayStart })
      .getRawOne();

    return {
      pendingAmount: parseInt(pending?.sum, 10) || 0,
      pendingCount: parseInt(pending?.count, 10) || 0,
      paidAmount: parseInt(paid?.sum, 10) || 0,
      paidCount: parseInt(paid?.count, 10) || 0,
      todayAmount: parseInt(today?.sum, 10) || 0,
      todayCount: parseInt(today?.count, 10) || 0,
    };
  }
}