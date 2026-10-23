/**
 * 📦 Entité Order (Commande)
 * ────────────────────────
 * Compatible PostgreSQL + SQLite.
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

export enum OrderStatus {
  SEARCHING = 'searching',
  ACCEPTED = 'accepted',
  PICKUP = 'pickup',
  TRANSIT = 'transit',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  MOBILE_MONEY = 'mobile_money',
  CASH = 'cash',
  CARD = 'card',
}

export enum ServiceType {
  COURSIER = 'coursier',
  PHARMACIE = 'pharmacie',
  BOULANGERIE = 'boulangerie',
  SUPERMARCHE = 'supermarche',
  TAXI = 'taxi',
  SHOP = 'shop',
}

@Entity('orders')
export class Order {
  @ApiProperty({ description: 'ID unique' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Référence lisible', example: 'MS-4821' })
  @Column({ type: 'varchar', length: 20, unique: true })
  reference: string;

  // ─── Client ─────────────────────────────────
  @ApiProperty({ description: 'Client qui a créé la commande' })
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: User;

  @Index()
  @Column({ type: 'uuid' })
  clientId: string;

  // ─── Livreur ────────────────────────────────
  @ApiProperty({ description: 'Livreur assigné', required: false })
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'courierId' })
  courier?: User;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  courierId?: string;

  // ─── Service ────────────────────────────────
  @ApiProperty({ enum: ServiceType, example: ServiceType.COURSIER })
  @Column({ type: 'varchar', length: 30 })
  serviceType: ServiceType;

  @ApiProperty({ description: 'Titre du service' })
  @Column({ type: 'varchar', length: 50 })
  serviceTitle: string;

  @ApiProperty({ description: 'Emoji du service' })
  @Column({ type: 'varchar', length: 10 })
  serviceEmoji: string;

  // ─── Lieu de récupération ────────────────────
  @ApiProperty({ description: 'Label court' })
  @Column({ type: 'varchar', length: 100, default: '' })
  pickupLabel: string;

  @ApiProperty({ description: 'Adresse complète de départ' })
  @Column({ type: 'varchar', length: 255 })
  pickupAddress: string;

  @ApiProperty({ description: 'Latitude de départ', required: false })
  @Column({ type: 'float', nullable: true })
  pickupLat?: number;

  @ApiProperty({ description: 'Longitude de départ', required: false })
  @Column({ type: 'float', nullable: true })
  pickupLng?: number;

  @ApiProperty({ description: 'Téléphone au départ' })
  @Column({ type: 'varchar', length: 20 })
  pickupPhone: string;

  // ─── Lieu de livraison ───────────────────────
  @ApiProperty({ description: 'Label court' })
  @Column({ type: 'varchar', length: 100, default: '' })
  dropoffLabel: string;

  @ApiProperty({ description: 'Adresse complète d\'arrivée' })
  @Column({ type: 'varchar', length: 255 })
  dropoffAddress: string;

  @ApiProperty({ description: 'Latitude d\'arrivée', required: false })
  @Column({ type: 'float', nullable: true })
  dropoffLat?: number;

  @ApiProperty({ description: 'Longitude d\'arrivée', required: false })
  @Column({ type: 'float', nullable: true })
  dropoffLng?: number;

  @ApiProperty({ description: 'Téléphone arrivée' })
  @Column({ type: 'varchar', length: 20 })
  dropoffPhone: string;

  // ─── Notes ──────────────────────────────────
  @ApiProperty({ description: 'Notes', required: false })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  // ─── Détails ────────────────────────────────
  @ApiProperty({ description: 'Distance en km' })
  @Column({ type: 'float', default: 0 })
  distance: number;

  @ApiProperty({ description: 'Prix total en FCFA' })
  @Column({ type: 'int', default: 1000 })
  totalPrice: number;

  @ApiProperty({ enum: PaymentMethod })
  @Column({ type: 'varchar', length: 20, default: PaymentMethod.MOBILE_MONEY })
  paymentMethod: PaymentMethod;

  @ApiProperty({ enum: OrderStatus })
  @Index()
  @Column({ type: 'varchar', length: 20, default: OrderStatus.SEARCHING })
  status: OrderStatus;

  @ApiProperty({ description: 'Temps estimé en minutes' })
  @Column({ type: 'int', default: 15 })
  etaMinutes: number;

  // ─── Position live du livreur ────────────────
  @ApiProperty({ description: 'Latitude du livreur', required: false })
  @Column({ type: 'float', nullable: true })
  courierLat?: number;

  @ApiProperty({ description: 'Longitude du livreur', required: false })
  @Column({ type: 'float', nullable: true })
  courierLng?: number;

  @ApiProperty({ description: 'Dernière mise à jour position', required: false })
  @Column({ type: 'timestamp', nullable: true })
  courierLastUpdate?: Date;

  // ─── Timestamps ─────────────────────────────
  @ApiProperty({ description: 'Date de création' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Dernière mise à jour' })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({ description: 'Date d\'acceptation', required: false })
  @Column({ type: 'timestamp', nullable: true })
  acceptedAt?: Date;

  @ApiProperty({ description: 'Date de livraison', required: false })
  @Column({ type: 'timestamp', nullable: true })
  deliveredAt?: Date;

  @ApiProperty({ description: 'Date d\'annulation', required: false })
  @Column({ type: 'timestamp', nullable: true })
  cancelledAt?: Date;
}