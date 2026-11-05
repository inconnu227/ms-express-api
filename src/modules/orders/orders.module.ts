import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Order } from './order.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { CommissionsModule } from '../commissions/commissions.module';
import { UsersModule } from '../users/users.module'; // ⬅️ AJOUTÉ

@Module({
  imports: [
    TypeOrmModule.forFeature([Order]),
    CommissionsModule,
    UsersModule, // ⬅️ AJOUTÉ pour injecter UsersRepository
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}