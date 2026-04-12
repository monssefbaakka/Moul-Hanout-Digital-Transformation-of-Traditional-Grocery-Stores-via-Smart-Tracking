import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Data transfer object for user login.
 */
export class LoginDto {
  @ApiProperty({
    description: 'The email address of the user',
    example: 'owner@moulhanout.ma',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: 'The user password (min 8 characters)',
    example: 'Admin@123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}

/**
 * Data transfer object for user registration.
 */
export class RegisterDto {
  @ApiProperty({
    description: 'The full name of the user',
    example: 'John Doe',
    minLength: 2,
    maxLength: 80,
  })
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(80, { message: 'Name cannot exceed 80 characters' })
  name: string;

  @ApiProperty({
    description: 'The email address for the new account',
    example: 'cashier@moulhanout.ma',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: 'Secure password for the new account (min 8 characters)',
    example: 'Cashier@123!',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;
}

/**
 * Data transfer object for refreshing access tokens.
 */
export class RefreshTokenDto {
  @ApiProperty({
    description: 'The valid refresh token string',
  })
  @IsString()
  @IsNotEmpty({ message: 'Refresh token is required' })
  refreshToken: string;
}
