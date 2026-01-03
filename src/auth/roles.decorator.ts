import { SetMetadata } from '@nestjs/common';

// This creates a decorator @Roles('admin', 'manager')
// It literally just attaches a sticker (metadata) to the route handler
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);