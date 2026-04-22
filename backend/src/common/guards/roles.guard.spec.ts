import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { Role } from '../enums';

function createExecutionContext(user: { role: Role } | null): ExecutionContext {
  return {
    getClass: jest.fn(),
    getHandler: jest.fn(),
    getArgs: jest.fn(),
    getArgByIndex: jest.fn(),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
    getType: jest.fn(),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({ user }),
      getResponse: jest.fn(),
      getNext: jest.fn(),
    }),
  };
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

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
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);

    const context = createExecutionContext({ role: Role.CASHIER });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should return true if user has the required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.OWNER]);

    const context = createExecutionContext({ role: Role.OWNER });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user has wrong role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.OWNER]);

    const context = createExecutionContext({ role: Role.CASHIER });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if no user is present', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.OWNER]);

    const context = createExecutionContext(null);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
