# Email Service Setup Guide

This guide explains how to implement actual email sending in your NestJS microservice using `@nestjs-modules/mailer`.

## Overview

We'll convert simulated email logging into real email sending using:
- **@nestjs-modules/mailer**: Standard NestJS email module
- **Nodemailer**: Underlying email library
- **Handlebars**: Template engine for HTML emails
- **Ethereal Email**: Fake SMTP service for testing

---

## Step 1: Install Dependencies

Run this command in your project root:

```bash
npm install @nestjs-modules/mailer nodemailer handlebars
npm install --save-dev @types/nodemailer
```

---

## Step 2: Configure the Mailer Module

Configure the email service to connect to SMTP server.

**File:** `apps/email-service/src/email-service.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { EmailServiceController } from './email-service.controller';
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
          user: 'ethereal_user', // Replace with generated credentials
          pass: 'ethereal_pass',  // Replace with generated credentials
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
})
export class EmailServiceModule {}
```

---

## Step 3: Create Email Template

Professional emails use HTML templates with dynamic data.

### 3.1 Create Template Directory

```bash
mkdir -p apps/email-service/src/templates
```

### 3.2 Create Template File

**File:** `apps/email-service/src/templates/order-confirmation.hbs`

```html
<p>Hi {{ name }},</p>
<p>Thank you for your order!</p>
<p><strong>Order ID:</strong> {{ orderId }}</p>
<p><strong>Total Price:</strong> ${{ totalPrice }}</p>
<br />
<p>Your package is being prepared.</p>
<p>Best regards,<br />The NestMart Team</p>
```

### 3.3 Fix for Monorepos (CRITICAL)

By default, NestJS (Webpack) only copies `.ts` files during build and ignores `.hbs` files. We must tell it to copy template files.

**File:** `nest-cli.json` (project root)

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "apps/nest-mart_api/src",
  "compilerOptions": {
    "deleteOutDir": true,
    "webpack": true,
    "tsConfigPath": "apps/nest-mart_api/tsconfig.app.json",
    "assets": ["**/*.hbs"],
    "watchAssets": true
  },
  "monorepo": true,
  "root": "apps/nest-mart_api",
  "projects": {
    "email-service": {
      "type": "application",
      "root": "apps/email-service",
      "entryFile": "main",
      "sourceRoot": "apps/email-service/src",
      "compilerOptions": {
        "tsConfigPath": "apps/email-service/tsconfig.app.json",
        "assets": ["**/*.hbs"],
        "watchAssets": true
      }
    },
    "nest-mart_api": {
      "type": "application",
      "root": "apps/nest-mart_api",
      "entryFile": "main",
      "sourceRoot": "apps/nest-mart_api/src",
      "compilerOptions": {
        "tsConfigPath": "apps/nest-mart_api/tsconfig.app.json"
      }
    },
    "orders-worker": {
      "type": "application",
      "root": "apps/orders-worker",
      "entryFile": "main",
      "sourceRoot": "apps/orders-worker/src",
      "compilerOptions": {
        "tsConfigPath": "apps/orders-worker/tsconfig.app.json"
      }
    }
  }
}
```

**Important:** Stop and restart your servers after changing `nest-cli.json`.

---

## Step 4: Update Controller to Send Emails

Replace console logging with actual email sending.

**File:** `apps/email-service/src/email-service.controller.ts`

```typescript
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { MailerService } from '@nestjs-modules/mailer';

@Controller()
export class EmailServiceController {
  
  constructor(private readonly mailerService: MailerService) {}

  @EventPattern('order_created')
  async handleOrderCreated(@Payload() data: any) {
    console.log('📨 Received Order Event. Sending Email...');

    try {
      await this.mailerService.sendMail({
        to: data.userEmail,
        // from: defaults are used from module config
        subject: `Order #${data.orderId} Confirmed!`,
        template: 'order-confirmation', // Name of .hbs file (without extension)
        context: {
          // Data passed to template
          name: 'Valued Customer',
          orderId: data.orderId,
          totalPrice: data.totalPrice,
        },
      });
      console.log('✅ Email sent successfully!');
    } catch (error) {
      console.error('❌ Error sending email:', error);
    }
  }
}
```

---

## Step 5: Get Test Credentials (Ethereal)

Since we don't want to use real Gmail (security/spam issues), use Ethereal for testing.

### 5.1 Generate Credentials

1. Go to [https://ethereal.email](https://ethereal.email)
2. Click **"Create Ethereal Account"**
3. Copy the generated **Username** and **Password**

### 5.2 Update Configuration

Replace the credentials in `apps/email-service/src/email-service.module.ts`:

```typescript
transport: {
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: 'your-ethereal-username@ethereal.email', // Paste here
    pass: 'your-ethereal-password',                 // Paste here
  },
},
```

---

## Step 6: Test the Full Flow

### 6.1 Start Services

```bash
# Terminal 1: Start main API
npm run start:nest-mart:dev

