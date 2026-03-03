import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/** Extracts the full authenticated user from `req.user`. */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<Request>();
    const user = (req as any).user;
    return data ? user?.[data] : user;
  },
);
