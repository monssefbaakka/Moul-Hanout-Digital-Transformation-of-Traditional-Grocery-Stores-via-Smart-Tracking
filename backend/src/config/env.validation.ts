const requiredEnvKeys = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
] as const;

const optionalMailEnvKeys = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'MAIL_FROM',
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

  const configuredMailKeys = optionalMailEnvKeys.filter((key) =>
    config[key]?.trim(),
  );
  const missingMailKeys = optionalMailEnvKeys.filter(
    (key) => !config[key]?.trim(),
  );

  if (
    configuredMailKeys.length > 0 &&
    configuredMailKeys.length !== optionalMailEnvKeys.length
  ) {
    throw new Error(
      `SMTP configuration is incomplete. Missing environment variables: ${missingMailKeys.join(', ')}`,
    );
  }

  const smtpPort = config.SMTP_PORT;

  if (smtpPort && (!/^\d+$/.test(smtpPort) || Number(smtpPort) <= 0)) {
    throw new Error('SMTP_PORT must be a positive integer');
  }

  return config;
}
