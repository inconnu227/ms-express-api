import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { Rating } from './rating.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@ApiTags('Ratings')
@ApiBearerAuth('access-token')
@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Noter une livraison' })
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateRatingDto,
  ): Promise<Rating> {
    return this.ratingsService.create(user, dto);
  }

  @Get('mine')
  @ApiOperation({ summary: 'Mes avis donnés' })
  async findMine(@CurrentUser() user: User): Promise<Rating[]> {
    return this.ratingsService.findMine(user);
  }

  @Get('received')
  @ApiOperation({ summary: 'Avis reçus (livreur)' })
  async findReceived(@CurrentUser() user: User): Promise<Rating[]> {
    return this.ratingsService.findReceived(user);
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Avis d\'une commande' })
  async findByOrder(
    @Param('orderId') orderId: string,
    @CurrentUser() user: User,
  ): Promise<Rating | null> {
    return this.ratingsService.findByOrder(orderId, user);
  }
}