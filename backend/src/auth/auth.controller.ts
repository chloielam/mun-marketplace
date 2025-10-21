import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotDto } from './dto/forgot.dto';
import { ResetDto } from './dto/reset.dto';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('send-otp')
  sendOtp(@Body() dto: SendOtpDto) { return this.auth.sendOtp(dto.email); }

  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto) { return this.auth.verifyOtp(dto.email, dto.code); }

  @Post('register')
  register(@Body() dto: RegisterDto) { return this.auth.register(dto.email, dto.fullName, dto.password); }

  @Post('login')
  login(@Body() dto: LoginDto) { return this.auth.login(dto.email, dto.password); }

  @Post('forgot-password')
  forgot(@Body() dto: ForgotDto) { return this.auth.forgotPassword(dto.email); }

  @Post('reset-password')
  reset(@Body() dto: ResetDto) { return this.auth.resetPassword(dto.email, dto.code, dto.newPassword); }
}
