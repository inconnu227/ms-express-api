/**
 * 💬 Entité Chat (Conversation)
 * ────────────────────────────
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../users/user.entity';
import { Order } from '../orders/order.entity';
import { Message } from './message.entity';

@Entity('chats')
export class Chat {
  @ApiProperty({ description: 'ID unique' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Client' })
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: User;

  @Column({ type: 'uuid' })
  clientId: string;

  @ApiProperty({ description: 'Livreur' })
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courierId' })
  courier: User;

  @Column({ type: 'uuid' })
  courierId: string;

  @ApiProperty({ description: 'Commande associée', required: false })
  @ManyToOne(() => Order, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'orderId' })
  order?: Order;

  @Column({ type: 'uuid', nullable: true })
  orderId?: string;

  @ApiProperty({ description: 'Non lus par le client', default: 0 })
  @Column({ type: 'int', default: 0 })
  clientUnreadCount: number;

  @ApiProperty({ description: 'Non lus par le livreur', default: 0 })
  @Column({ type: 'int', default: 0 })
  courierUnreadCount: number;

  @OneToMany(() => Message, (message) => message.chat, {
    cascade: true,
  })
  messages: Message[];

  @ApiProperty({ description: 'Créé le' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Mis à jour le' })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({ description: 'Dernier message', required: false })
  @Column({ type: 'timestamp', nullable: true })
  lastMessageAt?: Date;
}