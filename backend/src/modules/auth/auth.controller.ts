import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
  ApiConflictResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { AuthResponse, AuthService, LogoutResponse } from './auth.service';
import {
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../../common/guards/jwt-auth.guard';
import { SetMetadata } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';

const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user and return tokens' })
  @ApiOkResponse({
    description:
      'Successfully authenticated. Returns access and refresh tokens.',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials or account deactivated.',
  })
  login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiCreatedResponse({ description: 'Account successfully created.' })
  @ApiConflictResponse({ description: 'Email address already in use.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token.' })
  register(
    @CurrentUser('shopId') shopId: string,
    @Body() dto: RegisterDto,
  ) {
    return this.authService.register(shopId, dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using a valid refresh token' })
  @ApiOkResponse({ description: 'Tokens successfully refreshed.' })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired refresh token.' })
  refresh(@Body() dto: RefreshTokenDto): Promise<AuthResponse> {
    return this.authService.refresh(dto.refreshToken);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create a password reset token for the matching account',
  })
  @ApiOkResponse({
    description:
      'Always returns a generic success message to avoid leaking account existence.',
  })
  forgotPassword(@Body() dto: ForgotPasswordDto): Promise<LogoutResponse> {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate a password reset token and save a new password',
  })
  @ApiOkResponse({
    description:
      'Password updated and all existing user sessions invalidated.',
  })
  @ApiBadRequestResponse({
    description: 'The reset token is invalid, expired, or already used.',
  })
  resetPassword(@Body() dto: ResetPasswordDto): Promise<LogoutResponse> {
    return this.authService.resetPassword(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log out current user session' })
  @ApiOkResponse({
    description: 'Successfully logged out and session revoked.',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing access token.' })
  logout(
    @CurrentUser('id') userId: string,
    @CurrentUser('sessionId') sessionId: string,
    @Headers('authorization') authorization?: string,
  ): Promise<LogoutResponse> {
    return this.authService.logout(userId, sessionId, authorization);
  }
}
