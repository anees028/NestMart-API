import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule, // We need to check users from the database
    JwtModule.register({
      global: true, // Makes the JWT service available everywhere
      secret: 'you_are_my_pinki', // IN PRODUCTION: Use process.env.JWT_SECRET
      signOptions: { expiresIn: '60m' }, // Token expires in 1 hour
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController]
})
export class AuthModule {}
