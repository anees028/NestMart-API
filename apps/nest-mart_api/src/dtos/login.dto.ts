import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, IsEmail, IsEnum } from 'class-validator';

export class LoginDto {
  
  @IsEmail()
  @ApiProperty({ example: 'Anees20@gmail.com' })
  email: string;

  @IsString()
  @MinLength(3, { message: 'Password is too weak' })
  @ApiProperty({ example: 'Anees123' })
  password: string;
}