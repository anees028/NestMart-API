import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class EmailServiceController {
  
  // "order_created" is the TOPIC name we will listen to
  @EventPattern('order_created')
  handleOrderCreated(@Payload() data: any) {
    // In real life, you would use a library like 'nodemailer' here
    console.log('------------------------------------------------');
    console.log('📧 EMAIL SERVICE: Received Order Event!');
    console.log(`To: ${data.userEmail}`);
    console.log(`Subject: Order #${data.orderId} Confirmed`);
    console.log('------------------------------------------------');
  }
}