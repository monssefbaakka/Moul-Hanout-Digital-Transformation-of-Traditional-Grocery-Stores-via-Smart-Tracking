import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';

export interface JwtPayload {
  sub: string; // userId
  email: string;
  role: string;
  sid?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('jwt.secret'),
    });
  }

  async validate(payload: JwtPayload) {
    const [user, session] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          createdAt: true,
        },
      }),
      payload.sid
        ? this.prisma.session.findUnique({
            where: { id: payload.sid },
            select: { id: true, expiresAt: true },
          })
        : Promise.resolve(null),
    ]);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or deactivated');
    }

    if (!payload.sid || !session || session.expiresAt <= new Date()) {
      throw new UnauthorizedException('Session is invalid or expired');
    }

    return {
      ...user,
      role: payload.role,
      sessionId: session.id,
      tokenExpiresAt: payload.exp
        ? new Date(payload.exp * 1000).toISOString()
        : null,
    };
  }
}
