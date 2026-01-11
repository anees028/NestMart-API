import { IsArray, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ example: [1, 2], description: 'List of Product IDs' })
  @IsArray()
  @IsNumber({}, { each: true }) // Check that EACH item in the array is a number
  productIds: number[];
}