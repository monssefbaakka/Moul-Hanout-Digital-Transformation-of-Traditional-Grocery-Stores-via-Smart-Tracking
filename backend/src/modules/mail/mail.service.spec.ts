import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { createTransport } from 'nodemailer';
import { MailService } from './mail.service';

const mockSendMail = jest.fn();

jest.mock('nodemailer');

interface PasswordResetMail {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}

describe('MailService', () => {
  const createConfigService = (
    values: Record<string, string | number | boolean | undefined>,
  ) => ({
    get: jest.fn((key: string) => values[key]),
    getOrThrow: jest.fn((key: string) => {
      const value = values[key];

      if (value === undefined) {
        throw new Error(`Missing config key: ${key}`);
      }

      return value;
    }),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (createTransport as jest.Mock).mockReturnValue({
      sendMail: mockSendMail,
    });
  });

  it('logs the reset link when SMTP is not configured', async () => {
    const configService = createConfigService({
      'mail.isEnabled': false,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    const service = module.get<MailService>(MailService);
    const loggerSpy = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);

    await service.sendPasswordResetEmail(
      'owner@moulhanout.ma',
      'http://localhost:3000/reset-password?token=abc',
    );

    expect(createTransport).not.toHaveBeenCalled();
    expect(mockSendMail).not.toHaveBeenCalled();
    expect(loggerSpy).toHaveBeenCalledWith(
      'Password reset link for owner@moulhanout.ma: http://localhost:3000/reset-password?token=abc',
    );
  });

  it('sends a password reset email when SMTP is configured', async () => {
    const configService = createConfigService({
      'mail.isEnabled': true,
      'mail.host': 'smtp.example.com',
      'mail.port': 587,
      'mail.secure': false,
      'mail.user': 'smtp-user',
      'mail.pass': 'smtp-pass',
      'mail.from': 'noreply@moulhanout.ma',
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    const service = module.get<MailService>(MailService);

    await service.sendPasswordResetEmail(
      'owner@moulhanout.ma',
      'https://app.moulhanout.ma/reset-password?token=abc',
    );

    expect(createTransport).toHaveBeenCalledWith({
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      auth: {
        user: 'smtp-user',
        pass: 'smtp-pass',
      },
    });
    expect(mockSendMail).toHaveBeenCalledTimes(1);

    const mailCalls = mockSendMail.mock.calls as [PasswordResetMail][];
    const sentMail = mailCalls[0]?.[0];

    expect(sentMail).toMatchObject({
      from: 'noreply@moulhanout.ma',
      to: 'owner@moulhanout.ma',
      subject: 'Reset your Moul Hanout password',
    });

    expect(sentMail?.text).toContain(
      'https://app.moulhanout.ma/reset-password?token=abc',
    );
    expect(sentMail?.html).toContain(
      'https://app.moulhanout.ma/reset-password?token=abc',
    );
  });
});
