import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  // 1. LOGIN LOGIC
  async signIn(email: string, pass: string): Promise<any> {
    // A. Find user by email
    // Note: You might need to add a findOneByEmail method to UsersService if it doesn't exist.
    // For now, let's assume we use the repository logic or create a helper.
    const user = await this.usersService.findOneByEmail(email); 

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // B. Check Password (Compare plain text 'pass' vs Hashed 'user.password')
    const isMatch = await bcrypt.compare(pass, user.password);
    
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // C. Generate the Token (The Wristband)
    // The "payload" is the data stored INSIDE the token.
    const payload = { sub: user.id, username: user.email, role: user.role };
    
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
