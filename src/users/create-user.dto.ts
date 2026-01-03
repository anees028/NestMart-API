import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, IsEmail, IsEnum } from 'class-validator';
import { Role } from 'src/enums/roles.enum';

export class CreateUserDto {
  @IsString()
  @ApiProperty({ example: 'John' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  name: string;
  
  @IsEmail()
  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @IsString()
  @MinLength(3, { message: 'Password is too weak' })
  @ApiProperty({ example: 'min length 3 character' })
  password: string;

  @ApiProperty({ enum: Role, example: Role.User }) // Updates Swagger to show dropdown!
  @IsEnum(Role, { message: 'Valid roles are User, Admin, or Manager' }) // Validates input
  role: Role;
}