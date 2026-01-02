import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  // Fake Database
  private users = [
    { id: 1, name: 'Gemini', role: 'AI' },
    { id: 2, name: 'Developer', role: 'Human' },
  ];

  // Logic to fetch all users
  findAll() {
    return this.users;
  }

  // Logic to create a user
  create(user: { name: string; role: string }) {
    const newUser = { id: this.users.length + 1, ...user };
    this.users.push(newUser);
    return newUser;
  }
}
