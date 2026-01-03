import { SetMetadata } from '@nestjs/common';
import { Role } from 'src/enums/roles.enum';

// This creates a decorator @Roles('admin', 'manager')
// It literally just attaches a sticker (metadata) to the route handler
export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);