import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard, IS_PUBLIC_KEY } from './jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  const mockExecutionContext = () => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnThis(),
      getRequest: jest.fn().mockReturnValue({}),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    // Mock the parent class canActivate
    jest.spyOn(AuthGuard('jwt').prototype, 'canActivate').mockReturnValue(true);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return true for public routes without calling super', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);
    const context = mockExecutionContext();

    expect(guard.canActivate(context)).toBe(true);
    expect(AuthGuard('jwt').prototype.canActivate).not.toHaveBeenCalled();
  });

  it('should call super.canActivate for non-public routes', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    const context = mockExecutionContext();
    
    expect(guard.canActivate(context)).toBe(true);
    expect(AuthGuard('jwt').prototype.canActivate).toHaveBeenCalledWith(context);
  });
});
