import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';

@Module({
  imports:[TypeOrmModule.forFeature([User])], // REGISTER REPOSITORY HERE
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // ADD THIS: Allow other modules to use UsersService
})
export class UsersModule {}
