import { NestFactory } from '@nestjs/core';
import { AppModule } from './../src/app.module';
import { MailerService } from './../src/common/mailer.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const mailer = app.get(MailerService);

  const testEmail = 'asharma25@mun.ca'; // Replace with your email
  const testOtp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    await mailer.sendOtp(testEmail, testOtp);
    console.log(`✅ OTP sent to ${testEmail}: ${testOtp}`);
  } catch (err) {
    console.error('❌ Failed to send OTP:', err);
  }

  await app.close();
}

bootstrap();
