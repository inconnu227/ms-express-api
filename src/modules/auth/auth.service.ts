/**
 * 🔐 Service Auth
 * ─────────────
 * Logique d'inscription, connexion, JWT.
 */

import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { UsersRepository } from '../users/users.repository';
import { User, UserRole } from '../users/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterCourierDto } from '../users/dto/register-courier.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Inscription d'un client
   */
  async register(dto: RegisterDto): Promise<{
    user: User;
    accessToken: string;
    refreshToken: string;
  }> {
    const existing = await this.usersRepo.findByPhone(dto.phone);
    if (existing) {
      throw new ConflictException('Ce numéro de téléphone est déjà utilisé');
    }

    if (dto.email) {
      const emailExists = await this.usersRepo.findByEmail(dto.email);
      if (emailExists) {
        throw new ConflictException('Cet email est déjà utilisé');
      }
    }

    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await this.usersRepo.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      email: dto.email,
      password: hashedPassword,
      role: UserRole.CLIENT,
    });

    this.logger.log(`✅ Nouveau client créé : ${user.phone}`);

    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  /**
   * Inscription d'un livreur
   */
  async registerCourier(dto: RegisterCourierDto): Promise<{
    user: User;
    accessToken: string;
    refreshToken: string;
  }> {
    const existing = await this.usersRepo.findByPhone(dto.phone);
    if (existing) {
      throw new ConflictException('Ce numéro de téléphone est déjà utilisé');
    }

    if (dto.email) {
      const emailExists = await this.usersRepo.findByEmail(dto.email);
      if (emailExists) {
        throw new ConflictException('Cet email est déjà utilisé');
      }
    }

    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await this.usersRepo.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      email: dto.email,
      password: hashedPassword,
      role: UserRole.COURIER,
      vehicleType: dto.vehicleType,
      vehiclePlate: dto.vehiclePlate,
      isOnline: false,
    });

    this.logger.log(`✅ Nouveau livreur créé : ${user.phone}`);

    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  /**
   * Connexion utilisateur (client ou livreur)
   */
  async login(dto: LoginDto): Promise<{
    user: User;
    accessToken: string;
    refreshToken: string;
  }> {
    const user = await this.usersRepo.findByPhoneWithPassword(dto.phone);
    if (!user) {
      throw new UnauthorizedException('Téléphone ou mot de passe incorrect');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Téléphone ou mot de passe incorrect');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Ce compte est désactivé');
    }

    this.logger.log(`✅ Connexion réussie : ${user.phone} (${user.role})`);

    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  /**
   * Rafraîchir les tokens
   */
  async refresh(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      const user = await this.usersRepo.findById(payload.sub);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Utilisateur introuvable ou inactif');
      }

      return this.generateTokens(user);
    } catch (e) {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }
  }

  /**
   * Valider un utilisateur (utilisé par JwtStrategy)
   */
  async validateUser(userId: string): Promise<User | null> {
    return this.usersRepo.findById(userId);
  }

  // ─── Helpers privés ─────────────────────────
  private async generateTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: this.configService.get<string>('jwt.expiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: User): User {
    const { password, ...rest } = user as any;
    return rest;
  }
}