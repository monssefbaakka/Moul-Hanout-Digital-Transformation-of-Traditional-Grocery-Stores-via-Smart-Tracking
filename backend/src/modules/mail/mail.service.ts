import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';

const PASSWORD_RESET_SUBJECT = 'Reset your Moul Hanout password';
const INVENTORY_ALERTS_SUBJECT_PREFIX = 'Moul Hanout inventory alerts';

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

type InventoryAlertItem = {
  productName: string;
  currentStock: number;
  lowStockThreshold: number;
  expirationDate?: string | null;
};

type InventoryAlertEmailInput = {
  shopName: string;
  recipientName?: string;
  lowStock: InventoryAlertItem[];
  expiringSoon: InventoryAlertItem[];
};

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

  isMailEnabled() {
    return this.isEnabled && !!this.transporter && !!this.fromAddress;
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

  async sendInventoryAlertEmail(
    to: string,
    input: InventoryAlertEmailInput,
  ): Promise<void> {
    if (!this.isEnabled || !this.transporter || !this.fromAddress) {
      throw new InternalServerErrorException(
        'Inventory alert email is not configured',
      );
    }

    const subject = this.buildInventoryAlertSubject(input);
    const text = this.buildInventoryAlertText(input);
    const html = this.buildInventoryAlertHtml(input);

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject,
        text,
        html,
      });
    } catch (error) {
      const stack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to send inventory alert email to ${to}.`,
        stack,
      );

      throw new InternalServerErrorException(
        'Unable to send inventory alert email',
      );
    }
  }

  private buildInventoryAlertSubject(input: InventoryAlertEmailInput) {
    const parts: string[] = [];

    if (input.lowStock.length > 0) {
      parts.push(`${input.lowStock.length} low stock`);
    }

    if (input.expiringSoon.length > 0) {
      parts.push(`${input.expiringSoon.length} expiring soon`);
    }

    return `${INVENTORY_ALERTS_SUBJECT_PREFIX} - ${parts.join(' / ')} - ${input.shopName}`;
  }

  private buildInventoryAlertText(input: InventoryAlertEmailInput) {
    const greeting = input.recipientName
      ? `Hello ${input.recipientName},`
      : 'Hello,';
    const lines = [
      greeting,
      '',
      `Here is the latest inventory alert summary for ${input.shopName}.`,
      '',
    ];

    if (input.lowStock.length > 0) {
      lines.push('Low stock products:');
      lines.push(
        ...input.lowStock.map(
          (item) =>
            `- ${item.productName}: ${item.currentStock} remaining (threshold ${item.lowStockThreshold})`,
        ),
      );
      lines.push('');
    }

    if (input.expiringSoon.length > 0) {
      lines.push('Products expiring soon:');
      lines.push(
        ...input.expiringSoon.map(
          (item) =>
            `- ${item.productName}: expires on ${item.expirationDate ?? 'unknown date'} (stock ${item.currentStock})`,
        ),
      );
      lines.push('');
    }

    lines.push(
      'Please review the inventory dashboard to plan restocking or removal actions.',
    );

    return lines.join('\n');
  }

  private buildInventoryAlertHtml(input: InventoryAlertEmailInput) {
    const lowStockHtml =
      input.lowStock.length > 0
        ? `
          <h2>Low stock products</h2>
          <ul>
            ${input.lowStock
              .map(
                (item) =>
                  `<li><strong>${item.productName}</strong>: ${item.currentStock} remaining (threshold ${item.lowStockThreshold})</li>`,
              )
              .join('')}
          </ul>
        `
        : '';

    const expiringSoonHtml =
      input.expiringSoon.length > 0
        ? `
          <h2>Products expiring soon</h2>
          <ul>
            ${input.expiringSoon
              .map(
                (item) =>
                  `<li><strong>${item.productName}</strong>: expires on ${item.expirationDate ?? 'unknown date'} (stock ${item.currentStock})</li>`,
              )
              .join('')}
          </ul>
        `
        : '';

    return `
      <p>Hello${input.recipientName ? ` ${input.recipientName}` : ''},</p>
      <p>Here is the latest inventory alert summary for <strong>${input.shopName}</strong>.</p>
      ${lowStockHtml}
      ${expiringSoonHtml}
      <p>Please review the inventory dashboard to plan restocking or removal actions.</p>
    `;
  }
}
