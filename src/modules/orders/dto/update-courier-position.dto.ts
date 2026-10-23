import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, Max } from 'class-validator';

export class UpdateCourierPositionDto {
  @ApiProperty({
    description: 'Latitude du livreur',
    example: 13.5151,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({
    description: 'Longitude du livreur',
    example: 2.1185,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;
}