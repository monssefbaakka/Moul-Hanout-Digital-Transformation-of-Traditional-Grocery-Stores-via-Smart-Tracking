import { registerAs } from '@nestjs/config';

const DEFAULT_SMTP_PORT = 587;
const SMTP_TLS_PORT = 465;

const mailEnvKeys = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'MAIL_FROM',
] as const;

export const mailConfig = registerAs('mail', () => {
  const isEnabled = mailEnvKeys.every((key) => process.env[key]?.trim());
  const port = isEnabled
    ? parseInt(process.env.SMTP_PORT ?? `${DEFAULT_SMTP_PORT}`, 10)
    : DEFAULT_SMTP_PORT;

  return {
    isEnabled,
    host: process.env.SMTP_HOST,
    port,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.MAIL_FROM,
    secure: port === SMTP_TLS_PORT,
  };
});
