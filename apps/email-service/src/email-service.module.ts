import { Module } from '@nestjs/common';
import { EmailServiceController } from './email-service.controller';
import { EmailServiceService } from './email-service.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

@Module({
  imports: [
    MailerModule.forRoot({
      // 1. SMTP Configuration (Using Ethereal for testing)
      transport: {
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: 'hannah.kuphal47@ethereal.email', // We will generate this in a moment
          pass: 'gmBBPgzcug11BEz1yk',
        },
      },
      defaults: {
        from: '"NestMart Support" <noreply@nestmart.com>',
      },
      // 2. Template Configuration
      template: {
        dir: process.cwd() + '/apps/email-service/src/templates/',
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
  ],
  controllers: [EmailServiceController],
  providers: [EmailServiceService],
})
export class EmailServiceModule {}
