import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  IsEmail,
  Matches,
} from 'class-validator';

export class RegisterCourierDto {
  @ApiProperty({ example: 'Moussa' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Diallo' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @ApiProperty({ example: '+22790111111' })
  @IsString()
  @Matches(/^\+?[0-9]{8,15}$/)
  phone: string;

  @ApiProperty({ example: 'courier123' })
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password: string;

  @ApiProperty({ example: 'moussa@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'moto', required: false })
  @IsOptional()
  @IsString()
  vehicleType?: string;

  @ApiProperty({ example: 'AB 1234', required: false })
  @IsOptional()
  @IsString()
  vehiclePlate?: string;
}