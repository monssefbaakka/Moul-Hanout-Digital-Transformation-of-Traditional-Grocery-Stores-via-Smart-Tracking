import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'owner@moulhanout.ma' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Admin@123!' })
  @IsString()
  @MinLength(8)
  password: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name: string;

  @ApiProperty({ example: 'cashier@moulhanout.ma' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Cashier@123!' })
  @IsString()
  @MinLength(8)
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}

export class ValidateTokenDto {
  @ApiProperty()
  @IsString()
  accessToken: string;
}
