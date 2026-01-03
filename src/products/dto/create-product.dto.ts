import { IsString, IsNumber, IsPositive, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Gaming Laptop', description: 'Product Title' })
  @IsString()
  @MinLength(2)
  title: string;

  @ApiProperty({ example: 1500, description: 'Price in USD' })
  @IsNumber()
  @IsPositive()
  price: number;
}