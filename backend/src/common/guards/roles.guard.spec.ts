import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Role } from '../enums';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const mockExecutionContext = (user?: any, handlerRoles?: Role[]) => {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          user,
        }),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return true if no roles are required', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    const context = mockExecutionContext();
    
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should return true if user role matches one of the required roles', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([Role.OWNER]);
    const context = mockExecutionContext({ role: Role.OWNER });
    
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user role does not match any required roles', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([Role.OWNER]);
    const context = mockExecutionContext({ role: Role.CASHIER });
    
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow('This action requires one of the following roles: OWNER');
  });

  it('should throw ForbiddenException if user is not present in request', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([Role.OWNER]);
    const context = mockExecutionContext(undefined);
    
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow('Not authenticated');
  });
});
