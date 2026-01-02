import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, MinLength, IsEmail } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @ApiProperty({ example: 'John' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  name: string;
  
  @IsEmail()
  @ApiProperty({ example: 'john@example.com' })
  email: string;

  // @IsString()
  // @MinLength(6, { message: 'Password is too weak' })
  // password: string;

  @IsString()
  role: string;
}