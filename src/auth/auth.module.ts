import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    UsersModule, // We need to check users from the database
    JwtModule.register({
      global: true, // Makes the JWT service available everywhere
      secret: process.env.JWT_SECRET, // IN PRODUCTION: Use process.env.JWT_SECRET
       signOptions: { 
        expiresIn: parseInt(process.env.JWT_EXPIRATION as string) || '60m',// Token expires in 1 hour
      }, 
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController]
})
export class AuthModule {}
