/**
 * 💬 Entité Message
 * ────────────────
 * Un message dans une conversation.
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
import { Chat } from './chat.entity';

export enum MessageSender {
  CLIENT = 'client',
  COURIER = 'courier',
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
}

@Entity('messages')
export class Message {
  @ApiProperty({ description: 'ID unique' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Chat, (chat) => chat.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chatId' })
  chat: Chat;

  @Index()
  @Column({ type: 'uuid' })
  chatId: string;

  @ApiProperty({ description: 'Auteur du message' })
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'senderId' })
  sender?: User;

  @Column({ type: 'uuid', nullable: true })
  senderId?: string;

  @ApiProperty({ enum: MessageSender, example: MessageSender.CLIENT })
  @Column({ type: 'varchar', length: 20 })
  senderType: MessageSender;

  @ApiProperty({ description: 'Contenu du message', example: 'Bonjour !' })
  @Column({ type: 'text' })
  text: string;

  @ApiProperty({ enum: MessageStatus, example: MessageStatus.SENT })
  @Column({ type: 'varchar', length: 20, default: MessageStatus.SENT })
  status: MessageStatus;

  @ApiProperty({ description: 'Envoyé le' })
  @CreateDateColumn()
  createdAt: Date;
}