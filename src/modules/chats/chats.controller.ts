import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { ChatsService } from './chats.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { Chat } from './chat.entity';
import { Message } from './message.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@ApiTags('Chats')
@ApiBearerAuth('access-token')
@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Get()
  @ApiOperation({ summary: 'Mes conversations' })
  async findAll(@CurrentUser() user: User): Promise<Chat[]> {
    return this.chatsService.findAll(user);
  }

  @Post()
  @ApiOperation({ summary: 'Créer ou récupérer une conversation' })
  async findOrCreate(
    @CurrentUser() user: User,
    @Body() dto: CreateChatDto,
  ): Promise<Chat> {
    return this.chatsService.findOrCreate(user, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une conversation' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<Chat> {
    return this.chatsService.findOne(id, user);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Envoyer un message' })
  async sendMessage(
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: User,
  ): Promise<Message> {
    return this.chatsService.sendMessage(id, dto, user);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marquer comme lu' })
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<Chat> {
    return this.chatsService.markAsRead(id, user);
  }
}