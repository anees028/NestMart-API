import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // 1. Where do we get the token from?
      // "Look in the Authorization header for 'Bearer <token>'"
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      
      // 2. Ignore expired tokens? No, reject them.
      ignoreExpiration: false,
      
      // 3. The Secret Key (Must match what we used in AuthModule)
      // In production, use process.env.JWT_SECRET
      secretOrKey: 'superSecretKey123', // it is same as in auth.module.ts
    });
  }

  // 4. What happens if the token is valid?
  // This function runs automatically. The 'payload' is the decoded JSON inside the token.
  async validate(payload: any) {
    // Whatever we return here gets attached to 'req.user'
    // Now, every protected route will know WHO the user is!
    return { id: payload.sub, username: payload.username, role: payload.role };
  }
}