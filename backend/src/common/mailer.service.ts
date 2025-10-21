import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailerService {
  private transporter;
  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.config.get('GMAIL_USER'),
        pass: this.config.get('GMAIL_PASS'),
      },
    });
  }

  async sendOtp(email: string, code: string) {
    await this.transporter.sendMail({
      from: this.config.get('GMAIL_USER'),
      to: email,
      subject: 'MUN Marketplace — your verification code',
      text: `Your OTP code: ${code}. It expires in ${this.config.get('OTP_TTL_MINUTES') || 10} minutes.`,
    });
  }
}
