import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    UsersModule, // We need to check users from the database
    JwtModule.register({
      global: true, // Makes the JWT service available everywhere
      secret: 'superSecretKey123', // IN PRODUCTION: Use process.env.JWT_SECRET
      signOptions: { expiresIn: '1h' }, // Token expires in 1 hour
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController]
})
export class AuthModule {}
