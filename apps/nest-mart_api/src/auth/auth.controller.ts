import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiOperation } from '@nestjs/swagger';
import { LoginDto } from '../dtos/login.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK) // Return 200 OK instead of 201 Created
  @Post('login')
  @ApiOperation({ summary: 'Login a user' })
  signIn(@Body() signInDto: LoginDto) {
    // ideally create a specific LoginDto for this
    return this.authService.signIn(signInDto.email, signInDto.password);
  }

}
