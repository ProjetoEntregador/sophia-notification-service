import { Module } from '@nestjs/common';
import { PublisherService } from './publisher.service';
import { PublisherController } from './publisher.controller';

@Module({
  exports: [PublisherService],
  controllers: [PublisherController],
  providers: [PublisherService],
})
export class PublisherModule {}
