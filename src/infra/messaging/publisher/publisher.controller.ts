import { Body, Controller, Post } from '@nestjs/common';
import { PublisherService } from './publisher.service';

@Controller('debug')
export class PublisherController {
  constructor(private readonly publisherService: PublisherService) {}

  @Post('publish')
  async publish(@Body() body: Record<string, unknown>) {
    await this.publisherService.publish(body);
    return { success: true };
  }
}
