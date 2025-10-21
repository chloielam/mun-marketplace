// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';
// import { UsersService } from './users/users.service';
// import { UserRole } from './users/users.entity';

// async function bootstrap() {
//   const app = await NestFactory.createApplicationContext(AppModule);

//   const usersService = app.get(UsersService);

//   // Create 2 sample users
//   await usersService.createUser('Happy son', 'happy@mun.com', UserRole.BUYER, 'password123');
//   await usersService.createUser('Good Smith', 'good@mun.com', UserRole.SELLER, 'password456');

//   console.log('Sample users created!');

  
//   await app.close();
// }

// bootstrap();
