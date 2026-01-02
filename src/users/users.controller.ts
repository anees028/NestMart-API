import { Controller, Get, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './create-user.dto';

@Controller('users') // 1. Defines the base route: /users
export class UsersController {
  
  // 2. DEPENDENCY INJECTION (The Magic)
  // We don't say "const service = new UsersService()".
  // We ask NestJS to give us the service in the constructor.
  constructor(private readonly usersService: UsersService) {}

  @Get() // Handle GET /users
  getAllUsers() {
    // The waiter delegates work to the chef
    return this.usersService.findAll(); 
  }

  @Post()
  // Replace the manual type with CreateUserDto
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
}