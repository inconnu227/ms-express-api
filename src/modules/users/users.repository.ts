import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.repo.findOne({ where: { phone } });
  }

  async findByPhoneWithPassword(phone: string): Promise<User | null> {
    return this.repo
      .createQueryBuilder('user')
      .where('user.phone = :phone', { phone })
      .addSelect('user.password')
      .getOne();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  async create(data: Partial<User>): Promise<User> {
    const user = this.repo.create(data);
    return this.repo.save(user);
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
  await this.repo.update(id, data);
  return this.findById(id);
}

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async exists(phone: string): Promise<boolean> {
    const count = await this.repo.count({ where: { phone } });
    return count > 0;
  }

  // ─── NOUVELLE MÉTHODE ─────────────────────────
  async findAll(options?: FindManyOptions<User>): Promise<User[]> {
  return this.repo.find(options);
}
}