// `Injectable` marks this class as a NestJS service that can be injected elsewhere.
// `UnauthorizedException` is the standard NestJS error for invalid auth attempts.
// `ConflictException` is used when a resource already exists, like a duplicate email.
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';

// `JwtService` is NestJS's helper for signing and verifying JWT tokens.
import { JwtService } from '@nestjs/jwt';

// `ConfigService` reads values from environment-based application config.
import { ConfigService } from '@nestjs/config';

// `bcrypt` is used to safely compare and hash secrets like passwords and refresh tokens.
import * as bcrypt from 'bcryptjs';

// `randomUUID` creates a unique temporary value for a newly created session row.
import { randomUUID } from 'crypto';

// `StringValue` is a type helper for strings like `15m` or `7d` used in JWT expiration config.
import type { StringValue } from 'ms';

// `PrismaService` is our database access layer.
import { PrismaService } from '../../database/prisma.service';

// These DTOs define the shape of login, register, and password-recovery request bodies.
import {
  LoginDto,
  RegisterDto,
} from './dto/auth.dto';

// `Role` is the app-level enum for user roles.
import { Role } from '../../common/enums';

// `JwtPayload` describes what fields we expect to find inside decoded JWT tokens.
import { JwtPayload } from './strategies/jwt.strategy';

// This interface describes the user fields we need while generating tokens and sessions.
interface AuthenticatedUser {
  // The database id of the user.
  id: string;

  // The user's email address.
  email: string;

  // The user's display name.
  name: string;

  // The user's role as a plain string value.
  role: string;

  // Whether the user account is active.
  isActive: boolean;

  // When the user was created.
  createdAt: Date;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthResponse extends AuthTokens {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
    createdAt: Date;
  };
}

interface LogoutResponse {
  message: string;
}

// This tells NestJS that `AuthService` can be injected into controllers and other services.
@Injectable()
export class AuthService {
  // The constructor receives all dependencies needed by this service.
  constructor(
    // Database access dependency.
    private readonly prisma: PrismaService,

    // JWT helper dependency.
    private readonly jwt: JwtService,

    // Configuration helper dependency.
    private readonly config: ConfigService,
  ) {}

