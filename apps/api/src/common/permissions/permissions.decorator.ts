import { SetMetadata } from '@nestjs/common';
import { Permission } from './permission.types';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Permissions decorator for fine-grained access control
 * Use this instead of @Roles for specific operations
 * 
 * @example
 * @Permissions(Permission.PROJECT_READ_OWN, Permission.PROJECT_UPDATE_OWN)
 * async updateProject() { }
 */
export const Permissions = (...permissions: Permission[]) => 
  SetMetadata(PERMISSIONS_KEY, permissions);
