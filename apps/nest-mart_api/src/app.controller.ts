import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('App')
@Controller('App')
export class AppController {
  constructor(private readonly appService: AppService) {}
  
  @Get()
  @ApiOperation({ summary: 'Get main app' })
  getHello(): string {
    return this.appService.getHello();
  }
}
