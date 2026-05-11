import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { UserRole } from '../enums/role.enum';

type RequestUser = {
  _id: { toString(): string } | string;
  role: UserRole;
  email?: string;
};

const getRequestUser = (ctx: ExecutionContext): RequestUser => {
  const request = ctx.switchToHttp().getRequest<{ user: RequestUser }>();
  return request.user;
};

export const GetUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    return getRequestUser(ctx)._id.toString();
  },
);

export const GetUserRole = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    return getRequestUser(ctx).role;
  },
);

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    return getRequestUser(ctx);
  },
);

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