  // This method handles the login flow.
  async login(dto: LoginDto) {
    // Look up the user by the submitted email address.
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { shopRoles: true },
    });

    // Reject the request if the user does not exist or the account is disabled.
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Compare the submitted password with the stored hashed password.
    const passwordMatch = await bcrypt.compare(dto.password, user.password);

    // Reject the request if the password is wrong.
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Create a server-side session and return freshly issued access and refresh tokens.
    return this.issueTokensForUser({
      // Pass the user's id into the helper method.
      id: user.id,

      // Pass the user's email into the helper method.
      email: user.email,

      // Pass the user's name into the helper method.
      name: user.name,

      role: user.shopRoles?.[0]?.role || Role.CASHIER,

      // Pass the active flag into the helper method.
      isActive: user.isActive,

      // Pass the user creation date into the helper method.
      createdAt: user.createdAt,
    });
  }

  // This method handles user registration.
  async register(dto: RegisterDto) {
    // Check whether another user already exists with the same email address.
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });

    // Reject duplicate email addresses.
    if (exists) throw new ConflictException('Email already registered');

    // Hash the incoming password before storing it in the database.
    const hashed = await bcrypt.hash(dto.password, 12);

    // Create the new user record.
    const user = await this.prisma.user.create({
      // Data to insert.
      data: {
        // Save the submitted name.
        name: dto.name,

        // Save the submitted email.
        email: dto.email,

        // Save the hashed password instead of the raw password.
        password: hashed,

        // Create a default shop connection. NOTE: In a real app the shop should be passed in.
        shopRoles: {
          create: {
            role: Role.CASHIER,
            shop: {
              connectOrCreate: {
                where: { id: 'default-shop-id' },
                create: { name: 'Main Shop' },
              },
            },
          },
        },
      },

      // Only return non-sensitive fields.
      select: { 
        id: true, 
        email: true, 
        name: true,
        shopRoles: { select: { role: true, shopId: true } }
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.shopRoles?.[0]?.role || Role.CASHIER,
    };
  }

  // This method handles the refresh token flow.
  async refresh(refreshToken: string) {
    // Verify the refresh token signature and decode its payload.
    const payload = this.verifyToken(refreshToken, 'refresh');

    // Load the matching session and its related user from the database.
    const session = await this.prisma.session.findUnique({
      // Find the session by the `sid` stored in the token.
      where: { id: payload.sid },

      // Also fetch the linked user so we can validate account state.
      include: { user: { include: { shopRoles: true } } },
    });

    // Reject the request if the session does not exist, belongs to another user, or is expired.
    if (!session || session.userId !== payload.sub || session.expiresAt <= new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Compare the incoming refresh token with the hashed token stored in the session row.
    const tokenMatches = await bcrypt.compare(refreshToken, session.token);

    // Reject the request if the token does not match or the user is no longer active.
    if (!tokenMatches || !session.user.isActive) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Rotate the session tokens so the old refresh token can no longer be reused.
    return this.rotateSessionTokens(session.id, {
      // Pass the user id.
      id: session.user.id,

      // Pass the user email.
      email: session.user.email,

      // Pass the user name.
      name: session.user.name,

      role: session.user.shopRoles?.[0]?.role || Role.CASHIER,

      // Pass the user active flag.
      isActive: session.user.isActive,

      // Pass the user creation date.
      createdAt: session.user.createdAt,
    });
  }

  // This method handles logout by deleting the current session.
  async logout(userId: string, sessionId: string, authorization?: string) {
    // If an Authorization header was provided, validate that it follows `Bearer <token>` format.
    if (authorization) {
      this.extractBearerToken(authorization);
    }

    // Delete only the session that belongs to this user and this exact session id.
    await this.prisma.session.deleteMany({
      // Match both the session id and the user id for safety.
      where: { id: sessionId, userId },
    });

    return { message: 'Logged out successfully' } satisfies LogoutResponse;
  }

  // This helper creates a session row and then generates tokens for that session.
  private async issueTokensForUser(user: AuthenticatedUser) {
    // Create the session first so we have a database id to embed inside the JWT payload.
    const session = await this.prisma.session.create({
      // Data for the new session row.
      data: {
        // Link the session to the user.
        userId: user.id,

        // Store a temporary placeholder token value until we generate and hash the real refresh token.
        token: `pending-${randomUUID()}`,

        // Store a temporary expiration that will be replaced immediately after token generation.
        expiresAt: new Date(),
      },
    });

    // Generate tokens tied to this session and update the session with the hashed refresh token.
    return this.rotateSessionTokens(session.id, user);
  }

  // This helper generates a fresh token pair and updates the stored refresh-token hash.
  private async rotateSessionTokens(sessionId: string, user: AuthenticatedUser) {
    // Create a new access token and refresh token for this user and session.
    const tokens = this.generateTokens(user.id, user.email, user.role, sessionId);

    // Hash the refresh token before saving it to the database.
    const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 12);

    // Read the expiration date from the refresh token itself.
    const refreshTokenExpiry = this.getTokenExpiry(tokens.refreshToken);

    // Save the hashed refresh token and its expiration on the session record.
    await this.prisma.session.update({
      // Update the current session row.
      where: { id: sessionId },

      // New values to save.
      data: {
        // Store only the hashed token.
        token: hashedRefreshToken,

        // Store when that refresh token expires.
        expiresAt: refreshTokenExpiry,
      },
    });

    // Return the plain tokens to the caller. Only the hash is stored in the database.
    return this.buildAuthResponse(user, tokens);
  }

  // This helper signs the actual JWT access and refresh tokens.
  private generateTokens(
    userId: string,
    email: string,
    role: string,
    sessionId: string,
  ): AuthTokens {
    // Build the payload that will be embedded in both tokens.
    const payload = { sub: userId, email, role, sid: sessionId };

    // Read the access-token signing secret from config.
    const accessSecret = this.config.getOrThrow<string>('jwt.secret');

    // Read the refresh-token signing secret from config.
    const refreshSecret = this.config.getOrThrow<string>('jwt.refreshSecret');

    // Read the configured access-token lifetime, for example `15m`.
    const accessExpiresIn = this.config.getOrThrow<string>(
      'jwt.accessExpiresIn',
    ) as StringValue;

    // Read the configured refresh-token lifetime, for example `7d`.
    const refreshExpiresIn = this.config.getOrThrow<string>(
      'jwt.refreshExpiresIn',
    ) as StringValue;

    // Sign the access token.
    const accessToken = this.jwt.sign(payload, {
      // Use the access secret for signing.
      secret: accessSecret,

      // Set the access-token expiration.
      expiresIn: accessExpiresIn,
    });

    // Sign the refresh token.
    const refreshToken = this.jwt.sign(payload, {
      // Use the refresh secret for signing.
      secret: refreshSecret,

      // Set the refresh-token expiration.
      expiresIn: refreshExpiresIn,
    });

    // Return both tokens together.
    return { accessToken, refreshToken };
  }

  // This helper verifies a token and normalizes auth-related errors.
  private verifyToken(token: string, tokenType: 'access' | 'refresh') {
    try {
      // Verify the token signature using the correct secret for its type.
      const payload = this.jwt.verify<JwtPayload>(token, {
        secret:
          tokenType === 'access'
            ? this.config.getOrThrow<string>('jwt.secret')
            : this.config.getOrThrow<string>('jwt.refreshSecret'),
      });

      // Reject the token if it does not contain a session id.
      if (!payload.sid) {
        throw new UnauthorizedException(`${tokenType} token is missing session information`);
      }

      // Return the decoded payload when verification succeeds.
      return payload;
    } catch (error) {
      // If we already created a clean UnauthorizedException, keep it as-is.
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // Otherwise hide internal details and return a generic auth error.
      throw new UnauthorizedException(`Invalid or expired ${tokenType} token`);
    }
  }

  // This helper extracts the expiration timestamp from a JWT without verifying it again.
  private getTokenExpiry(token: string) {
    // Decode the token payload.
    const decoded = this.jwt.decode(token) as JwtPayload | null;

    // Reject the token if it has no expiration field.
    if (!decoded?.exp) {
      throw new UnauthorizedException('Unable to determine token expiration');
    }

    // Convert the Unix timestamp in seconds into a JavaScript Date object.
    return new Date(decoded.exp * 1000);
  }

  // This helper validates the format of an Authorization header.
  private extractBearerToken(authorization: string) {
    // Split a header like `Bearer abc.def.ghi` into its two parts.
    const [scheme, token] = authorization.split(' ');

    // Reject the header if it does not use the Bearer scheme or has no token value.
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Authorization header must use Bearer scheme');
    }

    // Return the extracted token string.
    return token;
  }

  private buildAuthResponse(user: AuthenticatedUser, tokens: AuthTokens): AuthResponse {
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
      ...tokens,
    };
  }

}