# Terminal 2: Start email service
npm run start:email:dev

# Make sure Kafka/Redis Docker containers are running
docker-compose up -d
```

### 6.2 Trigger Order Creation

Send a POST request to create an order:

**Endpoint:** `POST http://localhost:3000/orders`

**Body:**
```json
{
  "userId": 1,
  "items": [
    { "productId": 1, "quantity": 2 }
  ],
  "userEmail": "customer@example.com"
}
```

### 6.3 Check Terminal Output

You should see:
```
📨 Received Order Event. Sending Email...
✅ Email sent successfully!
```

### 6.4 View the Email

1. Go back to [https://ethereal.email](https://ethereal.email)
2. Click **"Open Mailbox"**
3. You'll see the actual HTML email with your order details!

---

## Troubleshooting

### Templates Not Found Error

**Error:** `Template "order-confirmation" not found`

**Solution:**
- Ensure `assets: ["**/*.hbs"]` is added to `nest-cli.json`
- Restart both development servers
- Check template path is correct: `apps/email-service/src/templates/`

### SMTP Connection Errors

**Error:** `Connection timeout` or `Authentication failed`

**Solution:**
- Verify Ethereal credentials are correct
- Check internet connection
- Ensure port 587 is not blocked by firewall

### Email Not Received in Ethereal

**Solution:**
- Check email-service console for errors
- Verify event is being published from main API
- Ensure Kafka/message broker is running
- Check `userEmail` field is included in order payload

---

## Production Configuration

For production, replace Ethereal with a real email service:

### Option 1: Gmail

```typescript
transport: {
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD, // Use App Password, not regular password
  },
},
```

### Option 2: SendGrid

```typescript
transport: {
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY,
  },
},
```

### Option 3: AWS SES

```typescript
transport: {
  host: 'email-smtp.us-east-1.amazonaws.com',
  port: 587,
  auth: {
    user: process.env.AWS_SES_USER,
    pass: process.env.AWS_SES_PASSWORD,
  },
},
```

### Environment Variables

Create `.env` file:

```env
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASS=your-password
EMAIL_FROM="NestMart Support" <noreply@nestmart.com>
```

Update module configuration:

```typescript
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get('SMTP_HOST'),
          port: config.get('SMTP_PORT'),
          auth: {
            user: config.get('SMTP_USER'),
            pass: config.get('SMTP_PASS'),
          },
        },
        defaults: {
          from: config.get('EMAIL_FROM'),
        },
        template: {
          dir: process.cwd() + '/apps/email-service/src/templates/',
          adapter: new HandlebarsAdapter(),
          options: { strict: true },
        },
      }),
    }),
  ],
})
export class EmailServiceModule {}
```

---

## Additional Template Examples

### Welcome Email

**File:** `apps/email-service/src/templates/welcome.hbs`

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Welcome to NestMart, {{ name }}! 🎉</h2>
  <p>Thank you for joining our community.</p>
  <p>Start exploring our products and enjoy exclusive deals!</p>
  <a href="{{ verificationLink }}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">
    Verify Email
  </a>
  <p>Best regards,<br />The NestMart Team</p>
</div>
```

### Password Reset

**File:** `apps/email-service/src/templates/password-reset.hbs`

```html
<p>Hi {{ name }},</p>
<p>You requested to reset your password.</p>
<p>Click the link below to reset your password:</p>
<a href="{{ resetLink }}">Reset Password</a>
<p>This link expires in 1 hour.</p>
<p>If you didn't request this, please ignore this email.</p>
<p>Best regards,<br />The NestMart Team</p>
```

---

## Summary

✅ Installed `@nestjs-modules/mailer` and dependencies  
✅ Configured SMTP with Ethereal for testing  
✅ Created HTML email templates with Handlebars  
✅ Fixed monorepo asset copying in `nest-cli.json`  
✅ Updated controller to send actual emails  
✅ Tested full flow from order creation to email delivery  

Your email service is now ready for production with real SMTP providers!