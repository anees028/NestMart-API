import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);

  // ENABLE VALIDATION GLOBALLY
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Strips out unwanted properties (security!)
    forbidNonWhitelisted: true, // Throws error if unwanted properties are sent
  }));


}
bootstrap();
