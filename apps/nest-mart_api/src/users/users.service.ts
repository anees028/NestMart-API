import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>, // Inject the Repository
  ) {}

  // Find all users in DB
  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  // Find one user by email
  findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  // Create and Save to DB
  async create(createUserDto: CreateUserDto): Promise<User> {
    // 1. Create the entity instance
    const newUser = this.usersRepository.create(createUserDto);
    
    // 2. Save it (triggers INSERT SQL)
    return this.usersRepository.save(newUser);
  }
}
