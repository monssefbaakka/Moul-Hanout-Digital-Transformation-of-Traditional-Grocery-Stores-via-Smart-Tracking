import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';

const PASSWORD_RESET_SUBJECT = 'Reset your Moul Hanout password';

interface PasswordResetMailTransporter {
  sendMail(options: {
    from: string;
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<unknown>;
}

type CreateMailTransport = (options: {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}) => PasswordResetMailTransporter;

const createMailTransport = createTransport as unknown as CreateMailTransport;

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly isEnabled: boolean;
  private readonly isProduction: boolean;
  private readonly fromAddress?: string;
  private readonly transporter?: PasswordResetMailTransporter;

  constructor(private readonly config: ConfigService) {
    this.isEnabled = this.config.get<boolean>('mail.isEnabled') ?? false;
    this.isProduction = this.config.get<string>('app.env') === 'production';
    this.fromAddress = this.config.get<string>('mail.from');

    if (!this.isEnabled) {
      return;
    }

    this.transporter = createMailTransport({
      host: this.config.getOrThrow<string>('mail.host'),
      port: this.config.getOrThrow<number>('mail.port'),
      secure: this.config.get<boolean>('mail.secure') ?? false,
      auth: {
        user: this.config.getOrThrow<string>('mail.user'),
        pass: this.config.getOrThrow<string>('mail.pass'),
      },
    });
  }

  async sendPasswordResetEmail(to: string, link: string): Promise<void> {
    if (!this.isEnabled || !this.transporter || !this.fromAddress) {
      if (this.isProduction) {
        throw new InternalServerErrorException(
          'Password reset email is not configured for production',
        );
      }

      this.logger.log(`Password reset link for ${to}: ${link}`);
      return;
    }

    const text = [
      'We received a request to reset your Moul Hanout password.',
      `Use this link to choose a new password: ${link}`,
      'If you did not request this email, you can safely ignore it.',
    ].join('\n\n');

    const html = `
      <p>We received a request to reset your Moul Hanout password.</p>
      <p><a href="${link}">Reset your password</a></p>
      <p>If you did not request this email, you can safely ignore it.</p>
    `;

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject: PASSWORD_RESET_SUBJECT,
        text,
        html,
      });
    } catch (error) {
      const stack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to send password reset email to ${to}. Password reset link: ${link}`,
        stack,
      );

      throw new InternalServerErrorException(
        'Unable to send password reset email',
      );
    }
  }
}
