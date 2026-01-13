import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { MailerService } from '@nestjs-modules/mailer'; // Import this

@Controller()
export class EmailServiceController {
  
  constructor(private readonly mailerService: MailerService) {} // Inject it

  @EventPattern('order_created')
  async handleOrderCreated(@Payload() data: any) {
    console.log('📨 Received Order Event. Sending Email...');

    try {
      await this.mailerService.sendMail({
        to: data.userEmail,
        // from: defaults are used
        subject: `Order #${data.orderId} Confirmed!`,
        template: 'order-confirmation', // The name of your .hbs file
        context: { // Data to be sent to the template file
          name: data.userName,
          orderId: data.orderId,
          totalPrice: Number.parseInt(data.totalPrice),
        },
      });
      console.log('✅ Email sent successfully!');
    } catch (error) {
      console.error('❌ Error sending email:', error);
    }
  }
}