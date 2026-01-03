import { Controller, Get, Post, Body, UseGuards, Request, Delete, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './create-user.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

@ApiTags('Users') // 👈 Group in Swagger UI
@Controller('users') // 1. Defines the base route: /users
export class UsersController {
  
  // 2. DEPENDENCY INJECTION (The Magic)
  // We don't say "const service = new UsersService()".
  // We ask NestJS to give us the service in the constructor.
  constructor(private readonly usersService: UsersService) {}

  @Get() // Handle GET /users
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'List of users' })
  getAllUsers() {
    // The waiter delegates work to the chef
    return this.usersService.findAll(); 
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  // Replace the manual type with CreateUserDto
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(AuthGuard('jwt')) // 2. THE BOUNCER IS HERE
  @Get('profile')
  getProfile(@Request() req) {
    // 3. Because the Strategy worked, req.user now exists!
    return req.user;
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard) // 1. Run AuthGuard first, then RolesGuard
  @Roles('Admin') // 2. Only 'Admin' is allowed
  deleteUser(@Param('id') id: string) {
    return { message: `User ${id} has been deleted (Simulated)` };
  }
}