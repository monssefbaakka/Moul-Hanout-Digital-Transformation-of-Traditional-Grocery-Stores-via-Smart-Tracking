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
  ApiNoContentResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
} from './dto/auth.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../../common/guards/jwt-auth.guard';
import { SetMetadata } from '@nestjs/common';

const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user and return tokens' })
  @ApiOkResponse({ description: 'Successfully authenticated. Returns access and refresh tokens.' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials or account deactivated.' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiCreatedResponse({ description: 'Account successfully created.' })
  @ApiConflictResponse({ description: 'Email address already in use.' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using a valid refresh token' })
  @ApiOkResponse({ description: 'Tokens successfully refreshed.' })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired refresh token.' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Log out current user session' })
  @ApiNoContentResponse({ description: 'Successfully logged out and session revoked.' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing access token.' })
  logout(
    @CurrentUser('id') userId: string,
    @CurrentUser('sessionId') sessionId: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.authService.logout(userId, sessionId, authorization);
  }
}
