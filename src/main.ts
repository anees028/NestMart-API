import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ENABLE VALIDATION GLOBALLY
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Strips out unwanted properties (security!)
    forbidNonWhitelisted: true, // Throws error if unwanted properties are sent
  }));

  // 2. SWAGGER CONFIGURATION
  const config = new DocumentBuilder()
    .setTitle('NestMart API')
    .setDescription('The NestMart API description')
    .setVersion('1.0')
    .addTag('users') // Optional: organizes endpoints by tag
    .build();

  // 3. Create the document
  const document = SwaggerModule.createDocument(app, config);

  // 4. Setup the route for the docs (e.g., /api)
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);

}
bootstrap();
