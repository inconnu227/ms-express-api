/**
 * 👤 Entité User
 * ─────────────
 * Représente un utilisateur de MS Express.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

export enum UserRole {
  CLIENT = 'client',
  COURIER = 'courier',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @ApiProperty({ description: 'ID unique' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Prénom', example: 'Awa' })
  @Column({ type: 'varchar', length: 50 })
  firstName: string;

  @ApiProperty({ description: 'Nom', example: 'Diallo' })
  @Column({ type: 'varchar', length: 50 })
  lastName: string;

  @ApiProperty({ description: 'Téléphone', example: '+22790123456' })
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 20, unique: true })
  phone: string;

  @ApiProperty({ description: 'Email', required: false })
  @Column({ type: 'varchar', length: 150, nullable: true })
  email?: string;

  @ApiProperty({ description: 'URL avatar', required: false })
  @Column({ type: 'varchar', length: 500, nullable: true })
  avatar?: string;

  @ApiProperty({ enum: UserRole, example: UserRole.CLIENT })
  @Column({ type: 'varchar', length: 20, default: UserRole.CLIENT })
  role: UserRole;

  @ApiProperty({ description: 'Compte actif', default: true })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Note moyenne', example: 4.9, default: 5.0 })
  @Column({ type: 'float', default: 5.0 })
  rating: number;

  @ApiProperty({ description: 'Nombre de livraisons', default: 0 })
  @Column({ type: 'int', default: 0 })
  totalOrders: number;

  // ─── Champs livreurs ────────────────────────
  @ApiProperty({ description: 'Livreur en ligne ?', default: false })
  @Column({ type: 'boolean', default: false })
  isOnline: boolean;

  @ApiProperty({ description: 'Dernière activité', required: false })
  @Column({ type: 'datetime', nullable: true })
  lastSeenAt?: Date;

  @ApiProperty({ description: 'Type de véhicule', required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  vehicleType?: string;

  @ApiProperty({ description: 'Plaque d\'immatriculation', required: false })
  @Column({ type: 'varchar', length: 30, nullable: true })
  vehiclePlate?: string;

  @ApiProperty({ description: 'Numéro de permis', required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  driverLicense?: string;

  // ─── Notifications ──────────────────────────
  @ApiProperty({ description: 'Token push Expo', required: false })
  @Column({ type: 'varchar', length: 255, nullable: true })
  expoPushToken?: string;

  @ApiProperty({ description: 'Notifications activées', default: true })
  @Column({ type: 'boolean', default: true })
  notificationsEnabled: boolean;

  @ApiProperty({ description: 'Dernière mise à jour du token', required: false })
  @Column({ type: 'datetime', nullable: true })
  pushTokenUpdatedAt?: Date;

  // ─── Mot de passe ───────────────────────────
  @Exclude()
  @Column({ type: 'varchar', length: 255, select: false })
  password: string;

  @ApiProperty({ description: 'Créé le' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Mis à jour le' })
  @UpdateDateColumn()
  updatedAt: Date;
}