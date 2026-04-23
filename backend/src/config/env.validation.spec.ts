import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  it('accepts production configuration when SMTP is not configured', () => {
    const config = validateEnv({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/moul_hanout',
      JWT_SECRET: 'access-secret',
      JWT_REFRESH_SECRET: 'refresh-secret',
    });

    expect(config.NODE_ENV).toBe('production');
  });

  it('rejects incomplete SMTP configuration', () => {
    expect(() =>
      validateEnv({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/moul_hanout',
        JWT_SECRET: 'access-secret',
        JWT_REFRESH_SECRET: 'refresh-secret',
        SMTP_HOST: 'smtp.example.com',
      }),
    ).toThrow(
      'SMTP configuration is incomplete. Missing environment variables: SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM',
    );
  });

  it('rejects non-numeric SMTP ports', () => {
    expect(() =>
      validateEnv({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/moul_hanout',
        JWT_SECRET: 'access-secret',
        JWT_REFRESH_SECRET: 'refresh-secret',
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: 'invalid',
        SMTP_USER: 'smtp-user',
        SMTP_PASS: 'smtp-pass',
        MAIL_FROM: 'no-reply@example.com',
      }),
    ).toThrow('SMTP_PORT must be a positive integer');
  });
});
