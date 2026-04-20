const requiredEnvKeys = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
] as const;

type EnvRecord = Record<string, string | undefined>;

export function validateEnv(config: EnvRecord): EnvRecord {
  const missingKeys = requiredEnvKeys.filter((key) => !config[key]?.trim());

  if (missingKeys.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingKeys.join(', ')}`,
    );
  }

  const passwordResetExpiry = config.AUTH_PASSWORD_RESET_EXPIRES_IN_MINUTES;

  if (
    passwordResetExpiry &&
    (!/^\d+$/.test(passwordResetExpiry) || Number(passwordResetExpiry) <= 0)
  ) {
    throw new Error(
      'AUTH_PASSWORD_RESET_EXPIRES_IN_MINUTES must be a positive integer',
    );
  }

  return config;
}
