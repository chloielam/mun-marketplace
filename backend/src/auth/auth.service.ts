import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { OtpCode } from './otp.entity';
import { MailerService } from '../common/mailer.service';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/modules/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private otpTtlMs: number;
  private maxOtpsPerHour: number;
  private maxAttempts = 5;

  constructor(
    @InjectRepository(OtpCode) private otpRepo: Repository<OtpCode>,
    private mailer: MailerService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {
    this.otpTtlMs = (Number(this.config.get('OTP_TTL_MINUTES') || 10)) * 60 * 1000;
    this.maxOtpsPerHour = Number(this.config.get('MAX_OTPS_PER_HOUR') || 5);
  }

  private genCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOtp(email: string) {
    if (!email.endsWith('@mun.ca')) throw new BadRequestException('Only MUN email addresses allowed');

    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentCount = await this.otpRepo.count({ where: { email, createdAt: MoreThan(new Date(oneHourAgo)) } });
    if (recentCount >= this.maxOtpsPerHour) throw new ForbiddenException('Too many requests');

    const raw = this.genCode();
    const codeHash = await bcrypt.hash(raw, 10);
    const expiresAt = Date.now() + this.otpTtlMs;

    const otp = this.otpRepo.create({ email, codeHash, expiresAt });
    await this.otpRepo.save(otp);

    await this.mailer.sendOtp(email, raw);

    return { message: 'OTP sent' };
  }

  async verifyOtp(email: string, code: string) {
    const otp = await this.otpRepo.findOne({ where: { email, used: false }, order: { createdAt: 'DESC' } });
    if (!otp) throw new BadRequestException('No OTP found');

    if (otp.expiresAt < Date.now()) throw new BadRequestException('OTP expired');

    if (otp.attempts >= this.maxAttempts) throw new ForbiddenException('Too many attempts');

    const ok = await bcrypt.compare(code, otp.codeHash);
    if (!ok) {
      otp.attempts += 1;
      await this.otpRepo.save(otp);
      throw new BadRequestException('Invalid OTP');
    }

    otp.used = true;
    await this.otpRepo.save(otp);

    // create or mark verified
    const user = await this.usersService.findOrCreate(email);
    await this.usersService.markVerified(email);

    return { message: 'Verified' };
  }

  // register after verification: set password and full name
  async register(email: string, fullName: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.is_email_verified) throw new BadRequestException('Email not verified');
    const hash = await bcrypt.hash(password, 10);
    await this.usersService.setPassword(email, hash);
    await this.usersService.markVerified(email);
    return { message: 'Registered' };
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.password_hash) throw new BadRequestException('Invalid credentials');

    // need to select passwordHash (select:false). We'll query directly:
    const userWithPwd = await this.usersService['usersRepo'].findOne({ where: { email }, select: ['id','email','passwordHash','isVerified','fullName'] });
    if (!userWithPwd) throw new BadRequestException('Invalid credentials');

    const ok = await bcrypt.compare(password, userWithPwd.passwordHash);
    if (!ok) throw new BadRequestException('Invalid credentials');

    if (!userWithPwd.isVerified) throw new BadRequestException('Email not verified');

    const token = this.jwtService.sign({ sub: userWithPwd.id, email: userWithPwd.email });
    return { access_token: token, user: { id: userWithPwd.id, email: userWithPwd.email, fullName: userWithPwd.fullName } };
  }

  async forgotPassword(email: string) {
    // only send if user exists
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new BadRequestException('Email not registered');
    return this.sendOtp(email);
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    // verify OTP
    const otp = await this.otpRepo.findOne({ where: { email, used: false }, order: { createdAt: 'DESC' } });
    if (!otp) throw new BadRequestException('No OTP found');
    if (otp.expiresAt < Date.now()) throw new BadRequestException('OTP expired');

    const ok = await bcrypt.compare(code, otp.codeHash);
    if (!ok) throw new BadRequestException('Invalid OTP');

    otp.used = true;
    await this.otpRepo.save(otp);

    const hash = await bcrypt.hash(newPassword, 10);
    await this.usersService.setPassword(email, hash);

    return { message: 'Password reset successful' };
  }
}
