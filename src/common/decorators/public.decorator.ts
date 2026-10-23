/**
 * 🏷️ Decorator @Public()
 * Rend une route accessible sans authentification.
 */

import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);