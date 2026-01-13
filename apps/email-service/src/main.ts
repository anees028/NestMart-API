import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { EmailServiceModule } from './email-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    EmailServiceModule,
    {
      transport: Transport.KAFKA,
      options: {
        client: {
          brokers: ['localhost:9092'], // Connect to Kafka Docker
        },
        consumer: {
          groupId: 'email-consumer', // Unique ID for this worker group
        },
      },
    },
  );
  await app.listen();
}
bootstrap();