/**
 * ⭐ Entité Rating (Avis)
 * ─────────────────────
 * Un avis laissé après une livraison.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../users/user.entity';
import { Order } from '../orders/order.entity';

@Entity('ratings')
export class Rating {
  @ApiProperty({ description: 'ID unique' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Index({ unique: true })
  @Column({ type: 'uuid' })
  orderId: string;

  @ApiProperty({ description: 'Client qui note' })
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: User;

  @Column({ type: 'uuid' })
  clientId: string;

  @ApiProperty({ description: 'Livreur noté' })
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courierId' })
  courier: User;

  @Index()
  @Column({ type: 'uuid' })
  courierId: string;

  @ApiProperty({ description: 'Note de 1 à 5', example: 5 })
  @Column({ type: 'int' })
  stars: number;

  @ApiProperty({ description: 'Tags sélectionnés', example: ['punctual', 'friendly'] })
  @Column({ type: 'simple-array', default: '' })
  tags: string[];

  @ApiProperty({ description: 'Commentaire', required: false })
  @Column({ type: 'text', nullable: true })
  comment?: string;

  @ApiProperty({ description: 'Pourboire en FCFA', required: false, example: 500 })
  @Column({ type: 'int', nullable: true })
  tip?: number;

  @ApiProperty({ description: 'Créé le' })
  @CreateDateColumn()
  createdAt: Date;
}