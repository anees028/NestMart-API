import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, IsEmail, IsEnum } from 'class-validator';

export class LoginDto {
  
  @IsEmail()
  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @IsString()
  @MinLength(3, { message: 'Password is too weak' })
  @ApiProperty({ example: 'min length 3 character' })
  password: string;
}