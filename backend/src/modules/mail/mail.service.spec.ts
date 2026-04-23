import { InternalServerErrorException, Logger } from '@nestjs/common';
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
      'app.env': 'development',
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

  it('fails clearly in production when SMTP is not configured', async () => {
    const configService = createConfigService({
      'app.env': 'production',
      'mail.isEnabled': false,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    const service = module.get<MailService>(MailService);

    await expect(
      service.sendPasswordResetEmail(
        'owner@moulhanout.ma',
        'https://app.moulhanout.ma/reset-password?token=abc',
      ),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('sends a password reset email when SMTP is configured', async () => {
    const configService = createConfigService({
      'app.env': 'production',
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

  it('fails when the configured SMTP delivery throws an error', async () => {
    mockSendMail.mockRejectedValueOnce(new Error('SMTP unavailable'));

    const configService = createConfigService({
      'app.env': 'production',
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
    const loggerSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    await expect(
      service.sendPasswordResetEmail(
        'owner@moulhanout.ma',
        'https://app.moulhanout.ma/reset-password?token=abc',
      ),
    ).rejects.toBeInstanceOf(InternalServerErrorException);

    expect(loggerSpy).toHaveBeenCalledWith(
      'Failed to send password reset email to owner@moulhanout.ma. Password reset link: https://app.moulhanout.ma/reset-password?token=abc',
      expect.any(String),
    );
  });

  it('sends grouped inventory alerts when SMTP is configured', async () => {
    const configService = createConfigService({
      'app.env': 'production',
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

    await service.sendInventoryAlertEmail('owner@moulhanout.ma', {
      shopName: 'Main Shop',
      recipientName: 'Store Owner',
      lowStock: [
        {
          productName: 'Milk 1L',
          currentStock: 2,
          lowStockThreshold: 5,
          expirationDate: null,
        },
      ],
      expiringSoon: [
        {
          productName: 'Yogurt',
          currentStock: 4,
          lowStockThreshold: 3,
          expirationDate: '2026-04-24T00:00:00.000Z',
        },
      ],
    });

    const mailCalls = mockSendMail.mock.calls as [PasswordResetMail][];
    const sentMail = mailCalls[0]?.[0];

    expect(sentMail).toMatchObject({
      from: 'noreply@moulhanout.ma',
      to: 'owner@moulhanout.ma',
      subject:
        'Moul Hanout inventory alerts - 1 low stock / 1 expiring soon - Main Shop',
    });
    expect(sentMail?.text).toContain('Low stock products:');
    expect(sentMail?.text).toContain('Products expiring soon:');
    expect(sentMail?.html).toContain('Milk 1L');
    expect(sentMail?.html).toContain('Yogurt');
  });
});
