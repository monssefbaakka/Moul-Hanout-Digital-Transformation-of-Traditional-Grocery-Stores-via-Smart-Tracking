import { registerAs } from '@nestjs/config';

const DEFAULT_PASSWORD_RESET_EXPIRY_MINUTES = 30;

export const authConfig = registerAs('auth', () => {
  const configuredMinutes = parseInt(
    process.env.AUTH_PASSWORD_RESET_EXPIRES_IN_MINUTES ??
      `${DEFAULT_PASSWORD_RESET_EXPIRY_MINUTES}`,
    10,
  );

  return {
    passwordResetExpiresInMinutes:
      Number.isFinite(configuredMinutes) && configuredMinutes > 0
        ? configuredMinutes
        : DEFAULT_PASSWORD_RESET_EXPIRY_MINUTES,
  };
});
