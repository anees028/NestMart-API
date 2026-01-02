import { Controller, Get, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';

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

  @Post() // Handle POST /users
  createUser(@Body() userData: { name: string; role: string }) {
    // @Body() is the same as req.body in Express
    return this.usersService.create(userData);
  }
}