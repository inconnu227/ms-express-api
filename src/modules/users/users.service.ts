/**
 * 👤 Service Users
 */

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Not } from 'typeorm';
import { UsersRepository } from './users.repository';
import { User, UserRole } from './user.entity';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}

  async findById(id: string): Promise<User> {
    const user = await this.usersRepo.findById(id);
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }
    return user;
  }

  async updateProfile(
    userId: string,
    data: Partial<
      Pick<
        User,
        | 'firstName'
        | 'lastName'
        | 'email'
        | 'avatar'
        | 'vehicleType'
        | 'vehiclePlate'
        | 'driverLicense'
      >
    >,
  ): Promise<User> {
    await this.findById(userId);
    const updated = await this.usersRepo.update(userId, data);
    if (!updated) {
      throw new NotFoundException('Utilisateur introuvable');
    }
    return updated;
  }

  async findCouriers(excludeUserId: string): Promise<User[]> {
    return this.usersRepo.findAll({
      where: { id: Not(excludeUserId), isActive: true },
      order: { rating: 'DESC' },
    });
  }

  async findAll(options?: { role?: string; search?: string }): Promise<User[]> {
    const where: any = {};

    if (options?.role) {
      where.role = options.role;
    }

    const users = await this.usersRepo.findAll({
      where,
      order: { createdAt: 'DESC' },
    });

    if (options?.search && options.search.trim()) {
      const q = options.search.toLowerCase();
      return users.filter(
        (u) =>
          u.firstName.toLowerCase().includes(q) ||
          u.lastName.toLowerCase().includes(q) ||
          u.phone.includes(q) ||
          u.email?.toLowerCase().includes(q),
      );
    }

    return users;
  }

  async setOnline(userId: string, isOnline: boolean): Promise<User> {
    const user = await this.findById(userId);
    
    // 🛑 VÉRIFICATION : Si le livreur veut passer en ligne mais n'est pas approuvé
    if (isOnline && user.role === UserRole.COURIER && !user.isApproved) {
      throw new ForbiddenException(
        'Votre compte est en attente de validation par un administrateur.',
      );
    }

    const updated = await this.usersRepo.update(userId, {
      isOnline,
      lastSeenAt: new Date(),
    });
    
    if (!updated) {
      throw new NotFoundException('Utilisateur introuvable');
    }
    return updated;
  }

  async findAvailableCouriers(): Promise<User[]> {
    return this.usersRepo.findAll({
      where: {
        role: UserRole.COURIER,
        isActive: true,
        isOnline: true,
        isApproved: true, // Uniquement les approuvés
      },
      order: { rating: 'DESC' },
    });
  }

  async savePushToken(userId: string, token: string): Promise<User> {
    await this.findById(userId);
    const updated = await this.usersRepo.update(userId, {
      expoPushToken: token,
      pushTokenUpdatedAt: new Date(),
    });
    if (!updated) {
      throw new NotFoundException('Utilisateur introuvable');
    }
    return updated;
  }

  // ─── NOUVELLE MÉTHODE : Approuver un livreur ───
  async approveCourier(userId: string): Promise<User> {
    const user = await this.findById(userId);
    if (user.role !== UserRole.COURIER) {
      throw new BadRequestException('Cet utilisateur n\'est pas un livreur');
    }
    const updated = await this.usersRepo.update(userId, { isApproved: true });
    return updated as User;
  }

    async saveKyc(
    userId: string,
    idCardUrl: string,
    licenseUrl: string,
  ): Promise<User> {
    const updated = await this.usersRepo.update(userId, {
      kycIdCardUrl: idCardUrl,
      kycLicenseUrl: licenseUrl,
      kycSubmittedAt: new Date(),
    });
    if (!updated) {
      throw new NotFoundException('Utilisateur introuvable');
    }
    return updated;
  }
}