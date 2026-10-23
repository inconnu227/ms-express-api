/**
 * 💬 Service Chats
 */

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Chat } from './chat.entity';
import { Message, MessageSender, MessageStatus } from './message.entity';
import { CreateChatDto } from './dto/create-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { User, UserRole } from '../users/user.entity';

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(Chat)
    private readonly chatsRepo: Repository<Chat>,
    @InjectRepository(Message)
    private readonly messagesRepo: Repository<Message>,
  ) {}

  /**
   * Liste les conversations de l'utilisateur
   */
  async findAll(user: User): Promise<Chat[]> {
    const qb = this.chatsRepo
      .createQueryBuilder('chat')
      .leftJoinAndSelect('chat.client', 'client')
      .leftJoinAndSelect('chat.courier', 'courier')
      .leftJoinAndSelect('chat.order', 'order')
      .orderBy('chat.lastMessageAt', 'DESC')
      .addOrderBy('chat.createdAt', 'DESC');

    if (user.role !== UserRole.ADMIN) {
      qb.where('chat.clientId = :id OR chat.courierId = :id', {
        id: user.id,
      });
    }

    return qb.getMany();
  }

  /**
   * Créer ou récupérer une conversation
   */
  async findOrCreate(client: User, dto: CreateChatDto): Promise<Chat> {
    let chat = await this.chatsRepo.findOne({
      where: {
        clientId: client.id,
        courierId: dto.courierId,
      },
      relations: ['client', 'courier', 'order'],
    });

    if (!chat) {
      chat = this.chatsRepo.create({
        clientId: client.id,
        courierId: dto.courierId,
        orderId: dto.orderId,
      });
      chat = await this.chatsRepo.save(chat);
    }

    return chat;
  }

  /**
   * Récupérer une conversation avec ses messages
   */
  async findOne(id: string, user: User): Promise<Chat> {
    const chat = await this.chatsRepo.findOne({
      where: { id },
      relations: ['client', 'courier', 'order', 'messages', 'messages.sender'],
      order: { messages: { createdAt: 'ASC' } },
    });

    if (!chat) {
      throw new NotFoundException('Conversation introuvable');
    }

    const isParticipant =
      chat.clientId === user.id || chat.courierId === user.id;
    const isAdmin = user.role === UserRole.ADMIN;

    if (!isParticipant && !isAdmin) {
      throw new ForbiddenException('Accès refusé');
    }

    return chat;
  }

  /**
   * Envoyer un message
   */
  async sendMessage(
    chatId: string,
    dto: SendMessageDto,
    user: User,
  ): Promise<Message> {
    const chat = await this.findOne(chatId, user);

    const isClient = chat.clientId === user.id;
    const senderType = isClient
      ? MessageSender.CLIENT
      : MessageSender.COURIER;

    const message = this.messagesRepo.create({
      chatId: chat.id,
      senderId: user.id,
      senderType,
      text: dto.text,
      status: MessageStatus.SENT,
    });

    const saved = await this.messagesRepo.save(message);

    // Mettre à jour le chat
    chat.lastMessageAt = new Date();
    if (isClient) {
      chat.courierUnreadCount += 1;
    } else {
      chat.clientUnreadCount += 1;
    }
    await this.chatsRepo.save(chat);

    return saved;
  }

  /**
   * Marquer les messages comme lus
   */
  async markAsRead(chatId: string, user: User): Promise<Chat> {
    const chat = await this.findOne(chatId, user);

    if (chat.clientId === user.id) {
      chat.clientUnreadCount = 0;
    } else {
      chat.courierUnreadCount = 0;
    }

    return this.chatsRepo.save(chat);
  }
}