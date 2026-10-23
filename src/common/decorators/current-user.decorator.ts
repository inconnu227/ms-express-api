/**
 * 🏷️ Decorator @CurrentUser()
 * Injecte l'utilisateur connecté dans le contrôleur.
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../modules/users/user.entity';

export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext): User | any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as User;

    if (data) {
      return user?.[data];
    }
    return user;
  },
);