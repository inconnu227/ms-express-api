/**
 * 💰 Entité Commission
 * ───────────────────
 * Commission de 35% que le livreur doit à MS Express.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../users/user.entity';
import { Order } from '../orders/order.entity';

export enum CommissionStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

@Entity('commissions')
export class Commission {
  @ApiProperty({ description: 'ID unique' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Livreur redevable' })
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courierId' })
  courier: User;

  @Index()
  @Column({ type: 'uuid' })
  courierId: string;

  @ApiProperty({ description: 'Commande associée' })
  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Index()
  @Column({ type: 'uuid' })
  orderId: string;

  @ApiProperty({ description: 'Référence de la commande' })
  @Column({ type: 'varchar', length: 20 })
  orderReference: string;

  @ApiProperty({ description: 'Montant total de la course' })
  @Column({ type: 'int' })
  orderTotal: number;

  @ApiProperty({ description: 'Taux de commission (%)' })
  @Column({ type: 'float', default: 35 })
  rate: number;

  @ApiProperty({ description: 'Montant de la commission' })
  @Column({ type: 'int' })
  amount: number;

  @ApiProperty({ enum: CommissionStatus })
  @Index()
  @Column({
    type: 'varchar',
    length: 20,
    default: CommissionStatus.PENDING,
  })
  status: CommissionStatus;

  @ApiProperty({ description: 'Date de livraison' })
  @Column({ type: 'timestamp' })
  deliveredAt: Date;

  @ApiProperty({ description: 'Date de paiement', required: false })
  @Column({ type: 'timestamp', nullable: true })
  paidAt?: Date;

  @ApiProperty({ description: 'Méthode de paiement', required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  paymentMethod?: string;

  @ApiProperty({ description: 'Note admin', required: false })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @ApiProperty({ description: 'Créée le' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Mise à jour le' })
  @UpdateDateColumn()
  updatedAt: Date;
}